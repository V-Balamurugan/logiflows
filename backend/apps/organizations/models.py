import uuid
from django.db import models
from django.db.models import Q
from apps.core.models import BaseModel
from apps.accounts.models import User, UserRole


class OrganizationStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Approval'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'
    SUSPENDED = 'SUSPENDED', 'Suspended'


class Organization(BaseModel):
    """
    Organization (Tenant) Entity.
    Represents an enterprise postal or logistics client with an isolated tenant boundary.
    All business objects (branches, dispatches, orders) are strictly scoped to an organization.
    """
    name = models.CharField('organization name', max_length=255)
    legal_name = models.CharField('legal registered name', max_length=255)
    registration_number = models.CharField('tax / company registration number', max_length=100, blank=True, default='')
    code = models.CharField('unique organization code', max_length=50, unique=True, db_index=True)
    contact_email = models.EmailField('primary contact email', max_length=255)
    contact_phone = models.CharField('primary contact phone', max_length=30, blank=True, default='')
    address = models.TextField('headquarters address', blank=True, default='')
    status = models.CharField(
        'organization status',
        max_length=20,
        choices=OrganizationStatus.choices,
        default=OrganizationStatus.PENDING,
        db_index=True,
    )
    rejection_reason = models.TextField('rejection reason', blank=True, default='')
    suspension_reason = models.TextField('suspension reason', blank=True, default='')
    settings = models.JSONField('tenant settings', default=dict, blank=True)

    class Meta:
        verbose_name = 'Organization'
        verbose_name_plural = 'Organizations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code'], name='org_code_idx'),
            models.Index(fields=['status'], name='org_status_idx'),
            models.Index(fields=['created_at'], name='org_created_idx'),
        ]

    def __str__(self):
        return f'{self.name} [{self.code}] ({self.get_status_display()})'

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.strip().upper()
        super().save(*args, **kwargs)

    @property
    def is_approved(self) -> bool:
        return self.status == OrganizationStatus.APPROVED

    @property
    def is_suspended(self) -> bool:
        return self.status == OrganizationStatus.SUSPENDED


class OrganizationMembership(BaseModel):
    """
    User-to-Organization Membership binding with specific RBAC role and optional branch scope.
    Enforces that:
    1. A user can only have one membership per organization.
    2. Exactly one ACTIVE organization owner exists per organization via a PostgreSQL partial unique index.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='memberships',
        verbose_name='user',
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='memberships',
        verbose_name='organization',
    )
    role = models.CharField(
        'organization role',
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.EMPLOYEE,
        db_index=True,
    )
    branch = models.ForeignKey(
        'branches.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='memberships',
        verbose_name='assigned branch',
    )
    is_active = models.BooleanField(
        'is membership active',
        default=True,
        db_index=True,
    )

    class Meta:
        verbose_name = 'Organization Membership'
        verbose_name_plural = 'Organization Memberships'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'organization'], name='membership_user_org_idx'),
            models.Index(fields=['organization', 'role'], name='membership_org_role_idx'),
            models.Index(fields=['branch'], name='membership_branch_idx'),
            models.Index(fields=['is_active'], name='membership_active_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'organization'],
                name='unique_user_organization',
            ),
            models.UniqueConstraint(
                fields=['organization'],
                condition=Q(role=UserRole.ORGANIZATION_OWNER, is_active=True),
                name='unique_active_org_owner',
            ),
        ]

    def __str__(self):
        active_str = 'ACTIVE' if self.is_active else 'INACTIVE'
        return f'{self.user.email} -> {self.organization.code} [{self.role} - {active_str}]'

