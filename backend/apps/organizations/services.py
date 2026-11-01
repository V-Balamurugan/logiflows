import logging
from typing import Optional, Dict, Any
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from rest_framework.exceptions import ValidationError, PermissionDenied

from .models import Organization, OrganizationMembership, OrganizationStatus
from apps.accounts.models import User, UserRole
from apps.accounts.services.audit_service import log_audit_event

logger = logging.getLogger('apps.organizations.services')


def send_org_status_email(
    organization: Organization,
    recipient_emails: list[str],
    subject: str,
    headline: str,
    body_text: str,
    action_note: str = '',
) -> None:
    """
    Send transactional email notifying stakeholders of organization approval/rejection/suspension.
    """
    message = (
        f'Hello,\n\n'
        f'{headline}\n\n'
        f'Organization: {organization.name} ({organization.code})\n'
        f'Status: {organization.get_status_display()}\n\n'
        f'{body_text}\n\n'
        f'{action_note}\n\n'
        f'Best regards,\nLogiFlows Platform Administration'
    )
    html_message = (
        f'<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">'
        f'<h2 style="color: #0f172a;">{headline}</h2>'
        f'<p><strong>Organization:</strong> {organization.name} (<code>{organization.code}</code>)<br/>'
        f'<strong>Status:</strong> {organization.get_status_display()}</p>'
        f'<p>{body_text}</p>'
        f'{f"<p style=\"color: #b91c1c; background: #fef2f2; padding: 12px; border-radius: 6px;\"><strong>Note / Reason:</strong> {action_note}</p>" if action_note else ""}'
        f'<p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">LogiFlows AI-Powered Smart Postal and B2B Delivery Management Platform</p>'
        f'</div>'
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_emails,
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f'Failed to send organization status email to {recipient_emails}: {e}')


