import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError, PermissionDenied

from apps.accounts.models import User, UserRole, AuditLog
from apps.organizations.models import Organization, OrganizationMembership, OrganizationStatus
from apps.organizations.services import register_organization, approve_organization
from apps.branches.models import Branch, BranchStatus, ServiceArea
from apps.branches.services import (
    create_branch,
    assign_branch_manager,
    add_service_area,
    check_postal_serviceability,
)


@pytest.fixture
def platform_admin():
    return User.objects.create_superuser(
        email='platform.admin@logiflows.test',
        password='AdminPassword2026!',
        role=UserRole.PLATFORM_ADMIN,
    )


@pytest.fixture
def org_a_owner():
    return User.objects.create_user(
        email='owner.a@logiflows.test',
        password='OwnerPassword2026!',
        role=UserRole.CUSTOMER,
        is_active=True,
    )


@pytest.fixture
def org_b_owner():
    return User.objects.create_user(
        email='owner.b@logiflows.test',
        password='OwnerPassword2026!',
        role=UserRole.CUSTOMER,
        is_active=True,
    )


@pytest.fixture
def approved_org_a(platform_admin, org_a_owner):
    org = register_organization(
        applicant=org_a_owner,
        data={
            'name': 'Delhi Express Logistics',
            'legal_name': 'Delhi Express Logistics Pvt Ltd',
            'code': 'DEL-EXP',
            'contact_email': 'ops@delhiexpress.test',
        },
    )
    return approve_organization(actor=platform_admin, organization=org)


@pytest.fixture
def approved_org_b(platform_admin, org_b_owner):
    org = register_organization(
        applicant=org_b_owner,
        data={
            'name': 'Mumbai Cargo Hub',
            'legal_name': 'Mumbai Cargo Hub Ltd',
            'code': 'MUM-CARGO',
            'contact_email': 'ops@mumbaicargo.test',
        },
    )
    return approve_organization(actor=platform_admin, organization=org)


@pytest.fixture
def manager_user():
    return User.objects.create_user(
        email='manager.delhi@delhiexpress.test',
        password='ManagerPassword2026!',
        role=UserRole.EMPLOYEE,
        is_active=True,
    )


@pytest.fixture
def branch_a1(approved_org_a, org_a_owner, manager_user):
    # Register manager as member
    OrganizationMembership.objects.create(
        user=manager_user,
        organization=approved_org_a,
        role=UserRole.EMPLOYEE,
        is_active=True,
    )
    return create_branch(
        actor=org_a_owner,
        data={
            'organization': approved_org_a,
            'code': 'DEL-NORTH',
            'name': 'Delhi North Hub',
            'address': 'Kashmere Gate, Delhi',
            'pincode': '110006',
            'city': 'Delhi',
            'state': 'Delhi',
            'manager': manager_user,
        },
    )


@pytest.fixture
def branch_a2(approved_org_a, org_a_owner):
    return create_branch(
        actor=org_a_owner,
        data={
            'organization': approved_org_a,
            'code': 'DEL-SOUTH',
            'name': 'Delhi South Depot',
            'address': 'Okhla Phase 3, Delhi',
            'pincode': '110020',
            'city': 'Delhi',
            'state': 'Delhi',
        },
    )


@pytest.fixture
def branch_b1(approved_org_b, org_b_owner):
    return create_branch(
        actor=org_b_owner,
        data={
            'organization': approved_org_b,
            'code': 'MUM-CENTRAL',
            'name': 'Mumbai Central Hub',
            'address': 'Andheri East, Mumbai',
            'pincode': '400069',
            'city': 'Mumbai',
            'state': 'Maharashtra',
        },
    )


