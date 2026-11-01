from django.db import models
from apps.core.models import BaseModel
from apps.accounts.models import User


class BranchStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'


class Branch(BaseModel):
    """
    Branch Entity.
    Physical postal hub, sorting center, or delivery depot belonging to an Organization.
    Branch code must be unique within an organization.
    """
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='branches',
        verbose_name='organization',
    )
    code = models.CharField('branch code', max_length=50, db_index=True)
    name = models.CharField('branch name', max_length=255)
    address = models.TextField('physical street address')
    pincode = models.CharField('postal code / pincode', max_length=20, db_index=True)
    city = models.CharField('city', max_length=100)
    state = models.CharField('state / province', max_length=100)
    country = models.CharField('country', max_length=100, default='India')
    contact_email = models.EmailField('branch email', max_length=255, blank=True, default='')
    contact_phone = models.CharField('branch phone', max_length=30, blank=True, default='')
    latitude = models.DecimalField('latitude', max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField('longitude', max_digits=9, decimal_places=6, null=True, blank=True)
    operating_hours = models.JSONField('operating hours', default=dict, blank=True)
    status = models.CharField(
        'branch status',
        max_length=20,
        choices=BranchStatus.choices,
        default=BranchStatus.ACTIVE,
        db_index=True,
    )
    manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_branches',
        verbose_name='branch manager',
    )

    class Meta:
        verbose_name = 'Branch'
        verbose_name_plural = 'Branches'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'code'], name='branch_org_code_idx'),
            models.Index(fields=['organization', 'status'], name='branch_org_status_idx'),
            models.Index(fields=['pincode'], name='branch_pincode_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'code'],
                name='unique_org_branch_code',
            ),
        ]

    def __str__(self):
        return f'{self.name} ({self.code}) - {self.organization.code}'

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.strip().upper()
        super().save(*args, **kwargs)


class ServiceArea(BaseModel):
    """
    Service Area Entity.
    Defines postal codes or zones serviceable by a specific branch.
    Overlap-conflict rule:
    Within the SAME organization, an active serviceable area (is_serviceable=True) cannot overlap.
    """
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name='service_areas',
        verbose_name='branch',
    )
    postal_code = models.CharField('postal code / pincode', max_length=20, db_index=True)
    is_serviceable = models.BooleanField('is serviceable', default=True, db_index=True)

    class Meta:
        verbose_name = 'Service Area'
        verbose_name_plural = 'Service Areas'
        ordering = ['postal_code']
        indexes = [
            models.Index(fields=['branch', 'postal_code'], name='svcarea_branch_post_idx'),
            models.Index(fields=['postal_code', 'is_serviceable'], name='svcarea_code_svc_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['branch', 'postal_code'],
                name='unique_branch_postal_code',
            ),
        ]

    def __str__(self):
        status = 'Serviceable' if self.is_serviceable else 'Unserviceable'
        return f'{self.postal_code} -> {self.branch.name} [{status}]'

    def save(self, *args, **kwargs):
        if self.postal_code:
            self.postal_code = self.postal_code.strip()
        super().save(*args, **kwargs)
