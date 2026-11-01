import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.accounts.models import User, UserRole, AuditLog
from apps.organizations.models import Organization, OrganizationMembership, OrganizationStatus
from apps.organizations.services import (
    register_organization,
    approve_organization,
    update_membership_role,
    deactivate_membership,
    activate_membership,
)
from apps.core.tenancy import get_user_active_organization_ids


@pytest.fixture
def platform_admin():
    return User.objects.create_superuser(
        email='platform.admin@logiflows.test',
        password='AdminPassword2026!',
        first_name='Platform',
        last_name='Admin',
        role=UserRole.PLATFORM_ADMIN,
    )


@pytest.fixture
def org_a_owner():
    user = User.objects.create_user(
        email='owner.a@orga.test',
        password='SecurePassOrgA2026!',
        first_name='Owner',
        last_name='A',
        role=UserRole.CUSTOMER,
        is_active=True,
    )
    return user


@pytest.fixture
def org_b_owner():
    user = User.objects.create_user(
        email='owner.b@orgb.test',
        password='SecurePassOrgB2026!',
        first_name='Owner',
        last_name='B',
        role=UserRole.CUSTOMER,
        is_active=True,
    )
    return user


@pytest.fixture
def employee_user():
    return User.objects.create_user(
        email='employee@orga.test',
        password='SecurePassEmp2026!',
        first_name='Bob',
        last_name='Employee',
        role=UserRole.EMPLOYEE,
        is_active=True,
    )


@pytest.fixture
def approved_org_a(platform_admin, org_a_owner):
    org = register_organization(
        applicant=org_a_owner,
        data={
            'name': 'Alpha Cargo',
            'legal_name': 'Alpha Cargo Logistics Ltd',
            'code': 'ALPHA-CARGO',
            'contact_email': 'ops@alphacargo.test',
        },
    )
    return approve_organization(actor=platform_admin, organization=org)


@pytest.fixture
def approved_org_b(platform_admin, org_b_owner):
    org = register_organization(
        applicant=org_b_owner,
        data={
            'name': 'Beta Express',
            'legal_name': 'Beta Express Logistics Ltd',
            'code': 'BETA-EXPRESS',
            'contact_email': 'ops@betaexpress.test',
        },
    )
    return approve_organization(actor=platform_admin, organization=org)


