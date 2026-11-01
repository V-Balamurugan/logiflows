from rest_framework.permissions import BasePermission, SAFE_METHODS
from apps.accounts.models import UserRole


class RolePermission(BasePermission):
    """
    Base RBAC permission class checking user role against allowed roles.
    Subclasses define `allowed_roles`.
    """
    allowed_roles = ()

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if not request.user.is_active:
            return False
        # Platform administrators always have full system access
        if request.user.role == UserRole.PLATFORM_ADMIN:
            return True
        return request.user.role in self.allowed_roles


class IsPlatformAdmin(BasePermission):
    """Permission class granting access strictly to Platform Administrators."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
            and request.user.role == UserRole.PLATFORM_ADMIN
        )


class IsOrganizationOwner(RolePermission):
    """Permission for Platform Admin and Organization Owner."""
    allowed_roles = (UserRole.ORGANIZATION_OWNER,)


class IsOrganizationAdmin(RolePermission):
    """Permission for Platform Admin, Organization Owner, and Organization Admin."""
    allowed_roles = (
        UserRole.ORGANIZATION_OWNER,
        UserRole.ORGANIZATION_ADMIN,
    )


class IsBranchManager(RolePermission):
    """Permission for Platform Admin, Org Owner/Admin, and Branch Managers."""
    allowed_roles = (
        UserRole.ORGANIZATION_OWNER,
        UserRole.ORGANIZATION_ADMIN,
        UserRole.BRANCH_MANAGER,
    )


class IsEmployee(RolePermission):
    """Permission for Platform Admin, Org Owner/Admin, Branch Managers, and Employees."""
    allowed_roles = (
        UserRole.ORGANIZATION_OWNER,
        UserRole.ORGANIZATION_ADMIN,
        UserRole.BRANCH_MANAGER,
        UserRole.EMPLOYEE,
    )


class IsCustomer(BasePermission):
    """Permission granting access exclusively to Customer accounts."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
            and request.user.role == UserRole.CUSTOMER
        )


def HasAnyRole(*roles):
    """Factory creating dynamic permission classes for arbitrary role combinations."""
    class DynamicRolePermission(BasePermission):
        def has_permission(self, request, view):
            if not (request.user and request.user.is_authenticated and request.user.is_active):
                return False
            if request.user.role == UserRole.PLATFORM_ADMIN:
                return True
            return request.user.role in roles
    return DynamicRolePermission


class ObjectOwnerPermission(BasePermission):
    """
    Object-level permission allowing access if the requesting user owns the object
    or is a PLATFORM_ADMIN.
    """
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == UserRole.PLATFORM_ADMIN:
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        return obj == request.user


class TenantAwareMixin:
    """
    Architectural placeholder mixin for Phase 2 multi-tenancy.
    Views extending this mixin will automatically scope querysets
    by the user's active tenant/organization.
    """
    def get_tenant(self, request):
        """Phase 2 hook to extract active organization from request or tenant header."""
        return getattr(request, 'tenant', None)

    def filter_queryset_by_tenant(self, queryset):
        """Phase 2 hook to filter model instances by organization/branch."""
        return queryset