@transaction.atomic
def register_organization(
    applicant: User,
    data: Dict[str, Any],
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> Organization:
    """
    Process new organization registration submitted by an authenticated user.
    Creates organization in PENDING state and registers the applicant as a prospective owner
    with is_active=False until platform admin approval.
    """
    if not applicant or not applicant.is_authenticated:
        raise PermissionDenied('Authentication is required to register an organization.')

    # Ensure code is uppercase
    code = data['code'].strip().upper()
    if Organization.objects.filter(code__iexact=code).exists():
        raise ValidationError({'code': f"An organization with code '{code}' already exists."})

    organization = Organization.objects.create(
        name=data['name'].strip(),
        legal_name=data['legal_name'].strip(),
        registration_number=data.get('registration_number', '').strip(),
        code=code,
        contact_email=data['contact_email'].strip().lower(),
        contact_phone=data.get('contact_phone', '').strip(),
        address=data.get('address', '').strip(),
        status=OrganizationStatus.PENDING,
        settings=data.get('settings', {}),
    )

    # Prospective owner membership: is_active=False until approved
    OrganizationMembership.objects.create(
        user=applicant,
        organization=organization,
        role=UserRole.ORGANIZATION_OWNER,
        is_active=False,
    )

    log_audit_event(
        action='ORG_REGISTERED',
        actor=applicant,
        target_type='Organization',
        target_id=str(organization.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'organization_code': organization.code,
            'organization_name': organization.name,
            'applicant_email': applicant.email,
        },
    )

    # Notify applicant
    recipients = list(set([applicant.email, organization.contact_email]))
    send_org_status_email(
        organization=organization,
        recipient_emails=recipients,
        subject='LogiFlows: Organization Registration Submitted',
        headline='Organization Registration Received',
        body_text='Your organization registration has been submitted and is currently pending review by the platform administration team.',
    )

    return organization


@transaction.atomic
def approve_organization(
    actor: User,
    organization: Organization,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> Organization:
    """
    Approve a pending organization. Transition status to APPROVED and activate owner membership.
    Only PLATFORM_ADMIN can execute this service.
    """
    if not actor.is_authenticated or actor.role != UserRole.PLATFORM_ADMIN:
        raise PermissionDenied('Only Platform Administrators can approve organizations.')

    if organization.status != OrganizationStatus.PENDING:
        raise ValidationError({
            'status': f"Cannot approve organization with status '{organization.status}'. Only PENDING organizations can be approved."
        })

    organization.status = OrganizationStatus.APPROVED
    organization.rejection_reason = ''
    organization.save(update_fields=['status', 'rejection_reason', 'updated_at'])

    # Activate owner membership
    owner_membership = OrganizationMembership.objects.filter(
        organization=organization,
        role=UserRole.ORGANIZATION_OWNER,
    ).first()

    if owner_membership:
        owner_membership.is_active = True
        owner_membership.save(update_fields=['is_active', 'updated_at'])

        # Upgrade owner primary role if they were a standard CUSTOMER
        owner_user = owner_membership.user
        if owner_user.role == UserRole.CUSTOMER:
            owner_user.role = UserRole.ORGANIZATION_OWNER
            owner_user.save(update_fields=['role', 'updated_at'])

    log_audit_event(
        action='ORG_APPROVED',
        actor=actor,
        target_type='Organization',
        target_id=str(organization.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'organization_code': organization.code,
            'organization_name': organization.name,
        },
    )

    # Email notification
    recipients = [organization.contact_email]
    if owner_membership and owner_membership.user.email not in recipients:
        recipients.append(owner_membership.user.email)

    send_org_status_email(
        organization=organization,
        recipient_emails=recipients,
        subject='LogiFlows: Organization Approved',
        headline='Congratulations! Your Organization is Approved',
        body_text='Your organization has been approved. You now have full access to manage branches, employees, and logistics operations.',
    )

    return organization


@transaction.atomic
def reject_organization(
    actor: User,
    organization: Organization,
    reason: str,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> Organization:
    """
    Reject a pending organization with a documented reason.
    Only PLATFORM_ADMIN can execute this service.
    """
    if not actor.is_authenticated or actor.role != UserRole.PLATFORM_ADMIN:
        raise PermissionDenied('Only Platform Administrators can reject organizations.')

    if organization.status != OrganizationStatus.PENDING:
        raise ValidationError({
            'status': f"Cannot reject organization with status '{organization.status}'. Only PENDING organizations can be rejected."
        })

    reason = reason.strip()
    if not reason:
        raise ValidationError({'reason': 'A rejection reason is required.'})

    organization.status = OrganizationStatus.REJECTED
    organization.rejection_reason = reason
    organization.save(update_fields=['status', 'rejection_reason', 'updated_at'])

    # Ensure memberships remain inactive
    OrganizationMembership.objects.filter(
        organization=organization,
    ).update(is_active=False)

    log_audit_event(
        action='ORG_REJECTED',
        actor=actor,
        target_type='Organization',
        target_id=str(organization.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'organization_code': organization.code,
            'reason': reason,
        },
    )

    recipients = [organization.contact_email]
    owner_membership = OrganizationMembership.objects.filter(
        organization=organization,
        role=UserRole.ORGANIZATION_OWNER,
    ).first()
    if owner_membership and owner_membership.user.email not in recipients:
        recipients.append(owner_membership.user.email)

    send_org_status_email(
        organization=organization,
        recipient_emails=recipients,
        subject='LogiFlows: Organization Application Status',
        headline='Organization Application Update',
        body_text='Your organization registration was not approved at this time.',
        action_note=reason,
    )

    return organization


@transaction.atomic
def suspend_organization(
    actor: User,
    organization: Organization,
    reason: str,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> Organization:
    """
    Suspend an active organization with a documented reason.
    Only PLATFORM_ADMIN can execute this service.
    """
    if not actor.is_authenticated or actor.role != UserRole.PLATFORM_ADMIN:
        raise PermissionDenied('Only Platform Administrators can suspend organizations.')

    if organization.status != OrganizationStatus.APPROVED:
        raise ValidationError({
            'status': f"Cannot suspend organization with status '{organization.status}'. Only APPROVED organizations can be suspended."
        })

    reason = reason.strip()
    if not reason:
        raise ValidationError({'reason': 'A suspension reason is required.'})

    organization.status = OrganizationStatus.SUSPENDED
    organization.suspension_reason = reason
    organization.save(update_fields=['status', 'suspension_reason', 'updated_at'])

    log_audit_event(
        action='ORG_SUSPENDED',
        actor=actor,
        target_type='Organization',
        target_id=str(organization.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'organization_code': organization.code,
            'reason': reason,
        },
    )

    recipients = [organization.contact_email]
    owner_membership = OrganizationMembership.objects.filter(
        organization=organization,
        role=UserRole.ORGANIZATION_OWNER,
    ).first()
    if owner_membership and owner_membership.user.email not in recipients:
        recipients.append(owner_membership.user.email)

    send_org_status_email(
        organization=organization,
        recipient_emails=recipients,
        subject='LogiFlows: Organization Account Suspended',
        headline='Organization Suspended',
        body_text='Your organization account has been temporarily suspended by the platform administrator.',
        action_note=reason,
    )

    return organization


@transaction.atomic
def update_membership_role(
    actor: User,
    membership: OrganizationMembership,
    new_role: str,
    new_branch=None,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> OrganizationMembership:
    """
    Update membership role and/or assigned branch with strict role-hierarchy checks:
    - Only ORGANIZATION_OWNER (or PLATFORM_ADMIN) can assign ORGANIZATION_ADMIN.
    - ORGANIZATION_OWNER or ORGANIZATION_ADMIN can assign BRANCH_MANAGER or EMPLOYEE.
    - The active ORGANIZATION_OWNER role cannot be modified via standard update.
    """
    if actor.role != UserRole.PLATFORM_ADMIN:
        actor_membership = OrganizationMembership.objects.filter(
            user=actor,
            organization=membership.organization,
            is_active=True,
            role__in=[UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN],
        ).first()

        if not actor_membership:
            raise PermissionDenied('Administrative privileges required in this organization.')

        # If target is owner, block modification
        if membership.role == UserRole.ORGANIZATION_OWNER and new_role != UserRole.ORGANIZATION_OWNER:
            raise PermissionDenied('Organization Owner role cannot be modified. Ownership transfer required.')

        # Only owner can assign ORGANIZATION_ADMIN
        if new_role == UserRole.ORGANIZATION_ADMIN and actor_membership.role != UserRole.ORGANIZATION_OWNER:
            raise PermissionDenied('Only the Organization Owner can appoint Organization Administrators.')

    old_role = membership.role
    membership.role = new_role
    if new_branch is not None:
        membership.branch = new_branch
    membership.save(update_fields=['role', 'branch', 'updated_at'])

    log_audit_event(
        action='MEMBERSHIP_ROLE_UPDATED',
        actor=actor,
        target_type='OrganizationMembership',
        target_id=str(membership.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'organization_id': str(membership.organization_id),
            'target_user_id': str(membership.user_id),
            'old_role': old_role,
            'new_role': new_role,
        },
    )

    return membership


@transaction.atomic
def deactivate_membership(
    actor: User,
    membership: OrganizationMembership,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> OrganizationMembership:
    """
    Deactivate an organization membership.
    Owners cannot be deactivated.
    """
    if membership.role == UserRole.ORGANIZATION_OWNER:
        raise ValidationError('The Organization Owner cannot be deactivated.')

    if actor.role != UserRole.PLATFORM_ADMIN:
        has_admin = OrganizationMembership.objects.filter(
            user=actor,
            organization=membership.organization,
            is_active=True,
            role__in=[UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN],
        ).exists()
        if not has_admin:
            raise PermissionDenied('Administrative privileges required to deactivate members.')

    membership.is_active = False
    membership.save(update_fields=['is_active', 'updated_at'])

    log_audit_event(
        action='MEMBERSHIP_DEACTIVATED',
        actor=actor,
        target_type='OrganizationMembership',
        target_id=str(membership.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'organization_id': str(membership.organization_id),
            'target_user_id': str(membership.user_id),
        },
    )

    return membership


@transaction.atomic
def activate_membership(
    actor: User,
    membership: OrganizationMembership,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> OrganizationMembership:
    """
    Reactivate a previously deactivated membership.
    """
    if actor.role != UserRole.PLATFORM_ADMIN:
        has_admin = OrganizationMembership.objects.filter(
            user=actor,
            organization=membership.organization,
            is_active=True,
            role__in=[UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN],
        ).exists()
        if not has_admin:
            raise PermissionDenied('Administrative privileges required to activate members.')

    membership.is_active = True
    membership.save(update_fields=['is_active', 'updated_at'])

    log_audit_event(
        action='MEMBERSHIP_ACTIVATED',
        actor=actor,
        target_type='OrganizationMembership',
        target_id=str(membership.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'organization_id': str(membership.organization_id),
            'target_user_id': str(membership.user_id),
        },
    )

    return membership
