import pytest
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.db import IntegrityError

from apps.accounts.models import User, UserRole, AuditLog
from apps.organizations.models import Organization, OrganizationMembership, OrganizationStatus
from apps.organizations.services import (
    register_organization,
    approve_organization,
    reject_organization,
    suspend_organization,
)


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
def normal_user():
    return User.objects.create_user(
        email='applicant@logiflows.test',
        password='SecureApplicantPass2026!',
        first_name='John',
        last_name='Applicant',
        role=UserRole.CUSTOMER,
        is_active=True,
    )


@pytest.fixture
def second_user():
    return User.objects.create_user(
        email='other.user@logiflows.test',
        password='SecureOtherPass2026!',
        first_name='Alice',
        last_name='Other',
        role=UserRole.CUSTOMER,
        is_active=True,
    )


@pytest.fixture
def sample_org(normal_user):
    mail.outbox.clear()
    org_data = {
        'name': 'Apex Logistics India',
        'legal_name': 'Apex Logistics India Private Limited',
        'registration_number': 'CIN-U12345DL2026PTC000123',
        'code': 'APEX-IND',
        'contact_email': 'ops@apexlogistics.in',
        'contact_phone': '+91 98765 43210',
        'address': 'Plot 42, Logistics Park, Gurgaon, Haryana, 122001',
    }
    return register_organization(applicant=normal_user, data=org_data)


@pytest.mark.django_db
class TestOrganizationServices:
    """Test suite covering Organization domain services and state transitions."""

    def test_register_organization_creates_pending_org_and_inactive_membership(self, normal_user):
        mail.outbox.clear()
        data = {
            'name': 'Speedy Post Global',
            'legal_name': 'Speedy Post Global Ltd',
            'registration_number': 'REG-999888',
            'code': 'speedy-post',
            'contact_email': 'contact@speedypost.com',
            'contact_phone': '+1 555 123 4567',
            'address': '100 Courier Way, Dover, DE',
        }
        org = register_organization(applicant=normal_user, data=data)

        assert org.status == OrganizationStatus.PENDING
        assert org.code == 'SPEEDY-POST'  # normalized uppercase
        assert not org.is_approved

        # Inactive prospective owner membership created
        membership = OrganizationMembership.objects.get(organization=org, user=normal_user)
        assert membership.role == UserRole.ORGANIZATION_OWNER
        assert not membership.is_active  # not active until platform admin approval

        # Normal user role remains CUSTOMER until approval
        normal_user.refresh_from_db()
        assert normal_user.role == UserRole.CUSTOMER

        # Notification email sent
        assert len(mail.outbox) == 1
        assert 'Organization Registration Received' in mail.outbox[0].body or 'Organization Registration Submitted' in mail.outbox[0].subject

        # Audit log created
        audit = AuditLog.objects.filter(target_id=str(org.id), action='ORG_REGISTERED').first()
        assert audit is not None
        assert audit.actor == normal_user

    def test_register_organization_duplicate_code_case_insensitive_rejected(self, normal_user, sample_org):
        data = {
            'name': 'Duplicate Code Org',
            'legal_name': 'Duplicate Code Ltd',
            'code': 'apex-ind',  # same code as sample_org (APEX-IND)
            'contact_email': 'another@apexlogistics.in',
        }
        with pytest.raises(ValidationError) as exc:
            register_organization(applicant=normal_user, data=data)
        assert 'code' in exc.value.detail

    def test_approve_organization_activates_owner_and_upgrades_role(self, platform_admin, normal_user, sample_org):
        mail.outbox.clear()
        approved_org = approve_organization(actor=platform_admin, organization=sample_org)

        assert approved_org.status == OrganizationStatus.APPROVED
        assert approved_org.is_approved

        # Owner membership is now active
        membership = OrganizationMembership.objects.get(organization=sample_org, user=normal_user)
        assert membership.is_active is True

        # Owner user role is upgraded to ORGANIZATION_OWNER
        normal_user.refresh_from_db()
        assert normal_user.role == UserRole.ORGANIZATION_OWNER

        # Email sent
        assert len(mail.outbox) >= 1
        assert 'Organization Approved' in mail.outbox[0].subject

        # Audit log created
        audit = AuditLog.objects.filter(target_id=str(sample_org.id), action='ORG_APPROVED').first()
        assert audit is not None
        assert audit.actor == platform_admin

    def test_approve_non_pending_organization_raises_validation_error(self, platform_admin, sample_org):
        approve_organization(actor=platform_admin, organization=sample_org)
        with pytest.raises(ValidationError) as exc:
            approve_organization(actor=platform_admin, organization=sample_org)
        assert 'status' in exc.value.detail

    def test_non_platform_admin_cannot_approve_organization(self, normal_user, sample_org):
        with pytest.raises(PermissionDenied):
            approve_organization(actor=normal_user, organization=sample_org)

    def test_reject_organization_requires_reason_and_records_audit(self, platform_admin, sample_org):
        mail.outbox.clear()
        reason = 'Incomplete business registration documentation provided.'
        rejected_org = reject_organization(actor=platform_admin, organization=sample_org, reason=reason)

        assert rejected_org.status == OrganizationStatus.REJECTED
        assert rejected_org.rejection_reason == reason

        # Audit log verified
        audit = AuditLog.objects.filter(target_id=str(sample_org.id), action='ORG_REJECTED').first()
        assert audit is not None
        assert audit.metadata.get('reason') == reason

    def test_suspend_approved_organization(self, platform_admin, sample_org):
        approve_organization(actor=platform_admin, organization=sample_org)
        reason = 'Annual compliance review pending.'
        suspended_org = suspend_organization(actor=platform_admin, organization=sample_org, reason=reason)

        assert suspended_org.status == OrganizationStatus.SUSPENDED
        assert suspended_org.suspension_reason == reason
        assert suspended_org.is_suspended

    def test_cannot_suspend_unapproved_organization(self, platform_admin, sample_org):
        with pytest.raises(ValidationError):
            suspend_organization(actor=platform_admin, organization=sample_org, reason='Suspension attempt on pending')


