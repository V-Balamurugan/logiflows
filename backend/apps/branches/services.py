import logging
from typing import Optional, Dict, Any, List
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Branch, BranchStatus, ServiceArea
from apps.organizations.models import Organization, OrganizationMembership, OrganizationStatus
from apps.accounts.models import User, UserRole
from apps.accounts.services.audit_service import log_audit_event

logger = logging.getLogger('apps.branches.services')


@transaction.atomic
def create_branch(
    actor: User,
    data: Dict[str, Any],
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> Branch:
    """
    Create a new physical postal / logistics branch within an organization.
    Enforces that unapproved organizations cannot create branches.
    """
    organization = data['organization']
    if organization.status != OrganizationStatus.APPROVED:
        raise ValidationError({
            'organization': f"Cannot create branches in organization '{organization.code}' with status '{organization.status}'."
        })

    # Authorization verification
    if actor.role != UserRole.PLATFORM_ADMIN:
        has_admin = OrganizationMembership.objects.filter(
            user=actor,
            organization=organization,
            role__in=[UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN],
            is_active=True,
        ).exists()
        if not has_admin:
            raise PermissionDenied("Only Organization Owners or Administrators can create branches.")

    code = data['code'].strip().upper()
    if Branch.objects.filter(organization=organization, code__iexact=code).exists():
        raise ValidationError({'code': f"A branch with code '{code}' already exists in this organization."})

    manager = data.get('manager')

    branch = Branch.objects.create(
        organization=organization,
        code=code,
        name=data['name'].strip(),
        address=data['address'].strip(),
        pincode=data['pincode'].strip(),
        city=data['city'].strip(),
        state=data['state'].strip(),
        country=data.get('country', 'India').strip(),
        contact_email=data.get('contact_email', '').strip(),
        contact_phone=data.get('contact_phone', '').strip(),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        operating_hours=data.get('operating_hours', {}),
        status=data.get('status', BranchStatus.ACTIVE),
        manager=manager,
    )

    # If manager assigned, scope their membership to this branch
    if manager:
        membership = OrganizationMembership.objects.filter(
            user=manager,
            organization=organization,
            is_active=True,
        ).first()
        if membership:
            membership.role = UserRole.BRANCH_MANAGER
            membership.branch = branch
            membership.save(update_fields=['role', 'branch', 'updated_at'])

    log_audit_event(
        action='BRANCH_CREATED',
        actor=actor,
        target_type='Branch',
        target_id=str(branch.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'organization_code': organization.code,
            'branch_code': branch.code,
            'branch_name': branch.name,
            'manager_email': manager.email if manager else None,
        },
    )

    return branch


@transaction.atomic
def assign_branch_manager(
    actor: User,
    branch: Branch,
    manager: User,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> Branch:
    """
    Assign a designated manager to a branch and update their membership scope.
    """
    if actor.role != UserRole.PLATFORM_ADMIN:
        has_admin = OrganizationMembership.objects.filter(
            user=actor,
            organization=branch.organization,
            role__in=[UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN],
            is_active=True,
        ).exists()
        if not has_admin:
            raise PermissionDenied("Only Organization Owners or Administrators can assign branch managers.")

    membership = OrganizationMembership.objects.filter(
        user=manager,
        organization=branch.organization,
        is_active=True,
    ).first()

    if not membership:
        raise ValidationError({'manager': f"User '{manager.email}' does not hold active membership in this organization."})

    branch.manager = manager
    branch.save(update_fields=['manager', 'updated_at'])

    # Update membership role to BRANCH_MANAGER and link branch
    membership.role = UserRole.BRANCH_MANAGER
    membership.branch = branch
    membership.save(update_fields=['role', 'branch', 'updated_at'])

    log_audit_event(
        action='BRANCH_MANAGER_ASSIGNED',
        actor=actor,
        target_type='Branch',
        target_id=str(branch.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'branch_code': branch.code,
            'manager_email': manager.email,
        },
    )

    return branch


@transaction.atomic
def add_service_area(
    actor: User,
    branch: Branch,
    postal_code: str,
    is_serviceable: bool = True,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> ServiceArea:
    """
    Add a postal code service area to a branch with intra-organization conflict detection.
    """
    postal_code = postal_code.strip().upper()

    if is_serviceable:
        conflicting_area = ServiceArea.objects.filter(
            branch__organization=branch.organization,
            postal_code__iexact=postal_code,
            is_serviceable=True,
            branch__status=BranchStatus.ACTIVE,
        ).exclude(branch=branch).select_related('branch').first()

        if conflicting_area:
            raise ValidationError({
                'postal_code': (
                    f"Postal code '{postal_code}' is already served by branch "
                    f"'{conflicting_area.branch.name}' ({conflicting_area.branch.code}) "
                    f"in this organization."
                )
            })

    service_area, created = ServiceArea.objects.update_or_create(
        branch=branch,
        postal_code=postal_code,
        defaults={'is_serviceable': is_serviceable},
    )

    log_audit_event(
        action='SERVICE_AREA_ADDED' if created else 'SERVICE_AREA_UPDATED',
        actor=actor,
        target_type='ServiceArea',
        target_id=str(service_area.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'branch_code': branch.code,
            'postal_code': postal_code,
            'is_serviceable': is_serviceable,
        },
    )

    return service_area


def check_postal_serviceability(
    postal_code: str,
    organization_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Check if a postal code is serviceable by any active branch.
    Optionally scoped to a specific organization.
    """
    postal_code = postal_code.strip().upper()
    qs = ServiceArea.objects.filter(
        postal_code__iexact=postal_code,
        is_serviceable=True,
        branch__status=BranchStatus.ACTIVE,
        branch__organization__status=OrganizationStatus.APPROVED,
    ).select_related('branch', 'branch__organization')

    if organization_id:
        qs = qs.filter(branch__organization_id=organization_id)

    results = []
    for sa in qs:
        results.append({
            'postal_code': sa.postal_code,
            'is_serviceable': True,
            'organization': {
                'id': str(sa.branch.organization.id),
                'name': sa.branch.organization.name,
                'code': sa.branch.organization.code,
            },
            'branch': {
                'id': str(sa.branch.id),
                'name': sa.branch.name,
                'code': sa.branch.code,
                'city': sa.branch.city,
                'state': sa.branch.state,
                'contact_phone': sa.branch.contact_phone,
            },
        })

    return results

