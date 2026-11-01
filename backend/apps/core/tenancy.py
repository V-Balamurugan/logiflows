import logging
from typing import Optional, Set
from django.db.models import QuerySet
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied, NotFound
from apps.accounts.models import UserRole
from apps.organizations.models import Organization, OrganizationMembership, OrganizationStatus
from apps.accounts.services.audit_service import log_audit_event

logger = logging.getLogger('apps.core.tenancy')


class TenantIsolationError(PermissionDenied):
    """Exception raised when a cross-tenant violation or spoofing attempt is detected."""
    default_detail = 'Access to resources outside your authorized organization tenant is forbidden.'
    default_code = 'TENANT_ISOLATION_VIOLATION'


def get_user_active_organization_ids(user) -> Set[str]:
    """
    Retrieve the set of approved, active organization IDs for the given user.
    Enforces that memberships must be active and the organization must be APPROVED.
    """
    if not user or not user.is_authenticated:
        return set()

    return set(
        OrganizationMembership.objects.filter(
            user=user,
            is_active=True,
            organization__status=OrganizationStatus.APPROVED,
        ).values_list('organization_id', flat=True)
    )


def get_user_branch_manager_scope(user, organization_id=None) -> Set[str]:
    """
    Retrieve branch IDs where the user has active BRANCH_MANAGER scope.
    """
    if not user or not user.is_authenticated:
        return set()

    qs = OrganizationMembership.objects.filter(
        user=user,
        is_active=True,
        role=UserRole.BRANCH_MANAGER,
        organization__status=OrganizationStatus.APPROVED,
    )
    if organization_id:
        qs = qs.filter(organization_id=organization_id)

    return set(qs.exclude(branch__isnull=True).values_list('branch_id', flat=True))


class IsTenantMember(permissions.BasePermission):
    """
    Permission class ensuring the request user has an active membership in the target tenant.
    Platform Administrators have explicit audited access.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.role == UserRole.PLATFORM_ADMIN:
            # Audit cross-tenant administrative inspection
            log_audit_event(
                action='PLATFORM_ADMIN_TENANT_ACCESS',
                actor=user,
                target_type=obj.__class__.__name__,
                target_id=str(getattr(obj, 'id', '')),
                metadata={'endpoint': request.path, 'method': request.method},
                request=request,
            )
            return True

        org = getattr(obj, 'organization', None) or (obj if isinstance(obj, Organization) else None)
        if not org:
            return False

        return OrganizationMembership.objects.filter(
            user=user,
            organization=org,
            is_active=True,
            organization__status=OrganizationStatus.APPROVED,
        ).exists()


class TenantScopedViewSetMixin:
    """
    DRF ViewSet Mixin that enforces strict multi-tenant isolation.
    1. Queryset is filtered strictly by the user's active, approved organizations.
    2. Branch managers are further scoped to their assigned branch.
    3. Anti-spoofing: Rejects any attempt to spoof organization identifiers in payload or headers.
    4. Cross-tenant access returns 404 (or 403 for administrative mutations).
    """
    tenant_field = 'organization'
    branch_field = 'branch'

    def get_queryset(self) -> QuerySet:
        base_qs = super().get_queryset()
        user = self.request.user

        if not user or not user.is_authenticated:
            return base_qs.none()

        # Platform Admin has global oversight
        if user.role == UserRole.PLATFORM_ADMIN:
            # Platform admin can optionally filter by ?organization_id=
            org_filter = self.request.query_params.get('organization_id')
            if org_filter:
                return base_qs.filter(**{f'{self.tenant_field}_id': org_filter})
            return base_qs

        # Regular users: filter by active approved organizations
        active_org_ids = get_user_active_organization_ids(user)
        if not active_org_ids:
            return base_qs.none()

        scoped_qs = base_qs.filter(**{f'{self.tenant_field}_id__in': active_org_ids})

        # If user is a BRANCH_MANAGER and the model is branch-scoped, filter by branch
        # (unless user also holds ORGANIZATION_OWNER or ORGANIZATION_ADMIN in that org)
        admin_org_ids = set(
            OrganizationMembership.objects.filter(
                user=user,
                is_active=True,
                role__in=[UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN],
            ).values_list('organization_id', flat=True)
        )

        managed_branch_ids = get_user_branch_manager_scope(user)

        # If model is Branch itself
        if base_qs.model.__name__ == 'Branch':
            # Non-admin branch managers only see their assigned branch
            if managed_branch_ids and not admin_org_ids:
                scoped_qs = scoped_qs.filter(id__in=managed_branch_ids)
        elif hasattr(base_qs.model, self.branch_field):
            # Model has a branch field (e.g. ServiceArea)
            if managed_branch_ids and not admin_org_ids:
                scoped_qs = scoped_qs.filter(**{f'{self.branch_field}_id__in': managed_branch_ids})

        return scoped_qs

    def validate_tenant_assignment(self, organization: Organization):
        """
        Anti-spoofing validation: Ensure the actor has administrative authority
        over the specified organization before creating or modifying tenant resources.
        """
        user = self.request.user
        if user.role == UserRole.PLATFORM_ADMIN:
            return True

        has_admin_membership = OrganizationMembership.objects.filter(
            user=user,
            organization=organization,
            role__in=[UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN],
            is_active=True,
            organization__status=OrganizationStatus.APPROVED,
        ).exists()

        if not has_admin_membership:
            raise TenantIsolationError(
                f"You do not have administrative authority in organization '{organization.code}'."
            )
        return True
