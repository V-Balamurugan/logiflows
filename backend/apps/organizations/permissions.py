from rest_framework import permissions
from apps.accounts.models import UserRole
from .models import Organization, OrganizationMembership, OrganizationStatus


class IsPlatformAdmin(permissions.BasePermission):
    """
    Allows access only to global Platform Administrators.
    """
    message = 'Platform Administrator credentials are required for this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.PLATFORM_ADMIN
        )


class IsOrganizationOwner(permissions.BasePermission):
    """
    Object-level permission allowing access only to the active owner of an Organization.
    """
    message = 'Only the active Organization Owner can perform this action.'

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role == UserRole.PLATFORM_ADMIN:
            return True

        org = obj if isinstance(obj, Organization) else getattr(obj, 'organization', None)
        if not org:
            return False

        return OrganizationMembership.objects.filter(
            user=request.user,
            organization=org,
            role=UserRole.ORGANIZATION_OWNER,
            is_active=True,
        ).exists()


class IsOrganizationOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission allowing access to active Organization Owners or Administrators.
    """
    message = 'Organization Owner or Organization Administrator role is required.'

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role == UserRole.PLATFORM_ADMIN:
            return True

        org = obj if isinstance(obj, Organization) else getattr(obj, 'organization', None)
        if not org:
            return False

        return OrganizationMembership.objects.filter(
            user=request.user,
            organization=org,
            role__in=[UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN],
            is_active=True,
        ).exists()


class CanManageOrganization(permissions.BasePermission):
    """
    Granular permissions for Organization management:
    - SAFE_METHODS (GET, HEAD, OPTIONS): Accessible to Platform Admins or active members of the organization.
    - Write operations (PATCH, PUT): Accessible to Platform Admins or active Organization Owner.
    - DELETE: Forbidden.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.role == UserRole.PLATFORM_ADMIN:
            return True

        org = obj if isinstance(obj, Organization) else getattr(obj, 'organization', None)
        if not org:
            return False

        # Read access: any active member
        if request.method in permissions.SAFE_METHODS:
            return OrganizationMembership.objects.filter(
                user=user,
                organization=org,
                is_active=True,
            ).exists()

        # Update access: Owner only
        if request.method in ['PATCH', 'PUT']:
            return OrganizationMembership.objects.filter(
                user=user,
                organization=org,
                role=UserRole.ORGANIZATION_OWNER,
                is_active=True,
            ).exists()

        return False