@pytest.mark.django_db
class TestBranchServicesAndConstraints:
    """Test branch creation, manager assignments, and uniqueness rules."""

    def test_create_branch_in_unapproved_org_rejected(self, platform_admin, org_a_owner):
        pending_org = register_organization(
            applicant=org_a_owner,
            data={
                'name': 'Pending Freight',
                'legal_name': 'Pending Freight Ltd',
                'code': 'PEND-FRT',
                'contact_email': 'ops@pendingfreight.test',
            },
        )
        with pytest.raises(ValidationError) as exc:
            create_branch(
                actor=org_a_owner,
                data={
                    'organization': pending_org,
                    'code': 'PEND-B1',
                    'name': 'Pending Branch',
                    'address': 'Main St',
                    'pincode': '110001',
                    'city': 'Delhi',
                    'state': 'Delhi',
                },
            )
        assert 'organization' in exc.value.detail

    def test_duplicate_branch_code_within_same_org_rejected(self, approved_org_a, org_a_owner, branch_a1):
        with pytest.raises(ValidationError) as exc:
            create_branch(
                actor=org_a_owner,
                data={
                    'organization': approved_org_a,
                    'code': 'del-north',  # duplicate within org_a
                    'name': 'Duplicate Branch',
                    'address': 'Road 2',
                    'pincode': '110006',
                    'city': 'Delhi',
                    'state': 'Delhi',
                },
            )
        assert 'code' in exc.value.detail

    def test_same_branch_code_in_different_orgs_permitted(self, approved_org_a, approved_org_b, org_a_owner, org_b_owner, branch_a1):
        # branch_a1 has code DEL-NORTH in org_a
        # Org B can also have code DEL-NORTH
        branch_b_delhi = create_branch(
            actor=org_b_owner,
            data={
                'organization': approved_org_b,
                'code': 'DEL-NORTH',
                'name': 'Mumbai Cargo Delhi Outpost',
                'address': 'Connaught Place, Delhi',
                'pincode': '110001',
                'city': 'Delhi',
                'state': 'Delhi',
            },
        )
        assert branch_b_delhi.code == 'DEL-NORTH'
        assert branch_b_delhi.organization == approved_org_b

    def test_assign_branch_manager_updates_role_and_branch_scope(self, approved_org_a, org_a_owner, branch_a2):
        new_mgr = User.objects.create_user(
            email='new.mgr@delhiexpress.test',
            password='PassNewMgr2026!',
            role=UserRole.EMPLOYEE,
            is_active=True,
        )
        membership = OrganizationMembership.objects.create(
            user=new_mgr,
            organization=approved_org_a,
            role=UserRole.EMPLOYEE,
            is_active=True,
        )

        assign_branch_manager(actor=org_a_owner, branch=branch_a2, manager=new_mgr)

        branch_a2.refresh_from_db()
        assert branch_a2.manager == new_mgr

        membership.refresh_from_db()
        assert membership.role == UserRole.BRANCH_MANAGER
        assert membership.branch == branch_a2


@pytest.mark.django_db
class TestServiceAreaOverlapConflictRule:
    """Validate documented overlap-conflict rule for postal code coverage."""

    def test_adding_service_area_to_branch_success(self, org_a_owner, branch_a1):
        area = add_service_area(
            actor=org_a_owner,
            branch=branch_a1,
            postal_code='110006',
            is_serviceable=True,
        )
        assert area.postal_code == '110006'
        assert area.is_serviceable is True

    def test_intra_organization_overlap_conflict_rejected(self, org_a_owner, branch_a1, branch_a2):
        # Branch A1 serves 110006
        add_service_area(actor=org_a_owner, branch=branch_a1, postal_code='110006', is_serviceable=True)

        # Branch A2 attempting to serve 110006 in the SAME organization must be rejected
        with pytest.raises(ValidationError) as exc:
            add_service_area(actor=org_a_owner, branch=branch_a2, postal_code='110006', is_serviceable=True)

        assert 'postal_code' in exc.value.detail
        assert 'already served by branch' in exc.value.detail['postal_code']

    def test_inter_organization_overlap_permitted(self, org_a_owner, org_b_owner, branch_a1, branch_b1):
        # Org A branch serves 110001
        add_service_area(actor=org_a_owner, branch=branch_a1, postal_code='110001', is_serviceable=True)

        # Org B branch serves the SAME postal code 110001 -> must succeed!
        area_b = add_service_area(actor=org_b_owner, branch=branch_b1, postal_code='110001', is_serviceable=True)
        assert area_b.postal_code == '110001'
        assert area_b.branch.organization != branch_a1.organization

    def test_check_postal_serviceability_query(self, org_a_owner, branch_a1):
        add_service_area(actor=org_a_owner, branch=branch_a1, postal_code='110006', is_serviceable=True)

        results = check_postal_serviceability('110006')
        assert len(results) == 1
        assert results[0]['postal_code'] == '110006'
        assert results[0]['branch']['code'] == 'DEL-NORTH'

        # Unserved pincode
        results_unknown = check_postal_serviceability('999999')
        assert len(results_unknown) == 0


