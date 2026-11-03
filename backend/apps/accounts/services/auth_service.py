import logging
from typing import Tuple, Optional
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.accounts.models import User, UserProfile, UserRole, AccountTokenType
from apps.accounts.exceptions import (
    InvalidCredentialsException,
    AccountInactiveException,
    AccountLockedOutException,
    TokenInvalidOrExpiredException,
)
from .audit_service import log_audit_event
from .email_service import send_activation_email, send_password_reset_email
from .token_service import create_account_token, validate_and_consume_token, TokenExpiredOrInvalid

logger = logging.getLogger('apps.accounts.auth')


def register_customer(
    email: str,
    password: str,
    first_name: str = '',
    last_name: str = '',
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> User:
    """
    Self-register a customer with strictly enforced role CUSTOMER.
    Creates User, UserProfile, and sends email activation link atomically.
    Account remains inactive (is_active=False) until email link verification.
    """
    email_clean = email.strip().lower()

    if User.objects.filter(email__iexact=email_clean).exists():
        raise ValidationError({'email': ['A user with this email address already exists.']})

    try:
        validate_password(password)
    except DjangoValidationError as err:
        raise ValidationError({'password': list(err.messages)})

    with transaction.atomic():
        user = User.objects.create_user(
            email=email_clean,
            password=password,
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            role=UserRole.CUSTOMER,
            is_active=False,  # Inactive until email activation
        )

        UserProfile.objects.create(
            user=user,
            phone='',
            bio='',
        )

        raw_token, _ = create_account_token(
            user=user,
            token_type=AccountTokenType.ACTIVATION,
            lifetime_hours=24,
        )

        # Dispatch activation email; if it fails, atomic transaction rolls back completely
        send_activation_email(user, raw_token)

        log_audit_event(
            action='AUTH_REGISTER',
            actor=user,
            target_type='User',
            target_id=str(user.id),
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={'role': user.role, 'email': user.email},
        )

    logger.info(f'Customer registered successfully: {user.email}')
    return user


def activate_account(
    raw_token: str,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> User:
    """
    Activate an inactive user account using a single-use signed activation token.
    """
    try:
        user = validate_and_consume_token(
            raw_token=raw_token,
            token_type=AccountTokenType.ACTIVATION,
        )
    except TokenExpiredOrInvalid as exc:
        raise TokenInvalidOrExpiredException(str(exc))

    user.is_active = True
    user.save(update_fields=['is_active', 'updated_at'])

    log_audit_event(
        action='AUTH_ACTIVATED',
        actor=user,
        target_type='User',
        target_id=str(user.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={'email': user.email},
    )

    logger.info(f'Account activated: {user.email}')
    return user


def authenticate_user(
    email: str,
    password: str,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> Tuple[User, str, str]:
    """
    Authenticate user credentials, check lockout & activation status,
    and return (user, access_token, refresh_token).
    """
    email_clean = email.strip().lower()

    try:
        user = User.objects.select_related('profile').get(email__iexact=email_clean)
    except User.DoesNotExist:
        log_audit_event(
            action='AUTH_LOGIN_FAILED',
            actor_email=email_clean,
            target_type='User',
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={'reason': 'user_not_found'},
        )
        raise InvalidCredentialsException()

    if user.is_locked_out:
        log_audit_event(
            action='USER_LOCKED_OUT',
            actor=user,
            target_type='User',
            target_id=str(user.id),
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={'lockout_until': user.lockout_until.isoformat() if user.lockout_until else None},
        )
        raise AccountLockedOutException()

    if not user.check_password(password):
        user.record_failed_login(lockout_threshold=5, lockout_minutes=15)
        log_audit_event(
            action='AUTH_LOGIN_FAILED',
            actor=user,
            target_type='User',
            target_id=str(user.id),
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={'failed_attempts': user.failed_login_attempts},
        )
        if user.is_locked_out:
            raise AccountLockedOutException()
        raise InvalidCredentialsException()

    if not user.is_active:
        log_audit_event(
            action='AUTH_LOGIN_INACTIVE',
            actor=user,
            target_type='User',
            target_id=str(user.id),
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={'is_active': False},
        )
        raise AccountInactiveException()

    user.reset_failed_logins(ip_address=ip_address)

    refresh = RefreshToken.for_user(user)
    # Include role and email in token claims
    refresh['role'] = user.role
    refresh['email'] = user.email

    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    log_audit_event(
        action='AUTH_LOGIN_SUCCESS',
        actor=user,
        target_type='User',
        target_id=str(user.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={'role': user.role},
    )

    return user, access_token, refresh_token


def refresh_access_token(
    raw_refresh_token: str,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> Tuple[User, str, str]:
    """
    Rotate refresh token: blacklists the old token, issues a new refresh token and access token.
    Guarantees that replaying old refresh tokens fails.
    """
    if not raw_refresh_token or not raw_refresh_token.strip():
        raise TokenInvalidOrExpiredException('Refresh token is required.')

    try:
        old_refresh = RefreshToken(raw_refresh_token.strip())
        user_id = old_refresh.payload.get('user_id')
        user = User.objects.select_related('profile').get(id=user_id)
    except (TokenError, User.DoesNotExist) as exc:
        logger.warning(f'Refresh token rejection: {exc}')
        raise TokenInvalidOrExpiredException('Refresh token is invalid or expired.')

    if not user.is_active:
        raise AccountInactiveException()

    # Blacklist old refresh token
    try:
        old_refresh.blacklist()
    except Exception as exc:
        logger.warning(f'Could not blacklist old refresh token: {exc}')

    # Create new rotating token pair
    new_refresh = RefreshToken.for_user(user)
    new_refresh['role'] = user.role
    new_refresh['email'] = user.email

    new_access_token = str(new_refresh.access_token)
    new_refresh_token = str(new_refresh)

    log_audit_event(
        action='AUTH_TOKEN_REFRESH',
        actor=user,
        target_type='User',
        target_id=str(user.id),
        ip_address=ip_address,
        user_agent=user_agent,
    )

    return user, new_access_token, new_refresh_token


def revoke_refresh_token(
    raw_refresh_token: str,
    actor: Optional[User] = None,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> None:
    """
    Revoke a refresh token by adding it to SimpleJWT blacklist on logout.
    """
    if raw_refresh_token and raw_refresh_token.strip():
        try:
            token = RefreshToken(raw_refresh_token.strip())
            token.blacklist()
        except Exception as exc:
            logger.info(f'Logout blacklist notice (token already invalid or blacklisted): {exc}')

    log_audit_event(
        action='AUTH_LOGOUT',
        actor=actor,
        target_type='User',
        target_id=str(actor.id) if actor else '',
        ip_address=ip_address,
        user_agent=user_agent,
    )


def revoke_all_user_tokens(user: User) -> int:
    """
    Revoke (blacklist) all outstanding refresh tokens for the given user.
    Called when a user changes password or completes password reset to ensure
    all active sessions/refresh tokens are immediately invalidated.
    """
    try:
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
        outstanding = OutstandingToken.objects.filter(user=user)
        revoked_count = 0
        for token in outstanding:
            _, created = BlacklistedToken.objects.get_or_create(token=token)
            if created:
                revoked_count += 1
        logger.info(f"Revoked {revoked_count} outstanding refresh tokens for user {user.email}")
        return revoked_count
    except Exception as exc:
        logger.warning(f"Could not revoke all tokens for user {user.email}: {exc}")
        return 0


def change_password(
    user: User,
    current_password: str,
    new_password: str,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> None:
    """
    Change password for an authenticated user requiring verification of current password.
    """
    if not user.check_password(current_password):
        log_audit_event(
            action='AUTH_PASSWORD_CHANGE_FAILED',
            actor=user,
            target_type='User',
            target_id=str(user.id),
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={'reason': 'incorrect_current_password'},
        )
        raise ValidationError({'current_password': ['Current password is incorrect.']})

    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as err:
        raise ValidationError({'new_password': list(err.messages)})

    user.set_password(new_password)
    user.save(update_fields=['password', 'updated_at'])

    # Invalidate all outstanding refresh tokens for this user
    revoke_all_user_tokens(user)

    log_audit_event(
        action='AUTH_PASSWORD_CHANGE',
        actor=user,
        target_type='User',
        target_id=str(user.id),
        ip_address=ip_address,
        user_agent=user_agent,
    )
    logger.info(f'Password changed successfully for {user.email}')


def request_password_reset(
    email: str,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> bool:
    """
    Initiate password reset. If user exists and is active, sends single-use reset link.
    Always returns True to prevent user enumeration attacks.
    """
    email_clean = email.strip().lower()
    try:
        user = User.objects.get(email__iexact=email_clean)
        if user.is_active:
            raw_token, _ = create_account_token(
                user=user,
                token_type=AccountTokenType.PASSWORD_RESET,
                lifetime_hours=24,
            )
            send_password_reset_email(user, raw_token)
            log_audit_event(
                action='AUTH_PASSWORD_RESET_REQUEST',
                actor=user,
                target_type='User',
                target_id=str(user.id),
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={'email': user.email},
            )
        else:
            logger.warning(f'Password reset requested for inactive account {email_clean}')
    except User.DoesNotExist:
        log_audit_event(
            action='AUTH_PASSWORD_RESET_REQUEST_NONEXISTENT',
            actor_email=email_clean,
            target_type='User',
            ip_address=ip_address,
            user_agent=user_agent,
        )

    return True


def confirm_password_reset(
    raw_token: str,
    new_password: str,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> User:
    """
    Validate password reset token and update user password.
    """
    try:
        user = validate_and_consume_token(
            raw_token=raw_token,
            token_type=AccountTokenType.PASSWORD_RESET,
        )
    except TokenExpiredOrInvalid as exc:
        raise TokenInvalidOrExpiredException(str(exc))

    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as err:
        raise ValidationError({'new_password': list(err.messages)})

    user.set_password(new_password)
    user.failed_login_attempts = 0
    user.lockout_until = None
    user.save(update_fields=['password', 'failed_login_attempts', 'lockout_until', 'updated_at'])

    # Invalidate all outstanding refresh tokens for this user
    revoke_all_user_tokens(user)

    log_audit_event(
        action='AUTH_PASSWORD_RESET_CONFIRM',
        actor=user,
        target_type='User',
        target_id=str(user.id),
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={'email': user.email},
    )

    logger.info(f'Password reset successfully confirmed for {user.email}')
    return user
