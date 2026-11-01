import pytest
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError, PermissionDenied

from apps.accounts.models import User, UserRole, AuditLog
from apps.organizations.models import Organization, OrganizationMembership, OrganizationStatus
from apps.organizations.services import register_organization, approve_organization
from apps.branches.models import Branch, BranchStatus
from apps.branches.services import create_branch
from apps.employees.models import EmployeeProfile, EmployeeStatus
from apps.employees.services import (
    create_employee,
    deactivate_employee,
    activate_employee,
)


@pytest.fixture
def platform_admin():
    return User.objects.create_superuser(
        email='platform.admin@logiflows.test',
        password='AdminPassword2026!',
        role=UserRole.PLATFORM_ADMIN,
    )


@pytest.fixture
def org_owner():
    return User.objects.create_user(
        email='owner@speedypost.test',
        password='OwnerPassword2026!',
        role=UserRole.CUSTOMER,
        is_active=True,
    )


@pytest.fixture
def approved_org(platform_admin, org_owner):
    org = register_organization(
        applicant=org_owner,
        data={
            'name': 'Speedy Post India',
            'legal_name': 'Speedy Post India Pvt Ltd',
            'code': 'SPEEDY-IND',
            'contact_email': 'ops@speedypost.test',
        },
    )
    return approve_organization(actor=platform_admin, organization=org)


@pytest.fixture
def branch_main(approved_org, org_owner):
    return create_branch(
        actor=org_owner,
        data={
            'organization': approved_org,
            'code': 'SP-CENTRAL',
            'name': 'Speedy Post Central',
            'address': 'Connaught Place, Delhi',
            'pincode': '110001',
            'city': 'Delhi',
            'state': 'Delhi',
        },
    )


@pytest.fixture
def branch_remote(approved_org, org_owner):
    return create_branch(
        actor=org_owner,
        data={
            'organization': approved_org,
            'code': 'SP-NOIDA',
            'name': 'Speedy Post Noida Depot',
            'address': 'Sector 62, Noida',
            'pincode': '201309',
            'city': 'Noida',
            'state': 'Uttar Pradesh',
        },
    )


@pytest.fixture
def org_admin_user(approved_org, org_owner):
    user = User.objects.create_user(
        email='admin@speedypost.test',
        password='AdminPassword2026!',
        role=UserRole.ORGANIZATION_ADMIN,
        is_active=True,
    )
    OrganizationMembership.objects.create(
        user=user,
        organization=approved_org,
        role=UserRole.ORGANIZATION_ADMIN,
        is_active=True,
    )
    return user


@pytest.fixture
def branch_manager_user(approved_org, org_owner, branch_main):
    user = User.objects.create_user(
        email='mgr.central@speedypost.test',
        password='MgrPassword2026!',
        role=UserRole.BRANCH_MANAGER,
        is_active=True,
    )
    OrganizationMembership.objects.create(
        user=user,
        organization=approved_org,
        role=UserRole.BRANCH_MANAGER,
        branch=branch_main,
        is_active=True,
    )
    branch_main.manager = user
    branch_main.save()
    return user


@pytest.mark.django_db
class TestEmployeeServicesAndPrivilegeEscalation:
    """Test staff creation, invitation email, and RBAC privilege barriers."""

    def test_owner_can_provision_employee_with_temp_password(self, approved_org, org_owner, branch_main):
        mail.outbox.clear()
        data = {
            'email': 'driver.rajesh@speedypost.test',
            'first_name': 'Rajesh',
            'last_name': 'Kumar',
            'employee_code': 'EMP-001',
            'role': UserRole.EMPLOYEE,
            'branch_id': str(branch_main.id),
            'designation': 'Senior Line-Haul Driver',
            'phone': '+91 98765 00001',
        }
        emp = create_employee(actor=org_owner, organization=approved_org, data=data)

        assert emp.employee_code == 'EMP-001'
        assert emp.status == EmployeeStatus.ACTIVE
        assert emp.temporary_password_active is True
        assert emp.membership.role == UserRole.EMPLOYEE
        assert emp.membership.branch == branch_main

        # Invitation email sent
        assert len(mail.outbox) == 1
        assert 'Invitation to Join' in mail.outbox[0].subject
        assert 'Temporary Password:' in mail.outbox[0].body

        # Audit log verified
        audit = AuditLog.objects.filter(target_id=str(emp.id), action='EMPLOYEE_CREATED').first()
        assert audit is not None
        assert audit.actor == org_owner

    def test_owner_can_create_organization_admin(self, approved_org, org_owner):
        data = {
            'email': 'new.admin@speedypost.test',
            'first_name': 'Sanjay',
            'last_name': 'Verma',
            'employee_code': 'ADM-002',
            'role': UserRole.ORGANIZATION_ADMIN,
        }
        emp = create_employee(actor=org_owner, organization=approved_org, data=data)
        assert emp.membership.role == UserRole.ORGANIZATION_ADMIN

    def test_admin_cannot_create_another_admin(self, approved_org, org_admin_user):
        data = {
            'email': 'escalated.admin@speedypost.test',
            'first_name': 'Hacker',
            'last_name': 'Attempt',
            'employee_code': 'HACK-003',
            'role': UserRole.ORGANIZATION_ADMIN,
        }
        with pytest.raises(PermissionDenied):
            create_employee(actor=org_admin_user, organization=approved_org, data=data)

    def test_branch_manager_can_create_employee_within_own_branch(
        self, approved_org, branch_manager_user, branch_main
    ):
        data = {
            'email': 'clerk.central@speedypost.test',
            'first_name': 'Pooja',
            'last_name': 'Sharma',
            'employee_code': 'CLK-004',
            'role': UserRole.EMPLOYEE,
            'branch_id': str(branch_main.id),
            'designation': 'Hub Staging Clerk',
        }
        emp = create_employee(actor=branch_manager_user, organization=approved_org, data=data)
        assert emp.membership.branch == branch_main

    def test_branch_manager_cannot_create_employee_in_other_branch(
        self, approved_org, branch_manager_user, branch_remote
    ):
        data = {
            'email': 'noida.worker@speedypost.test',
            'first_name': 'Noida',
            'last_name': 'Worker',
            'employee_code': 'EMP-005',
            'role': UserRole.EMPLOYEE,
            'branch_id': str(branch_remote.id),
        }
        with pytest.raises(PermissionDenied):
            create_employee(actor=branch_manager_user, organization=approved_org, data=data)

    def test_duplicate_employee_code_within_org_rejected(
        self, approved_org, org_owner, branch_main
    ):
        data = {
            'email': 'staff1@speedypost.test',
            'first_name': 'Staff',
            'last_name': 'One',
            'employee_code': 'EMP-DUP',
            'role': UserRole.EMPLOYEE,
            'branch_id': str(branch_main.id),
        }
        create_employee(actor=org_owner, organization=approved_org, data=data)

        data2 = {
            'email': 'staff2@speedypost.test',
            'first_name': 'Staff',
            'last_name': 'Two',
            'employee_code': 'emp-dup',  # duplicate code
            'role': UserRole.EMPLOYEE,
            'branch_id': str(branch_main.id),
        }
        with pytest.raises(ValidationError) as exc:
            create_employee(actor=org_owner, organization=approved_org, data=data2)
        assert 'employee_code' in exc.value.detail


