from django.db.models import Q
from rest_framework import status, viewsets, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from .models import Organization, OrganizationMembership, OrganizationStatus
from .serializers import (
    OrganizationRegistrationSerializer,
    OrganizationDetailSerializer,
    OrganizationUpdateSerializer,
    OrganizationActionReasonSerializer,
    OrganizationMembershipSerializer,
)
from .permissions import IsPlatformAdmin, CanManageOrganization
from .services import (
    register_organization,
    approve_organization,
    reject_organization,
    suspend_organization,
)
from apps.accounts.models import UserRole
from apps.accounts.services.audit_service import get_client_ip, get_client_user_agent
from apps.core.pagination import StandardResultsSetPagination


@extend_schema(tags=['Organizations'])
class OrganizationViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    Organization (Tenant) Management ViewSet.
    Handles tenant onboarding, approval, state transitions, and profile configuration.
    """
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.action in ['approve', 'reject', 'suspend']:
            return [IsPlatformAdmin()]
        if self.action == 'create':
            return [IsAuthenticated()]
        return [IsAuthenticated(), CanManageOrganization()]

    def get_serializer_class(self):
        if self.action == 'create':
            return OrganizationRegistrationSerializer
        if self.action in ['update', 'partial_update']:
            return OrganizationUpdateSerializer
        if self.action in ['reject', 'suspend']:
            return OrganizationActionReasonSerializer
        return OrganizationDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Organization.objects.none()

        if user.role == UserRole.PLATFORM_ADMIN:
            queryset = Organization.objects.all().order_by('-created_at')
        else:
            # Users can see organizations where they hold a membership (active or pending prospective owner)
            queryset = Organization.objects.filter(
                memberships__user=user,
            ).distinct().order_by('-created_at')

        # Filter by status if query parameter provided
        status_param = self.request.query_params.get('status')
        if status_param and status_param in OrganizationStatus.values:
            queryset = queryset.filter(status=status_param)

        # Search by name or code
        search_param = self.request.query_params.get('search')
        if search_param:
            search_param = search_param.strip()
            queryset = queryset.filter(
                Q(name__icontains=search_param)
                | Q(code__icontains=search_param)
                | Q(legal_name__icontains=search_param)
            )

        return queryset

    @extend_schema(
        summary='Register a new organization',
        description='Submit an organization onboarding application. Enters PENDING state awaiting Platform Admin approval.',
        responses={201: OrganizationDetailSerializer},
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ip_address = get_client_ip(request)
        user_agent = get_client_user_agent(request)

        organization = register_organization(
            applicant=request.user,
            data=serializer.validated_data,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        response_serializer = OrganizationDetailSerializer(organization)
        return Response(
            {
                'message': 'Organization application submitted successfully. It is now pending administrator review.',
                'organization': response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        summary='Approve organization',
        description='Approve a pending organization tenant. Activates owner membership and grants full access. (Platform Admin only)',
        responses={200: OrganizationDetailSerializer},
    )
    @action(detail=True, methods=['post'], permission_classes=[IsPlatformAdmin])
    def approve(self, request, pk=None):
        organization = self.get_object()
        ip_address = get_client_ip(request)
        user_agent = get_client_user_agent(request)

        approved_org = approve_organization(
            actor=request.user,
            organization=organization,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return Response(
            {
                'message': f"Organization '{approved_org.code}' has been approved successfully.",
                'organization': OrganizationDetailSerializer(approved_org).data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary='Reject organization',
        description='Reject a pending organization application with a mandatory documented reason. (Platform Admin only)',
        request=OrganizationActionReasonSerializer,
        responses={200: OrganizationDetailSerializer},
    )
    @action(detail=True, methods=['post'], permission_classes=[IsPlatformAdmin])
    def reject(self, request, pk=None):
        organization = self.get_object()
        serializer = OrganizationActionReasonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ip_address = get_client_ip(request)
        user_agent = get_client_user_agent(request)

        rejected_org = reject_organization(
            actor=request.user,
            organization=organization,
            reason=serializer.validated_data['reason'],
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return Response(
            {
                'message': f"Organization '{rejected_org.code}' has been rejected.",
                'organization': OrganizationDetailSerializer(rejected_org).data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary='Suspend organization',
        description='Suspend an approved organization tenant with a mandatory reason. Members cannot access tenant endpoints while suspended. (Platform Admin only)',
        request=OrganizationActionReasonSerializer,
        responses={200: OrganizationDetailSerializer},
    )
    @action(detail=True, methods=['post'], permission_classes=[IsPlatformAdmin])
    def suspend(self, request, pk=None):
        organization = self.get_object()
        serializer = OrganizationActionReasonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ip_address = get_client_ip(request)
        user_agent = get_client_user_agent(request)

        suspended_org = suspend_organization(
            actor=request.user,
            organization=organization,
            reason=serializer.validated_data['reason'],
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return Response(
            {
                'message': f"Organization '{suspended_org.code}' has been suspended.",
                'organization': OrganizationDetailSerializer(suspended_org).data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Organizations'])
class MyMembershipsView(APIView):
    """
    Endpoint returning all active organization memberships for the authenticated user.
    Used by frontend to populate tenant switchers and active session contexts.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Get active memberships for current user',
        description='Returns all organization memberships associated with the logged-in user.',
        responses={200: OrganizationMembershipSerializer(many=True)},
    )
    def get(self, request):
        memberships = OrganizationMembership.objects.filter(
            user=request.user,
        ).select_related('organization', 'user', 'branch').order_by('-created_at')
        serializer = OrganizationMembershipSerializer(memberships, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
