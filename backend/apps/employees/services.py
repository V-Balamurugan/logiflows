import logging
import secrets
import string
from typing import Optional, Dict, Any
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import EmployeeProfile, EmployeeStatus
from apps.organizations.models import Organization, OrganizationMembership, OrganizationStatus
from apps.branches.models import Branch, BranchStatus
from apps.accounts.models import User, UserProfile, UserRole
from apps.accounts.services.audit_service import log_audit_event

logger = logging.getLogger('apps.employees.services')


def generate_temp_password(length: int = 12) -> str:
    """Generate cryptographically strong random password for provisioned staff."""
    alphabet = string.ascii_letters + string.digits + '!@#$%^&*'
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
                and any(c in '!@#$%^&*' for c in password)):
            return password


def send_employee_invitation_email(
    user: User,
    organization: Organization,
    temp_password: Optional[str] = None,
    branch: Optional[Branch] = None,
) -> None:
    """Send welcome and credential onboarding email to new staff member."""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    login_url = f'{frontend_url}/login'

    subject = f'LogiFlows: Invitation to Join {organization.name}'
    credentials_block = (
        f'Your temporary access credentials:\n'
        f'Email: {user.email}\n'
        f'Temporary Password: {temp_password}\n\n'
        f'You will be required to change your password upon your first sign in.\n\n'
        if temp_password else
        f'Please sign in with your existing LogiFlows account: {user.email}\n\n'
    )

    message = (
        f'Hello {user.full_name},\n\n'
        f'You have been added as a team member of {organization.name} on LogiFlows.\n'
        f'Assigned Hub / Branch: {branch.name if branch else "Headquarters / Central"}\n\n'
        f'{credentials_block}'
        f'Sign In: {login_url}\n\n'
        f'Best regards,\nLogiFlows Team'
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f'Failed to dispatch employee invitation email to {user.email}: {e}')