@pytest.mark.django_db
class TestEmployeeAPIAndDeactivationLifecycle:
    """Verify DRF API endpoints, tenant queryset filtering, and deactivation mechanics."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()

    def test_employee_deactivation_blocks_tenant_access(
        self, approved_org, org_owner, branch_main
    ):
        emp = create_employee(
            actor=org_owner,
            organization=approved_org,
            data={
                'email': 'worker@speedypost.test',
                'first_name': 'Active',
                'last_name': 'Worker',
                'employee_code': 'WRK-001',
                'role': UserRole.EMPLOYEE,
                'branch_id': str(branch_main.id),
            },
        )
        worker_user = emp.membership.user

        # Deactivate employee via API
        self.client.force_authenticate(user=org_owner)
        deactivate_url = reverse('employee-deactivate', kwargs={'pk': emp.id})
        response = self.client.post(deactivate_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == EmployeeStatus.INACTIVE
        assert response.data['is_active'] is False

        # Verify that deactivated worker cannot access branch list
        self.client.force_authenticate(user=worker_user)
        branch_response = self.client.get(reverse('branch-list'))
        assert branch_response.status_code == status.HTTP_200_OK
        assert branch_response.data['count'] == 0  # Inactive membership filters out all branches!

        # Reactivate employee via API
        self.client.force_authenticate(user=org_owner)
        activate_url = reverse('employee-activate', kwargs={'pk': emp.id})
        act_response = self.client.post(activate_url)
        assert act_response.status_code == status.HTTP_200_OK
        assert act_response.data['status'] == EmployeeStatus.ACTIVE
        assert act_response.data['is_active'] is True

        # Restored access
        self.client.force_authenticate(user=worker_user)
        restored_response = self.client.get(reverse('branch-list'))
        assert restored_response.status_code == status.HTTP_200_OK
        assert restored_response.data['count'] >= 1

    def test_cross_tenant_employee_access_blocked(
        self, approved_org, org_owner, branch_main
    ):
        # Create second org
        other_user = User.objects.create_user(
            email='other.owner@other.test',
            password='OtherPassword2026!',
            role=UserRole.CUSTOMER,
            is_active=True,
        )
        other_org = register_organization(
            applicant=other_user,
            data={
                'name': 'Other Logistics',
                'legal_name': 'Other Logistics Ltd',
                'code': 'OTHER-LOG',
                'contact_email': 'ops@other.test',
            },
        )
        other_org.status = OrganizationStatus.APPROVED
        other_org.save()
        OrganizationMembership.objects.filter(organization=other_org).update(is_active=True)

        emp = create_employee(
            actor=org_owner,
            organization=approved_org,
            data={
                'email': 'org1.staff@speedypost.test',
                'first_name': 'Org1',
                'last_name': 'Staff',
                'employee_code': 'ORG1-001',
                'role': UserRole.EMPLOYEE,
                'branch_id': str(branch_main.id),
            },
        )

        # Other org owner attempts to read employee of org 1
        self.client.force_authenticate(user=other_user)
        detail_url = reverse('employee-detail', kwargs={'pk': emp.id})
        response = self.client.get(detail_url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