@pytest.mark.django_db
class TestOrganizationDatabaseConstraints:
    """Verify PostgreSQL and model integrity constraints."""

    def test_unique_user_organization_membership(self, sample_org, normal_user):
        # normal_user already has an inactive membership in sample_org
        with pytest.raises(IntegrityError):
            OrganizationMembership.objects.create(
                user=normal_user,
                organization=sample_org,
                role=UserRole.EMPLOYEE,
                is_active=False,
            )

    def test_only_one_active_owner_per_organization(self, sample_org, normal_user, second_user, platform_admin):
        # Approve sample_org making normal_user active owner
        approve_organization(actor=platform_admin, organization=sample_org)

        # Attempting to insert a second ACTIVE owner must fail constraint
        with pytest.raises(IntegrityError):
            OrganizationMembership.objects.create(
                user=second_user,
                organization=sample_org,
                role=UserRole.ORGANIZATION_OWNER,
                is_active=True,
            )


@pytest.mark.django_db
class TestOrganizationAPIEndpoints:
    """Test suite covering REST API endpoints, permissions, and tenant filtering."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()

    def test_register_org_endpoint_authenticated(self, normal_user):
        self.client.force_authenticate(user=normal_user)
        payload = {
            'name': 'Rapid Logistics',
            'legal_name': 'Rapid Logistics Corp',
            'code': 'RAPID-LOG',
            'contact_email': 'contact@rapidlog.test',
            'contact_phone': '+91 99999 88888',
            'address': 'Warehouse 5, Outer Ring Rd, Bangalore',
        }
        response = self.client.post(reverse('organization-list'), payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['organization']['status'] == OrganizationStatus.PENDING
        assert response.data['organization']['code'] == 'RAPID-LOG'

    def test_register_org_endpoint_unauthenticated_rejected(self):
        payload = {
            'name': 'Rapid Logistics',
            'legal_name': 'Rapid Logistics Corp',
            'code': 'RAPID-LOG',
            'contact_email': 'contact@rapidlog.test',
        }
        response = self.client.post(reverse('organization-list'), payload, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_platform_admin_can_list_and_filter_organizations(self, platform_admin, sample_org):
        self.client.force_authenticate(user=platform_admin)

        # List all
        response = self.client.get(reverse('organization-list'))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

        # Filter by status
        response = self.client.get(f"{reverse('organization-list')}?status=PENDING")
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

        response = self.client.get(f"{reverse('organization-list')}?status=APPROVED")
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 0

    def test_organization_approval_workflow_via_api(self, platform_admin, sample_org):
        self.client.force_authenticate(user=platform_admin)

        approve_url = reverse('organization-approve', kwargs={'pk': sample_org.id})
        response = self.client.post(approve_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['organization']['status'] == OrganizationStatus.APPROVED

        sample_org.refresh_from_db()
        assert sample_org.status == OrganizationStatus.APPROVED

    def test_non_platform_admin_cannot_approve_via_api(self, normal_user, sample_org):
        self.client.force_authenticate(user=normal_user)
        approve_url = reverse('organization-approve', kwargs={'pk': sample_org.id})
        response = self.client.post(approve_url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_reject_org_via_api_requires_reason(self, platform_admin, sample_org):
        self.client.force_authenticate(user=platform_admin)
        reject_url = reverse('organization-reject', kwargs={'pk': sample_org.id})

        # Missing reason
        response = self.client.post(reject_url, {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Valid reason
        response = self.client.post(reject_url, {'reason': 'Invalid tax registration number'}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['organization']['status'] == OrganizationStatus.REJECTED

    def test_suspend_org_via_api(self, platform_admin, sample_org):
        approve_organization(actor=platform_admin, organization=sample_org)
        self.client.force_authenticate(user=platform_admin)

        suspend_url = reverse('organization-suspend', kwargs={'pk': sample_org.id})
        response = self.client.post(suspend_url, {'reason': 'Regulatory inspection hold'}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['organization']['status'] == OrganizationStatus.SUSPENDED

    def test_owner_can_patch_own_org_settings(self, platform_admin, normal_user, sample_org):
        approve_organization(actor=platform_admin, organization=sample_org)
        self.client.force_authenticate(user=normal_user)

        detail_url = reverse('organization-detail', kwargs={'pk': sample_org.id})
        payload = {
            'name': 'Apex Logistics India Ltd',
            'contact_phone': '+91 99999 11111',
            'settings': {'auto_dispatch': True, 'default_sla_hours': 24},
        }
        response = self.client.patch(detail_url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Apex Logistics India Ltd'
        assert response.data['settings']['auto_dispatch'] is True

    def test_unaffiliated_user_cannot_access_or_patch_other_org(self, platform_admin, normal_user, second_user, sample_org):
        approve_organization(actor=platform_admin, organization=sample_org)
        self.client.force_authenticate(user=second_user)

        detail_url = reverse('organization-detail', kwargs={'pk': sample_org.id})
        # Unaffiliated user trying to read
        response = self.client.get(detail_url)
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

        # Trying to update
        response = self.client.patch(detail_url, {'name': 'Hacked Org Name'}, format='json')
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    def test_my_memberships_endpoint(self, platform_admin, normal_user, sample_org):
        approve_organization(actor=platform_admin, organization=sample_org)
        self.client.force_authenticate(user=normal_user)

        response = self.client.get(reverse('memberships-me'))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['organization_code'] == 'APEX-IND'
        assert response.data[0]['role'] == UserRole.ORGANIZATION_OWNER
