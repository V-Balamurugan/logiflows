from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from .models import Branch, BranchStatus, ServiceArea
from .serializers import (
    BranchSerializer,
    BranchUpdateSerializer,
    ServiceAreaSerializer,
)
from .permissions import CanManageBranch
from .services import (
    create_branch,
    assign_branch_manager,
    add_service_area,
    check_postal_serviceability,
)
from apps.core.tenancy import TenantScopedViewSetMixin
from apps.core.pagination import StandardResultsSetPagination
from apps.accounts.services.audit_service import get_client_ip, get_client_user_agent
from apps.organizations.models import OrganizationMembership, UserRole


@extend_schema(tags=['Branches'])
class BranchViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    """
    Branch Management ViewSet with strict multi-tenant isolation.
    Handles postal hub staging, service area allocation, and branch manager assignment.
    """
    queryset = Branch.objects.select_related('organization', 'manager').prefetch_related('service_areas').all()
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated, CanManageBranch]
    tenant_field = 'organization'
    branch_field = 'id'

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return BranchUpdateSerializer
        return BranchSerializer

    def perform_create(self, serializer):
        user = self.request.user
        org = serializer.validated_data.get('organization')

        # Anti-spoofing validation: user must have admin rights in this org
        self.validate_tenant_assignment(org)

        branch = create_branch(
            actor=user,
            data=serializer.validated_data,
            ip_address=get_client_ip(self.request),
            user_agent=get_client_user_agent(self.request),
        )
        serializer.instance = branch

    @extend_schema(
        summary='List or create service areas for branch',
        description='Returns all postal codes served by this branch, or defines a new serviceable area.',
        responses={200: ServiceAreaSerializer(many=True), 201: ServiceAreaSerializer},
    )
    @action(detail=True, methods=['get', 'post'], url_path='service-areas')
    def service_areas(self, request, pk=None):
        branch = self.get_object()

        if request.method == 'GET':
            areas = branch.service_areas.all().order_by('postal_code')
            serializer = ServiceAreaSerializer(areas, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # POST: add service area
        # Check permissions: owner/admin or this branch manager
        self.check_object_permissions(request, branch)
        serializer = ServiceAreaSerializer(data={**request.data, 'branch': branch.id})
        serializer.is_valid(raise_exception=True)

        postal_code = serializer.validated_data['postal_code']
        is_serviceable = serializer.validated_data.get('is_serviceable', True)

        area = add_service_area(
            actor=request.user,
            branch=branch,
            postal_code=postal_code,
            is_serviceable=is_serviceable,
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
        )

        return Response(ServiceAreaSerializer(area).data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary='Remove service area from branch',
        description='Deletes a specific postal code service area.',
        responses={204: None},
    )
    @action(detail=True, methods=['delete'], url_path=r'service-areas/(?P<area_id>[^/.]+)')
    def delete_service_area(self, request, pk=None, area_id=None):
        branch = self.get_object()
        self.check_object_permissions(request, branch)

        try:
            area = branch.service_areas.get(id=area_id)
        except ServiceArea.DoesNotExist:
            return Response(
                {'error': {'code': 'NOT_FOUND', 'message': 'Service area not found on this branch.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        area.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        summary='Deactivate branch',
        description='Deactivates this branch. Suspends new operations and service area delivery dispatches.',
        responses={200: BranchSerializer},
    )
    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate(self, request, pk=None):
        branch = self.get_object()
        self.check_object_permissions(request, branch)

        # Only Org Owner/Admin or Platform Admin can deactivate
        user = request.user
        if user.role != UserRole.PLATFORM_ADMIN:
            is_admin = OrganizationMembership.objects.filter(
                user=user,
                organization=branch.organization,
                is_active=True,
                role__in=[UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN],
            ).exists()
            if not is_admin:
                raise PermissionDenied('Only organization owners or admins can deactivate branches.')

        branch.status = BranchStatus.INACTIVE
        branch.save(update_fields=['status', 'updated_at'])

        return Response(BranchSerializer(branch).data, status=status.HTTP_200_OK)

    @extend_schema(
        summary='Activate branch',
        description='Reactivates an inactive branch.',
        responses={200: BranchSerializer},
    )
    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        branch = self.get_object()
        self.check_object_permissions(request, branch)

        user = request.user
        if user.role != UserRole.PLATFORM_ADMIN:
            is_admin = OrganizationMembership.objects.filter(
                user=user,
                organization=branch.organization,
                is_active=True,
                role__in=[UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN],
            ).exists()
            if not is_admin:
                raise PermissionDenied('Only organization owners or admins can activate branches.')

        branch.status = BranchStatus.ACTIVE
        branch.save(update_fields=['status', 'updated_at'])

        return Response(BranchSerializer(branch).data, status=status.HTTP_200_OK)


@extend_schema(tags=['Serviceability'])
class ServiceabilityCheckView(APIView):
    """
    Public and tenant-scoped serviceability check endpoint.
    Determines if postal code is serviceable and returns operating branch details.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Check postal code serviceability',
        description='Query serviceable postal codes across approved organizations and branches.',
        parameters=[
            OpenApiParameter('postal_code', OpenApiTypes.STR, OpenApiParameter.QUERY, required=True),
            OpenApiParameter('organization_id', OpenApiTypes.UUID, OpenApiParameter.QUERY, required=False),
        ],
        responses={200: OpenApiTypes.OBJECT},
    )
    def get(self, request):
        postal_code = request.query_params.get('postal_code')
        if not postal_code:
            raise ValidationError({'postal_code': 'Query parameter postal_code is required.'})

        org_id = request.query_params.get('organization_id')
        results = check_postal_serviceability(postal_code=postal_code, organization_id=org_id)

        return Response({
            'postal_code': postal_code.strip().upper(),
            'is_serviceable': len(results) > 0,
            'match_count': len(results),
            'providers': results,
        }, status=status.HTTP_200_OK)
