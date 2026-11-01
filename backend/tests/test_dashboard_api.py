import pytest
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.organizations.models import Organization, OrganizationStatus, OrganizationMembership
from apps.branches.models import Branch, ServiceArea
from apps.employees.models import EmployeeProfile, EmployeeStatus


@pytest.mark.django_db
class TestDashboardTelemetryAndTenantIsolation:
    """
    Tests validating role-scoped telemetry aggregation and strict anti-leakage isolation.
    """

    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def setup_multi_tenant_ecosystem(self, db):
        # Platform Admin
        admin_user = User.objects.create_user(
            email='admin@logiflows.test',
            password='TestPassword123!',
            role=UserRole.PLATFORM_ADMIN,
            is_active=True,
        )

        # Organization A
        org_a = Organization.objects.create(
            name='Alpha Express',
            legal_name='Alpha Express Pvt Ltd',
            code='ALPHA',
            contact_email='contact@alpha.test',
            status=OrganizationStatus.APPROVED,
        )
        owner_a = User.objects.create_user(
            email='owner@alpha.test',
            password='TestPassword123!',
            role=UserRole.ORGANIZATION_OWNER,
            is_active=True,
        )
        mem_owner_a = OrganizationMembership.objects.create(
            organization=org_a,
            user=owner_a,
            role=UserRole.ORGANIZATION_OWNER,
            is_active=True,
        )

        # Branch A1 and Manager
        branch_a1 = Branch.objects.create(
            organization=org_a,
            code='ALPHA-HUB-1',
            name='Alpha Central Hub',
            address='123 Main St',
            pincode='110001',
            city='New Delhi',
            state='Delhi',
            country='India',
            status='ACTIVE',
        )
        ServiceArea.objects.create(branch=branch_a1, postal_code='110001', is_serviceable=True)
        ServiceArea.objects.create(branch=branch_a1, postal_code='110002', is_serviceable=True)

        bm_user = User.objects.create_user(
            email='bm@alpha.test',
            password='TestPassword123!',
            role=UserRole.BRANCH_MANAGER,
            is_active=True,
        )
        mem_bm = OrganizationMembership.objects.create(
            organization=org_a,
            user=bm_user,
            role=UserRole.BRANCH_MANAGER,
            branch=branch_a1,
            is_active=True,
        )

        # Staff in branch A1
        emp_user = User.objects.create_user(
            email='driver@alpha.test',
            password='TestPassword123!',
            role=UserRole.EMPLOYEE,
            is_active=True,
        )
        mem_emp = OrganizationMembership.objects.create(
            organization=org_a,
            user=emp_user,
            role=UserRole.EMPLOYEE,
            branch=branch_a1,
            is_active=True,
        )
        EmployeeProfile.objects.create(
            membership=mem_emp,
            employee_code='EMP-ALP-001',
            designation='Lead Courier',
            status=EmployeeStatus.ACTIVE,
        )

        # Organization B
        org_b = Organization.objects.create(
            name='Beta Cargo',
            legal_name='Beta Cargo Logistics LLC',
            code='BETA',
            contact_email='contact@beta.test',
            status=OrganizationStatus.APPROVED,
        )
        owner_b = User.objects.create_user(
            email='owner@beta.test',
            password='TestPassword123!',
            role=UserRole.ORGANIZATION_OWNER,
            is_active=True,
        )
        OrganizationMembership.objects.create(
            organization=org_b,
            user=owner_b,
            role=UserRole.ORGANIZATION_OWNER,
            is_active=True,
        )
        branch_b1 = Branch.objects.create(
            organization=org_b,
            code='BETA-HUB-1',
            name='Beta Mumbai Port',
            address='456 Sea Rd',
            pincode='400001',
            city='Mumbai',
            state='Maharashtra',
            country='India',
            status='ACTIVE',
        )
        ServiceArea.objects.create(branch=branch_b1, postal_code='400001', is_serviceable=True)

        return {
            'admin_user': admin_user,
            'org_a': org_a,
            'owner_a': owner_a,
            'branch_a1': branch_a1,
            'bm_user': bm_user,
            'org_b': org_b,
            'owner_b': owner_b,
            'branch_b1': branch_b1,
        }

    def test_unauthenticated_dashboard_rejected(self, api_client):
        res = api_client.get('/api/v1/dashboard/summary/')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_platform_admin_receives_global_metrics(self, api_client, setup_multi_tenant_ecosystem):
        data = setup_multi_tenant_ecosystem
        api_client.force_authenticate(user=data['admin_user'])

        res = api_client.get('/api/v1/dashboard/summary/')
        assert res.status_code == status.HTTP_200_OK
        json_data = res.json()

        assert json_data['role'] == UserRole.PLATFORM_ADMIN
        assert json_data['scope'] == 'GLOBAL'
        metrics = json_data['metrics']
        assert metrics['total_organizations'] == 2
        assert metrics['approved_organizations'] == 2
        assert metrics['total_branches'] == 2
        assert metrics['active_branches'] == 2
        assert metrics['total_service_areas'] == 3
        assert metrics['total_employees'] == 1

    def test_organization_owner_receives_tenant_scoped_metrics(self, api_client, setup_multi_tenant_ecosystem):
        data = setup_multi_tenant_ecosystem
        # Owner A
        api_client.force_authenticate(user=data['owner_a'])

        res = api_client.get('/api/v1/dashboard/summary/')
        assert res.status_code == status.HTTP_200_OK
        json_data = res.json()

        assert json_data['role'] == UserRole.ORGANIZATION_OWNER
        assert json_data['scope'] == 'TENANT'
        assert json_data['organization']['code'] == 'ALPHA'
        metrics = json_data['metrics']
        # Tenant A has 1 branch, 2 service areas, 1 employee (does not see Tenant B's branch/area)
        assert metrics['total_branches'] == 1
        assert metrics['active_branches'] == 1
        assert metrics['total_service_areas'] == 2
        assert metrics['total_employees'] == 1
        assert metrics['active_employees'] == 1

    def test_branch_manager_receives_branch_scoped_metrics(self, api_client, setup_multi_tenant_ecosystem):
        data = setup_multi_tenant_ecosystem
        # Branch Manager A1
        api_client.force_authenticate(user=data['bm_user'])

        res = api_client.get('/api/v1/dashboard/summary/')
        assert res.status_code == status.HTTP_200_OK
        json_data = res.json()

        assert json_data['role'] == UserRole.BRANCH_MANAGER
        assert json_data['scope'] == 'BRANCH'
        assert json_data['branch']['code'] == 'ALPHA-HUB-1'
        metrics = json_data['metrics']
        assert metrics['assigned_employees'] == 1
        assert metrics['active_employees'] == 1
        assert metrics['service_areas_covered'] == 2

    def test_cross_tenant_metric_snooping_forbidden(self, api_client, setup_multi_tenant_ecosystem):
        data = setup_multi_tenant_ecosystem
        # Owner B tries to request Owner A's org metrics via header/param
        api_client.force_authenticate(user=data['owner_b'])

        res = api_client.get(f"/api/v1/dashboard/summary/?organization_id={data['org_a'].id}")
        assert res.status_code == status.HTTP_403_FORBIDDEN
        assert res.json()['error']['code'] == 'TENANT_NOT_FOUND'
