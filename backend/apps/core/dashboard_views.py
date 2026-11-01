from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiResponse

from apps.accounts.models import User, UserRole
from apps.organizations.models import Organization, OrganizationStatus, OrganizationMembership
from apps.branches.models import Branch, ServiceArea
from apps.employees.models import EmployeeProfile


class DashboardSummaryView(APIView):
    """
    Returns aggregated dashboard metrics and telemetry scoped strictly
    to the authenticated user's role, tenant, and branch assignment.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['04 - Tenant & Role Dashboards'],
        summary='Retrieve Role & Tenant Dashboard Telemetry',
        description=(
            'Aggregates real-time tenant KPIs, active branch counts, service area coverage, '
            'and staffing status scoped strictly by RBAC hierarchy. Platform Admins receive '
            'global platform metrics; Organization Owners/Admins receive tenant-level metrics; '
            'Branch Managers receive branch-level metrics.'
        ),
        responses={
            200: OpenApiResponse(description='Dashboard telemetry summary scoped to user role.'),
        },
    )
    def get(self, request):
        user = request.user

        # 1. Platform Admin global view
        if user.role == UserRole.PLATFORM_ADMIN:
            return Response({
                'role': UserRole.PLATFORM_ADMIN,
                'scope': 'GLOBAL',
                'metrics': {
                    'total_organizations': Organization.objects.count(),
                    'pending_organizations': Organization.objects.filter(status=OrganizationStatus.PENDING).count(),
                    'approved_organizations': Organization.objects.filter(status=OrganizationStatus.APPROVED).count(),
                    'suspended_organizations': Organization.objects.filter(status=OrganizationStatus.SUSPENDED).count(),
                    'rejected_organizations': Organization.objects.filter(status=OrganizationStatus.REJECTED).count(),
                    'total_branches': Branch.objects.count(),
                    'active_branches': Branch.objects.filter(status='ACTIVE').count(),
                    'total_service_areas': ServiceArea.objects.filter(is_serviceable=True).count(),
                    'total_employees': EmployeeProfile.objects.count(),
                    'total_users': User.objects.count(),
                },
            })

        # 2. Tenant-scoped users: find active membership in approved org
        requested_org_id = request.query_params.get('organization_id') or request.headers.get('X-Organization-ID')

        memberships_qs = OrganizationMembership.objects.filter(
            user=user,
            is_active=True,
            organization__status=OrganizationStatus.APPROVED,
        ).select_related('organization', 'branch')

        if requested_org_id:
            try:
                membership = memberships_qs.get(organization_id=requested_org_id)
            except OrganizationMembership.DoesNotExist:
                return Response(
                    {
                        'error': {
                            'code': 'TENANT_NOT_FOUND',
                            'message': 'No active membership found for the requested organization.',
                            'details': None,
                        }
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            membership = memberships_qs.first()

        # If user has no active organization membership (e.g. regular customer)
        if not membership:
            return Response({
                'role': user.role,
                'scope': 'PERSONAL',
                'has_tenant': False,
                'metrics': {
                    'account_status': 'ACTIVE' if user.is_active else 'INACTIVE',
                },
            })

        org = membership.organization
        role = membership.role

        # 3. Organization Owner / Admin view
        if role in [UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN]:
            total_branches = Branch.objects.filter(organization=org).count()
            active_branches = Branch.objects.filter(organization=org, status='ACTIVE').count()
            total_service_areas = ServiceArea.objects.filter(
                branch__organization=org,
                is_serviceable=True,
            ).count()
            total_employees = EmployeeProfile.objects.filter(
                membership__organization=org
            ).count()
            active_employees = EmployeeProfile.objects.filter(
                membership__organization=org,
                status='ACTIVE',
                membership__is_active=True,
            ).count()

            return Response({
                'role': role,
                'scope': 'TENANT',
                'has_tenant': True,
                'organization': {
                    'id': str(org.id),
                    'name': org.name,
                    'code': org.code,
                    'status': org.status,
                },
                'metrics': {
                    'total_branches': total_branches,
                    'active_branches': active_branches,
                    'inactive_branches': total_branches - active_branches,
                    'total_service_areas': total_service_areas,
                    'total_employees': total_employees,
                    'active_employees': active_employees,
                },
            })

        # 4. Branch Manager view
        if role == UserRole.BRANCH_MANAGER:
            branch = membership.branch
            if branch:
                assigned_employees = EmployeeProfile.objects.filter(membership__branch=branch).count()
                active_employees = EmployeeProfile.objects.filter(
                    membership__branch=branch,
                    status='ACTIVE',
                    membership__is_active=True,
                ).count()
                service_areas_count = ServiceArea.objects.filter(
                    branch=branch,
                    is_serviceable=True,
                ).count()

                return Response({
                    'role': role,
                    'scope': 'BRANCH',
                    'has_tenant': True,
                    'organization': {
                        'id': str(org.id),
                        'name': org.name,
                        'code': org.code,
                        'status': org.status,
                    },
                    'branch': {
                        'id': str(branch.id),
                        'name': branch.name,
                        'code': branch.code,
                        'status': branch.status,
                    },
                    'metrics': {
                        'assigned_employees': assigned_employees,
                        'active_employees': active_employees,
                        'service_areas_covered': service_areas_count,
                    },
                })
            else:
                return Response({
                    'role': role,
                    'scope': 'BRANCH',
                    'has_tenant': True,
                    'organization': {
                        'id': str(org.id),
                        'name': org.name,
                        'code': org.code,
                    },
                    'branch': None,
                    'metrics': {
                        'assigned_employees': 0,
                        'active_employees': 0,
                        'service_areas_covered': 0,
                    },
                })

        # 5. Generic Employee / Customer view
        return Response({
            'role': role,
            'scope': 'EMPLOYEE',
            'has_tenant': True,
            'organization': {
                'id': str(org.id),
                'name': org.name,
                'code': org.code,
            },
            'branch': {
                'id': str(membership.branch.id) if membership.branch else None,
                'name': membership.branch.name if membership.branch else None,
                'code': membership.branch.code if membership.branch else None,
            } if membership.branch else None,
            'metrics': {
                'is_active': membership.is_active,
            },
        })
