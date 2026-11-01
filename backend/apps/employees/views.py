from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from .models import EmployeeProfile, EmployeeStatus
from .serializers import (
    EmployeeProfileSerializer,
    EmployeeCreateSerializer,
    EmployeeUpdateSerializer,
)
from .permissions import CanManageEmployee
from .services import (
    create_employee,
    deactivate_employee,
    activate_employee,
)
from apps.core.tenancy import TenantScopedViewSetMixin
from apps.core.pagination import StandardResultsSetPagination
from apps.accounts.services.audit_service import get_client_ip, get_client_user_agent
from apps.organizations.models import Organization, OrganizationMembership, UserRole


@extend_schema(tags=['Employees'])
class EmployeeViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    """
    Employee Management ViewSet.
    Handles staff provisioning, role delegation, branch allocation, and active status.
    """
    queryset = EmployeeProfile.objects.select_related(
        'membership',
        'membership__user',
        'membership__organization',
        'membership__branch',
    ).all()
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated, CanManageEmployee]
    tenant_field = 'membership__organization'
    branch_field = 'membership__branch'

    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeeCreateSerializer
        if self.action in ['update', 'partial_update']:
            return EmployeeUpdateSerializer
        return EmployeeProfileSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        # Filter by branch
        branch_param = self.request.query_params.get('branch')
        if branch_param:
            qs = qs.filter(membership__branch_id=branch_param)

        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param and status_param in EmployeeStatus.values:
            qs = qs.filter(status=status_param)

        # Filter by role
        role_param = self.request.query_params.get('role')
        if role_param and role_param in UserRole.values:
            qs = qs.filter(membership__role=role_param)

        # Search query (name, email, employee code)
        search = self.request.query_params.get('search')
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(employee_code__icontains=search)
                | Q(membership__user__email__icontains=search)
                | Q(membership__user__first_name__icontains=search)
                | Q(membership__user__last_name__icontains=search)
            )

        return qs

    def create(self, request, *args, **kwargs):
        serializer = EmployeeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        org_id = request.data.get('organization_id')
        if not org_id:
            # Fall back to user's first active organization
            user_membership = OrganizationMembership.objects.filter(
                user=user,
                is_active=True,
            ).first()
            if not user_membership:
                raise ValidationError({'organization_id': 'Organization context is required.'})
            organization = user_membership.organization
        else:
            try:
                organization = Organization.objects.get(id=org_id)
            except Organization.DoesNotExist:
                raise ValidationError({'organization_id': 'Specified organization does not exist.'})

        # Anti-spoofing validation
        self.validate_tenant_assignment(organization)

        employee = create_employee(
            actor=user,
            organization=organization,
            data=serializer.validated_data,
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
        )

        return Response(
            EmployeeProfileSerializer(employee).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        summary='Deactivate employee',
        description='Deactivate an employee and immediately suspend their organization access.',
        responses={200: EmployeeProfileSerializer},
    )
    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate(self, request, pk=None):
        employee = self.get_object()
        deactivated = deactivate_employee(
            actor=request.user,
            employee=employee,
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
        )
        return Response(EmployeeProfileSerializer(deactivated).data, status=status.HTTP_200_OK)

    @extend_schema(
        summary='Activate employee',
        description='Reactivate an employee and restore their organization membership.',
        responses={200: EmployeeProfileSerializer},
    )
    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        employee = self.get_object()
        activated = activate_employee(
            actor=request.user,
            employee=employee,
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
        )
        return Response(EmployeeProfileSerializer(activated).data, status=status.HTTP_200_OK)
