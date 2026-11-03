import pytest
from unittest.mock import Mock
from django.contrib.auth.models import AnonymousUser
from apps.accounts.models import User, UserRole
from apps.accounts.permissions import (
    IsPlatformAdmin,
    IsOrganizationOwner,
    IsOrganizationAdmin,
    IsBranchManager,
    IsEmployee,
    IsCustomer,
    HasAnyRole,
    ObjectOwnerPermission,
)


@pytest.mark.django_db
class TestRBACPermissions:
    @pytest.fixture(autouse=True)
    def setup_roles(self):
        self.users = {
            UserRole.PLATFORM_ADMIN: User.objects.create_user(
                email='platformadmin@logiflows.test',
                password='Password123!',
                role=UserRole.PLATFORM_ADMIN,
                is_active=True,
            ),
            UserRole.ORGANIZATION_OWNER: User.objects.create_user(
                email='orgowner@logiflows.test',
                password='Password123!',
                role=UserRole.ORGANIZATION_OWNER,
                is_active=True,
            ),
            UserRole.ORGANIZATION_ADMIN: User.objects.create_user(
                email='orgadmin@logiflows.test',
                password='Password123!',
                role=UserRole.ORGANIZATION_ADMIN,
                is_active=True,
            ),
            UserRole.BRANCH_MANAGER: User.objects.create_user(
                email='branchmgr@logiflows.test',
                password='Password123!',
                role=UserRole.BRANCH_MANAGER,
                is_active=True,
            ),
            UserRole.EMPLOYEE: User.objects.create_user(
                email='employee@logiflows.test',
                password='Password123!',
                role=UserRole.EMPLOYEE,
                is_active=True,
            ),
            UserRole.CUSTOMER: User.objects.create_user(
                email='customer@logiflows.test',
                password='Password123!',
                role=UserRole.CUSTOMER,
                is_active=True,
            ),
        }
        self.anon_user = AnonymousUser()

    def _make_req(self, user):
        req = Mock()
        req.user = user
        return req

    def test_is_platform_admin(self):
        perm = IsPlatformAdmin()
        view = Mock()

        assert perm.has_permission(self._make_req(self.users[UserRole.PLATFORM_ADMIN]), view) is True
        for role in [UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN, UserRole.BRANCH_MANAGER, UserRole.EMPLOYEE, UserRole.CUSTOMER]:
            assert perm.has_permission(self._make_req(self.users[role]), view) is False
        assert perm.has_permission(self._make_req(self.anon_user), view) is False

    def test_is_org_owner(self):
        perm = IsOrganizationOwner()
        view = Mock()

        # Platform Admin and Org Owner have access
        assert perm.has_permission(self._make_req(self.users[UserRole.PLATFORM_ADMIN]), view) is True
        assert perm.has_permission(self._make_req(self.users[UserRole.ORGANIZATION_OWNER]), view) is True

        # Lower roles do not
        for role in [UserRole.ORGANIZATION_ADMIN, UserRole.BRANCH_MANAGER, UserRole.EMPLOYEE, UserRole.CUSTOMER]:
            assert perm.has_permission(self._make_req(self.users[role]), view) is False
        assert perm.has_permission(self._make_req(self.anon_user), view) is False

    def test_is_org_admin(self):
        perm = IsOrganizationAdmin()
        view = Mock()

        assert perm.has_permission(self._make_req(self.users[UserRole.PLATFORM_ADMIN]), view) is True
        assert perm.has_permission(self._make_req(self.users[UserRole.ORGANIZATION_OWNER]), view) is True
        assert perm.has_permission(self._make_req(self.users[UserRole.ORGANIZATION_ADMIN]), view) is True

        for role in [UserRole.BRANCH_MANAGER, UserRole.EMPLOYEE, UserRole.CUSTOMER]:
            assert perm.has_permission(self._make_req(self.users[role]), view) is False
        assert perm.has_permission(self._make_req(self.anon_user), view) is False

    def test_is_branch_manager(self):
        perm = IsBranchManager()
        view = Mock()

        assert perm.has_permission(self._make_req(self.users[UserRole.PLATFORM_ADMIN]), view) is True
        assert perm.has_permission(self._make_req(self.users[UserRole.ORGANIZATION_OWNER]), view) is True
        assert perm.has_permission(self._make_req(self.users[UserRole.ORGANIZATION_ADMIN]), view) is True
        assert perm.has_permission(self._make_req(self.users[UserRole.BRANCH_MANAGER]), view) is True

        for role in [UserRole.EMPLOYEE, UserRole.CUSTOMER]:
            assert perm.has_permission(self._make_req(self.users[role]), view) is False
        assert perm.has_permission(self._make_req(self.anon_user), view) is False

    def test_is_employee(self):
        perm = IsEmployee()
        view = Mock()

        for role in [UserRole.PLATFORM_ADMIN, UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN, UserRole.BRANCH_MANAGER, UserRole.EMPLOYEE]:
            assert perm.has_permission(self._make_req(self.users[role]), view) is True

        assert perm.has_permission(self._make_req(self.users[UserRole.CUSTOMER]), view) is False
        assert perm.has_permission(self._make_req(self.anon_user), view) is False

    def test_is_customer(self):
        perm = IsCustomer()
        view = Mock()

        assert perm.has_permission(self._make_req(self.users[UserRole.CUSTOMER]), view) is True
        for role in [UserRole.PLATFORM_ADMIN, UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN, UserRole.BRANCH_MANAGER, UserRole.EMPLOYEE]:
            assert perm.has_permission(self._make_req(self.users[role]), view) is False
        assert perm.has_permission(self._make_req(self.anon_user), view) is False

    def test_has_any_role_factory(self):
        perm_class = HasAnyRole(UserRole.BRANCH_MANAGER, UserRole.CUSTOMER)
        perm = perm_class()
        view = Mock()

        assert perm.has_permission(self._make_req(self.users[UserRole.PLATFORM_ADMIN]), view) is True
        assert perm.has_permission(self._make_req(self.users[UserRole.BRANCH_MANAGER]), view) is True
        assert perm.has_permission(self._make_req(self.users[UserRole.CUSTOMER]), view) is True
        assert perm.has_permission(self._make_req(self.users[UserRole.EMPLOYEE]), view) is False

    def test_object_owner_permission(self):
        perm = ObjectOwnerPermission()
        view = Mock()

        owner = self.users[UserRole.CUSTOMER]
        other_user = self.users[UserRole.EMPLOYEE]
        admin = self.users[UserRole.PLATFORM_ADMIN]

        obj = Mock()
        obj.user = owner

        # Owner has access
        assert perm.has_object_permission(self._make_req(owner), view, obj) is True
        # Other user has no access
        assert perm.has_object_permission(self._make_req(other_user), view, obj) is False
        # Platform Admin has access
        assert perm.has_object_permission(self._make_req(admin), view, obj) is True