@pytest.mark.django_db
class TestBranchAndServiceabilityAPI:
    """Verify DRF API endpoints, tenant queryset filtering, and branch manager scoping."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()

    def test_branch_manager_sees_only_assigned_branch(
        self, branch_a1, branch_a2, manager_user
    ):
        # manager_user is manager of branch_a1 only
        self.client.force_authenticate(user=manager_user)
        response = self.client.get(reverse('branch-list'))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['code'] == 'DEL-NORTH'

    def test_organization_owner_sees_all_branches_of_own_org(
        self, branch_a1, branch_a2, branch_b1, org_a_owner
    ):
        self.client.force_authenticate(user=org_a_owner)
        response = self.client.get(reverse('branch-list'))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2  # Sees branch_a1 and branch_a2, but NOT branch_b1

        branch_codes = [b['code'] for b in response.data['results']]
        assert 'DEL-NORTH' in branch_codes
        assert 'DEL-SOUTH' in branch_codes
        assert 'MUM-CENTRAL' not in branch_codes

    def test_cross_tenant_branch_detail_returns_not_found(
        self, branch_b1, org_a_owner
    ):
        # org_a_owner attempts to access branch of Org B
        self.client.force_authenticate(user=org_a_owner)
        url = reverse('branch-detail', kwargs={'pk': branch_b1.id})
        response = self.client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_branch_via_api(self, approved_org_a, org_a_owner):
        self.client.force_authenticate(user=org_a_owner)
        payload = {
            'organization': str(approved_org_a.id),
            'code': 'DEL-WEST',
            'name': 'Delhi West Hub',
            'address': 'Janakpuri, Delhi',
            'pincode': '110058',
            'city': 'Delhi',
            'state': 'Delhi',
            'contact_phone': '+91 11 2345 6789',
        }
        response = self.client.post(reverse('branch-list'), payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['code'] == 'DEL-WEST'

    def test_anti_spoofing_user_cannot_create_branch_in_unauthorized_org(
        self, approved_org_b, org_a_owner
    ):
        # org_a_owner attempts to create branch in Org B
        self.client.force_authenticate(user=org_a_owner)
        payload = {
            'organization': str(approved_org_b.id),
            'code': 'HACKED-BR',
            'name': 'Unauthorized Branch',
            'address': 'Dark Web St',
            'pincode': '400001',
            'city': 'Mumbai',
            'state': 'Maharashtra',
        }
        response = self.client.post(reverse('branch-list'), payload, format='json')
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST]

    def test_service_areas_sub_endpoint_lifecycle(self, branch_a1, org_a_owner):
        self.client.force_authenticate(user=org_a_owner)
        url = reverse('branch-service-areas', kwargs={'pk': branch_a1.id})

        # Add service area
        response = self.client.post(url, {'postal_code': '110006', 'is_serviceable': True}, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        area_id = response.data['id']

        # List service areas
        list_response = self.client.get(url)
        assert list_response.status_code == status.HTTP_200_OK
        assert len(list_response.data) == 1
        assert list_response.data[0]['postal_code'] == '110006'

        # Delete service area
        del_url = reverse('branch-delete-service-area', kwargs={'pk': branch_a1.id, 'area_id': area_id})
        del_response = self.client.delete(del_url)
        assert del_response.status_code == status.HTTP_204_NO_CONTENT

    def test_serviceability_public_endpoint(self, branch_a1, org_a_owner):
        add_service_area(actor=org_a_owner, branch=branch_a1, postal_code='110006', is_serviceable=True)

        url = f"{reverse('serviceability-check')}?postal_code=110006"
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_serviceable'] is True
        assert response.data['match_count'] == 1
        assert response.data['providers'][0]['branch']['code'] == 'DEL-NORTH'

    def test_platform_admin_can_create_branch_in_approved_org(
        self, approved_org_a, platform_admin
    ):
        self.client.force_authenticate(user=platform_admin)
        payload = {
            'organization': str(approved_org_a.id),
            'code': 'DEL-EAST',
            'name': 'Delhi East Hub',
            'address': 'Mayur Vihar, Delhi',
            'pincode': '110091',
            'city': 'Delhi',
            'state': 'Delhi',
        }
        response = self.client.post(reverse('branch-list'), payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['code'] == 'DEL-EAST'

    def test_org_owner_create_branch_defaults_to_own_org(
        self, approved_org_a, org_a_owner
    ):
        self.client.force_authenticate(user=org_a_owner)
        payload = {
            'code': 'DEL-CENTRAL',
            'name': 'Delhi Central Branch',
            'address': 'Connaught Place, Delhi',
            'pincode': '110001',
            'city': 'Delhi',
            'state': 'Delhi',
        }
        response = self.client.post(reverse('branch-list'), payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['code'] == 'DEL-CENTRAL'
        assert response.data['organization'] == approved_org_a.id

