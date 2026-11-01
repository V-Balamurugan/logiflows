from rest_framework import permissions
from apps.accounts.models import UserRole
from apps.organizations.models import OrganizationMembership, OrganizationStatus
from .models import Branch


class CanManageBranch(permissions.BasePermission):
    """
    Granular permission for Branch resources:
    - PLATFORM_ADMIN: Unrestricted access.
    - ORGANIZATION_OWNER / ORGANIZATION_ADMIN: Full CRUD over branches of their organization.
    - BRANCH_MANAGER: Read access and limited write access to their own assigned branch.
    - EMPLOYEE: Read access to their branch.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.role == UserRole.PLATFORM_ADMIN:
            return True

        branch = obj if isinstance(obj, Branch) else getattr(obj, 'branch', None)
        if not branch:
            return False

        # Check membership in the branch's organization
        membership = OrganizationMembership.objects.filter(
            user=user,
            organization=branch.organization,
            is_active=True,
            organization__status=OrganizationStatus.APPROVED,
        ).first()

        if not membership:
            return False

        # Owner and Admin have full access
        if membership.role in [UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN]:
            return True

        # Branch Manager has access only to their assigned branch
        if membership.role == UserRole.BRANCH_MANAGER:
            is_assigned = (membership.branch_id == branch.id) or (branch.manager_id == user.id)
            if not is_assigned:
                return False
            # Read or update allowed
            if request.method in permissions.SAFE_METHODS or request.method in ['PATCH', 'PUT']:
                return True
            return False

        # Employee: read only
        if request.method in permissions.SAFE_METHODS:
            return True

        return False