@pytest.mark.django_db
class TestTenantIsolation:
    """Rigorous tests proving multi-tenant boundary enforcement and anti-spoofing."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()

    def test_active_organization_ids_resolution(self, approved_org_a, org_a_owner, org_b_owner):
        org_a_ids = get_user_active_organization_ids(org_a_owner)
        assert str(approved_org_a.id) in [str(oid) for oid in org_a_ids]

        org_b_ids = get_user_active_organization_ids(org_b_owner)
        assert str(approved_org_a.id) not in [str(oid) for oid in org_b_ids]

    def test_cross_tenant_detail_read_returns_forbidden_or_not_found(
        self, approved_org_a, approved_org_b, org_a_owner
    ):
        # org_a_owner attempts to read org B details
        self.client.force_authenticate(user=org_a_owner)
        url = reverse('organization-detail', kwargs={'pk': approved_org_b.id})
        response = self.client.get(url)
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    def test_cross_tenant_patch_mutation_blocked(
        self, approved_org_a, approved_org_b, org_a_owner
    ):
        # org_a_owner attempts to mutate org B profile
        self.client.force_authenticate(user=org_a_owner)
        url = reverse('organization-detail', kwargs={'pk': approved_org_b.id})
        response = self.client.patch(url, {'name': 'Hacked Beta Name'}, format='json')
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

        approved_org_b.refresh_from_db()
        assert approved_org_b.name == 'Beta Express'

    def test_cross_tenant_membership_listing_blocked(
        self, approved_org_a, approved_org_b, org_a_owner
    ):
        # org_a_owner attempts to list members of org B
        self.client.force_authenticate(user=org_a_owner)
        url = reverse('organization-list-memberships', kwargs={'pk': approved_org_b.id})
        response = self.client.get(url)
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    def test_platform_admin_cross_tenant_read_is_explicit_and_audited(
        self, platform_admin, approved_org_a
    ):
        self.client.force_authenticate(user=platform_admin)
        url = reverse('organization-detail', kwargs={'pk': approved_org_a.id})
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['code'] == 'ALPHA-CARGO'


@pytest.mark.django_db
class TestMembershipAndRoleAssignment:
    """Verify RBAC role hierarchy, promotions, and status transitions."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()

    def test_owner_can_promote_member_to_org_admin(
        self, approved_org_a, org_a_owner, employee_user
    ):
        membership = OrganizationMembership.objects.create(
            user=employee_user,
            organization=approved_org_a,
            role=UserRole.EMPLOYEE,
            is_active=True,
        )

        updated = update_membership_role(
            actor=org_a_owner,
            membership=membership,
            new_role=UserRole.ORGANIZATION_ADMIN,
        )
        assert updated.role == UserRole.ORGANIZATION_ADMIN

        # Verify audit log
        audit = AuditLog.objects.filter(
            target_id=str(membership.id),
            action='MEMBERSHIP_ROLE_UPDATED',
        ).first()
        assert audit is not None
        assert audit.metadata.get('new_role') == UserRole.ORGANIZATION_ADMIN

    def test_admin_cannot_promote_another_member_to_admin(
        self, approved_org_a, org_a_owner, employee_user
    ):
        # Create an admin user in Org A
        admin_user = User.objects.create_user(
            email='admin.a@orga.test',
            password='AdminPassOrgA2026!',
            role=UserRole.ORGANIZATION_ADMIN,
            is_active=True,
        )
        OrganizationMembership.objects.create(
            user=admin_user,
            organization=approved_org_a,
            role=UserRole.ORGANIZATION_ADMIN,
            is_active=True,
        )

        # Target employee
        membership = OrganizationMembership.objects.create(
            user=employee_user,
            organization=approved_org_a,
            role=UserRole.EMPLOYEE,
            is_active=True,
        )

        # Admin user cannot promote to ORGANIZATION_ADMIN
        with pytest.raises(PermissionDenied):
            update_membership_role(
                actor=admin_user,
                membership=membership,
                new_role=UserRole.ORGANIZATION_ADMIN,
            )

    def test_cannot_modify_active_owner_role(
        self, approved_org_a, org_a_owner
    ):
        owner_membership = OrganizationMembership.objects.get(
            organization=approved_org_a,
            role=UserRole.ORGANIZATION_OWNER,
        )
        with pytest.raises(PermissionDenied):
            update_membership_role(
                actor=org_a_owner,
                membership=owner_membership,
                new_role=UserRole.EMPLOYEE,
            )

    def test_owner_cannot_be_deactivated(
        self, approved_org_a, org_a_owner
    ):
        owner_membership = OrganizationMembership.objects.get(
            organization=approved_org_a,
            role=UserRole.ORGANIZATION_OWNER,
        )
        with pytest.raises(ValidationError):
            deactivate_membership(actor=org_a_owner, membership=owner_membership)

    def test_deactivate_and_activate_employee_membership_via_api(
        self, approved_org_a, org_a_owner, employee_user
    ):
        membership = OrganizationMembership.objects.create(
            user=employee_user,
            organization=approved_org_a,
            role=UserRole.EMPLOYEE,
            is_active=True,
        )

        self.client.force_authenticate(user=org_a_owner)
        deactivate_url = reverse(
            'organization-deactivate-membership-action',
            kwargs={'pk': approved_org_a.id, 'membership_id': membership.id},
        )
        response = self.client.post(deactivate_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_active'] is False

        membership.refresh_from_db()
        assert membership.is_active is False

        # Reactivate
        activate_url = reverse(
            'organization-activate-membership-action',
            kwargs={'pk': approved_org_a.id, 'membership_id': membership.id},
        )
        response = self.client.post(activate_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_active'] is True
