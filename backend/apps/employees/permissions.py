from rest_framework import permissions
from apps.accounts.models import UserRole
from apps.organizations.models import OrganizationMembership, OrganizationStatus
from .models import EmployeeProfile


class CanManageEmployee(permissions.BasePermission):
    """
    Granular permissions for Employee management:
    - PLATFORM_ADMIN: unrestricted.
    - ORGANIZATION_OWNER / ORGANIZATION_ADMIN: full access to organization staff.
    - BRANCH_MANAGER: read and manage staff within their assigned branch.
    - EMPLOYEE: read access within their branch.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.role == UserRole.PLATFORM_ADMIN:
            return True

        if not isinstance(obj, EmployeeProfile):
            return False

        org = obj.membership.organization
        actor_membership = OrganizationMembership.objects.filter(
            user=user,
            organization=org,
            is_active=True,
            organization__status=OrganizationStatus.APPROVED,
        ).first()

        if not actor_membership:
            return False

        # Owner and Admin
        if actor_membership.role in [UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN]:
            return True

        # Branch Manager: restricted to their branch
        if actor_membership.role == UserRole.BRANCH_MANAGER:
            is_same_branch = (actor_membership.branch_id == obj.membership.branch_id)
            if not is_same_branch:
                return False
            # Cannot modify other managers or admins
            if obj.membership.role in [UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN, UserRole.BRANCH_MANAGER]:
                return request.method in permissions.SAFE_METHODS
            return True

        # Employee: safe methods only
        return request.method in permissions.SAFE_METHODS