@transaction.atomic
def create_employee(
    actor: User,
    organization: Organization,
    data: Dict[str, Any],
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> EmployeeProfile:
    """
    Provision or invite an employee into an organization.
    Enforces strict role hierarchy and privilege escalation boundaries.
    """
    if organization.status != OrganizationStatus.APPROVED:
        raise ValidationError({
            'organization': f"Cannot add employees to organization with status '{organization.status}'."
        })

    target_role = data.get('role', UserRole.EMPLOYEE)
    branch_id = data.get('branch_id')
    branch = None
    if branch_id:
        try:
            branch = Branch.objects.get(id=branch_id, organization=organization)
        except Branch.DoesNotExist:
            raise ValidationError({'branch_id': 'Specified branch does not exist in this organization.'})

    # Privilege escalation boundaries
    if actor.role != UserRole.PLATFORM_ADMIN:
        actor_membership = OrganizationMembership.objects.filter(
            user=actor,
            organization=organization,
            is_active=True,
        ).first()

        if not actor_membership:
            raise PermissionDenied('You do not belong to this organization.')

        # 1. Platform Admin or Owner only can assign ORGANIZATION_ADMIN
        if target_role == UserRole.ORGANIZATION_ADMIN and actor_membership.role != UserRole.ORGANIZATION_OWNER:
            raise PermissionDenied('Only the Organization Owner can appoint Organization Administrators.')

        # 2. Branch Manager can only create EMPLOYEE within their own assigned branch
        if actor_membership.role == UserRole.BRANCH_MANAGER:
            if target_role != UserRole.EMPLOYEE:
                raise PermissionDenied('Branch Managers can only add Employees.')
            if not branch or branch.id != actor_membership.branch_id:
                raise PermissionDenied('Branch Managers can only add employees within their own assigned branch.')

        # 3. Standard Employees cannot add staff
        if actor_membership.role == UserRole.EMPLOYEE:
            raise PermissionDenied('Employees do not have staff provisioning permissions.')

    # Unique employee code within organization
    employee_code = data['employee_code'].strip().upper()
    if EmployeeProfile.objects.filter(
        membership__organization=organization,
        employee_code=employee_code,
    ).exists():
        raise ValidationError({
            'employee_code': f"Employee code '{employee_code}' already exists in this organization."
        })

    email = data['email'].strip().lower()
    user = User.objects.filter(email=email).first()
    temp_password = None
    temp_password_active = False

    if user:
        # Check if already a member of this organization
        if OrganizationMembership.objects.filter(user=user, organization=organization).exists():
            raise ValidationError({'email': f"User '{email}' is already a member of this organization."})
    else:
        # Create new user with temporary password
        temp_password = data.get('temporary_password') or generate_temp_password()
        temp_password_active = True
        user = User.objects.create_user(
            email=email,
            password=temp_password,
            first_name=data['first_name'].strip(),
            last_name=data['last_name'].strip(),
            role=target_role,
            is_active=True,
        )
        UserProfile.objects.create(
            user=user,
            phone=data.get('phone', ''),
        )

    # Create OrganizationMembership
    membership = OrganizationMembership.objects.create(
        user=user,
        organization=organization,
        role=target_role,
        branch=branch,
        is_active=True,
    )

    # Create EmployeeProfile
    employee_profile = EmployeeProfile.objects.create(
        membership=membership,
        employee_code=employee_code,
        designation=data.get('designation', '').strip(),
        phone=data.get('phone', '').strip(),
        status=EmployeeStatus.ACTIVE,
        temporary_password_active=temp_password_active,
    )

    send_employee_invitation_email(
        user=user,
        organization=organization,
        temp_password=temp_password,
        branch=branch,
    )

    log_audit_event(
        action='EMPLOYEE_CREATED',
        actor=actor,
        target_type='EmployeeProfile',
        target_id=str(employee_profile.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'organization_code': organization.code,
            'employee_code': employee_profile.employee_code,
            'user_email': user.email,
            'role': target_role,
            'branch_code': branch.code if branch else None,
        },
    )

    return employee_profile


@transaction.atomic
def deactivate_employee(
    actor: User,
    employee: EmployeeProfile,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> EmployeeProfile:
    """Deactivate employee profile and their organization membership."""
    organization = employee.membership.organization

    if actor.role != UserRole.PLATFORM_ADMIN:
        actor_membership = OrganizationMembership.objects.filter(
            user=actor,
            organization=organization,
            is_active=True,
            role__in=[UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN, UserRole.BRANCH_MANAGER],
        ).first()

        if not actor_membership:
            raise PermissionDenied('Administrative privileges required.')

        if actor_membership.role == UserRole.BRANCH_MANAGER:
            if employee.membership.branch_id != actor_membership.branch_id:
                raise PermissionDenied('Branch Managers can only manage employees within their own branch.')

    employee.status = EmployeeStatus.INACTIVE
    employee.save(update_fields=['status', 'updated_at'])

    employee.membership.is_active = False
    employee.membership.save(update_fields=['is_active', 'updated_at'])

    log_audit_event(
        action='EMPLOYEE_DEACTIVATED',
        actor=actor,
        target_type='EmployeeProfile',
        target_id=str(employee.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'employee_code': employee.employee_code,
            'user_email': employee.membership.user.email,
        },
    )

    return employee


@transaction.atomic
def activate_employee(
    actor: User,
    employee: EmployeeProfile,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> EmployeeProfile:
    """Reactivate employee profile and their organization membership."""
    organization = employee.membership.organization

    if actor.role != UserRole.PLATFORM_ADMIN:
        actor_membership = OrganizationMembership.objects.filter(
            user=actor,
            organization=organization,
            is_active=True,
            role__in=[UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN, UserRole.BRANCH_MANAGER],
        ).first()

        if not actor_membership:
            raise PermissionDenied('Administrative privileges required.')

        if actor_membership.role == UserRole.BRANCH_MANAGER:
            if employee.membership.branch_id != actor_membership.branch_id:
                raise PermissionDenied('Branch Managers can only manage employees within their own branch.')

    employee.status = EmployeeStatus.ACTIVE
    employee.save(update_fields=['status', 'updated_at'])

    employee.membership.is_active = True
    employee.membership.save(update_fields=['is_active', 'updated_at'])

    log_audit_event(
        action='EMPLOYEE_ACTIVATED',
        actor=actor,
        target_type='EmployeeProfile',
        target_id=str(employee.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'employee_code': employee.employee_code,
            'user_email': employee.membership.user.email,
        },
    )

    return employee
