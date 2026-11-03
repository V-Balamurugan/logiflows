from django.db import models
from django.utils import timezone
from apps.core.models import BaseModel


class EmployeeStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'
    ON_LEAVE = 'ON_LEAVE', 'On Leave'


class EmployeeProfile(BaseModel):
    """
    Employee Profile Entity.
    Links directly to an OrganizationMembership and contains workplace metadata,
    employee ID code, designation, contact info, and temporary password flags.
    """
    membership = models.OneToOneField(
        'organizations.OrganizationMembership',
        on_delete=models.CASCADE,
        related_name='employee_profile',
        verbose_name='organization membership',
    )
    employee_code = models.CharField('employee code / ID', max_length=50, db_index=True)
    designation = models.CharField('job title / designation', max_length=100, blank=True, default='')
    phone = models.CharField('official contact phone', max_length=30, blank=True, default='')
    status = models.CharField(
        'employment status',
        max_length=20,
        choices=EmployeeStatus.choices,
        default=EmployeeStatus.ACTIVE,
        db_index=True,
    )
    joined_date = models.DateField('joining date', default=timezone.localdate)
    temporary_password_active = models.BooleanField(
        'requires password change',
        default=False,
        help_text='Indicates employee was provisioned with a temporary password and must change it on first login.',
    )

    class Meta:
        verbose_name = 'Employee Profile'
        verbose_name_plural = 'Employee Profiles'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee_code'], name='emp_code_idx'),
            models.Index(fields=['status'], name='emp_status_idx'),
        ]

    def __str__(self):
        return f'{self.membership.user.full_name} [{self.employee_code}] - {self.membership.organization.code}'

    def save(self, *args, **kwargs):
        if self.employee_code:
            self.employee_code = self.employee_code.strip().upper()
        super().save(*args, **kwargs)

