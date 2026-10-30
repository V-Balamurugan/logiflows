import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.db.models.functions import Lower

from .managers import UserManager


class UserRole(models.TextChoices):
    PLATFORM_ADMIN = 'PLATFORM_ADMIN', 'Platform Administrator'
    ORGANIZATION_OWNER = 'ORGANIZATION_OWNER', 'Organization Owner'
    ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN', 'Organization Administrator'
    BRANCH_MANAGER = 'BRANCH_MANAGER', 'Branch Manager'
    EMPLOYEE = 'EMPLOYEE', 'Employee'
    CUSTOMER = 'CUSTOMER', 'Customer'


class User(AbstractBaseUser, PermissionsMixin):
    """
    LogiFlows Centralized Custom User Model.
    Uses UUID as Primary Key and Email as unique login identifier.
    Initial role defaults to CUSTOMER.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField('email address', unique=True, max_length=255)
    first_name = models.CharField('first name', max_length=150, blank=True)
    last_name = models.CharField('last name', max_length=150, blank=True)
    role = models.CharField(
        'system role',
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER,
        db_index=True,
    )
    is_staff = models.BooleanField(
        'staff status',
        default=False,
        help_text='Designates whether the user can log into the Django admin site.',
    )
    is_active = models.BooleanField(
        'active',
        default=True,
        help_text='Designates whether this user should be treated as active.',
    )
    created_at = models.DateTimeField('created at', auto_now_add=True)
    updated_at = models.DateTimeField('updated at', auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email'], name='user_email_idx'),
            models.Index(Lower('email'), name='user_email_lower_idx'),
            models.Index(fields=['role'], name='user_role_idx'),
        ]

    def __str__(self):
        return f'{self.email} ({self.get_role_display()})'

    @property
    def full_name(self):
        name = f'{self.first_name} {self.last_name}'.strip()
        return name or self.email
