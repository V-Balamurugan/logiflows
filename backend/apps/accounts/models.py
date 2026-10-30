import hashlib
import secrets
import uuid
from datetime import timedelta
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone

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
    failed_login_attempts = models.PositiveIntegerField('failed login attempts', default=0)
    last_failed_login = models.DateTimeField('last failed login', null=True, blank=True)
    lockout_until = models.DateTimeField('account lockout until', null=True, blank=True)
    last_login_ip = models.GenericIPAddressField('last login IP', null=True, blank=True)

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

    @property
    def is_locked_out(self):
        """Check if user account is currently under temporary security lockout."""
        if self.lockout_until and timezone.now() < self.lockout_until:
            return True
        return False

    def record_failed_login(self, lockout_threshold=5, lockout_minutes=15):
        """
        Record a failed authentication attempt and apply temporary lockout
        if consecutive threshold is breached.
        """
        now = timezone.now()
        # Reset counter if last failed attempt was more than 1 hour ago
        if self.last_failed_login and (now - self.last_failed_login) > timedelta(hours=1):
            self.failed_login_attempts = 1
        else:
            self.failed_login_attempts += 1

        self.last_failed_login = now
        if self.failed_login_attempts >= lockout_threshold:
            self.lockout_until = now + timedelta(minutes=lockout_minutes)
        self.save(update_fields=['failed_login_attempts', 'last_failed_login', 'lockout_until', 'updated_at'])

    def reset_failed_logins(self, ip_address=None):
        """Reset failed login attempts and update last login metadata."""
        update_fields = ['failed_login_attempts', 'lockout_until', 'updated_at']
        self.failed_login_attempts = 0
        self.lockout_until = None
        if ip_address:
            self.last_login_ip = ip_address
            update_fields.append('last_login_ip')
        self.save(update_fields=update_fields)


class UserProfile(models.Model):
    """
    Profile extension for User entity storing auxiliary personal and contact details.
    Auto-created via service layer to guarantee 1:1 parity without hidden signal cascades.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField('phone number', max_length=30, blank=True, default='')
    avatar_url = models.URLField('avatar URL', max_length=500, blank=True, default='')
    bio = models.TextField('biography / notes', blank=True, default='')
    created_at = models.DateTimeField('created at', auto_now_add=True)
    updated_at = models.DateTimeField('updated at', auto_now=True)

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
        ordering = ['-created_at']

    def __str__(self):
        return f'Profile of {self.user.email}'

    @property
    def full_name(self):
        return self.user.full_name


class AuditLog(models.Model):
    """
    Enterprise Security & Compliance Audit Log.
    Tracks all authentication, authorization, role, and profile mutations.
    Actors can be null for anonymous attempts (e.g. failed login with non-existent user).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='actor',
    )
    actor_email = models.EmailField('actor email', max_length=255, blank=True, default='')
    action = models.CharField('action', max_length=100, db_index=True)
    target_type = models.CharField('target type', max_length=100, blank=True, default='')
    target_id = models.CharField('target ID', max_length=255, blank=True, default='')
    ip_address = models.GenericIPAddressField('IP address', null=True, blank=True)
    user_agent = models.CharField('user agent', max_length=500, blank=True, default='')
    metadata = models.JSONField('metadata', default=dict, blank=True)
    created_at = models.DateTimeField('created at', auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['actor', 'created_at'], name='auditlog_actor_created_idx'),
            models.Index(fields=['action'], name='auditlog_action_idx'),
            models.Index(fields=['created_at'], name='auditlog_created_idx'),
        ]

    def __str__(self):
        actor_repr = self.actor_email or (self.actor.email if self.actor else 'SYSTEM/ANONYMOUS')
        return f'[{self.created_at:%Y-%m-%d %H:%M:%S}] {actor_repr} -> {self.action}'


class AccountTokenType(models.TextChoices):
    ACTIVATION = 'ACTIVATION', 'Account Activation'
    PASSWORD_RESET = 'PASSWORD_RESET', 'Password Reset'


class AccountToken(models.Model):
    """
    Database-backed, cryptographic single-use expiring token.
    Stores the SHA-256 hash of the secure random token given to the user.
    Prevents token enumeration and guarantees single-use invalidation upon redemption.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='account_tokens')
    token_hash = models.CharField('token SHA-256 hash', max_length=64, unique=True, db_index=True)
    token_type = models.CharField(
        'token type',
        max_length=32,
        choices=AccountTokenType.choices,
        db_index=True,
    )
    expires_at = models.DateTimeField('expires at', db_index=True)
    is_used = models.BooleanField('is used', default=False, db_index=True)
    used_at = models.DateTimeField('used at', null=True, blank=True)
    created_at = models.DateTimeField('created at', auto_now_add=True)

    class Meta:
        verbose_name = 'Account Token'
        verbose_name_plural = 'Account Tokens'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'token_type'], name='acctok_user_type_idx'),
            models.Index(fields=['token_hash', 'token_type'], name='acctok_hash_type_idx'),
            models.Index(fields=['expires_at'], name='acctok_expires_idx'),
        ]

    def __str__(self):
        status = 'USED' if self.is_used else ('EXPIRED' if not self.is_valid else 'ACTIVE')
        return f'{self.get_token_type_display()} token for {self.user.email} [{status}]'

    @property
    def is_valid(self):
        """Returns True if the token has not been used and has not expired."""
        return not self.is_used and timezone.now() < self.expires_at

    def mark_as_used(self):
        """Mark token as redeemed and record redemption timestamp."""
        self.is_used = True
        self.used_at = timezone.now()
        self.save(update_fields=['is_used', 'used_at'])

    @staticmethod
    def hash_token(raw_token: str) -> str:
        """Compute SHA-256 hex digest of raw token."""
        return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

    @classmethod
    def create_token(cls, user: User, token_type: str, lifetime_hours: int = 24):
        """
        Generate a cryptographically secure random token and store its hash.
        Returns a tuple of (raw_token_string, token_instance).
        """
        raw_token = secrets.token_urlsafe(48)
        token_hash = cls.hash_token(raw_token)
        expires_at = timezone.now() + timedelta(hours=lifetime_hours)
        token_instance = cls.objects.create(
            user=user,
            token_hash=token_hash,
            token_type=token_type,
            expires_at=expires_at,
        )
        return raw_token, token_instance
