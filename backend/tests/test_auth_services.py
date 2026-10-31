import pytest
from unittest.mock import patch
from django.core import mail
from django.utils import timezone
from datetime import timedelta
from rest_framework.exceptions import ValidationError

from apps.accounts.models import User, UserProfile, UserRole, AuditLog, AccountToken, AccountTokenType
from apps.accounts.exceptions import (
    InvalidCredentialsException,
    AccountInactiveException,
    AccountLockedOutException,
    TokenInvalidOrExpiredException,
)
from apps.accounts.services import (
    register_customer,
    activate_account,
    authenticate_user,
    refresh_access_token,
    revoke_refresh_token,
    change_password,
    request_password_reset,
    confirm_password_reset,
)


@pytest.mark.django_db
class TestAuthServices:
    def test_register_customer_success(self):
        mail.outbox.clear()
        user = register_customer(
            email='newcustomer@example.com',
            password='SecureCustomerPass2026!',
            first_name='Alex',
            last_name='Smith',
            ip_address='127.0.0.1',
            user_agent='PytestAgent',
        )

        assert user.email == 'newcustomer@example.com'
        assert user.role == UserRole.CUSTOMER
        assert not user.is_active  # Inactive until email activation
        assert hasattr(user, 'profile')
        assert user.full_name == 'Alex Smith'

        # Email was sent
        assert len(mail.outbox) == 1
        assert 'Activate Your LogiFlows Account' in mail.outbox[0].subject
        assert user.email in mail.outbox[0].to

        # Token was created
        token_record = AccountToken.objects.get(user=user, token_type=AccountTokenType.ACTIVATION)
        assert not token_record.is_used

        # Audit log was created
        log = AuditLog.objects.filter(actor=user, action='AUTH_REGISTER').first()
        assert log is not None
        assert log.ip_address == '127.0.0.1'

    def test_register_customer_email_failure_rolls_back_transaction(self):
        mail.outbox.clear()
        initial_user_count = User.objects.count()
        initial_profile_count = UserProfile.objects.count()

        # Simulate SMTP server failure
        with patch('apps.accounts.services.auth_service.send_activation_email', side_effect=Exception('SMTP server unreachable')):
            with pytest.raises(Exception, match='SMTP server unreachable'):
                register_customer(
                    email='failmail@example.com',
                    password='SecureCustomerPass2026!',
                    first_name='Rollback',
                    last_name='Test',
                )

        # Confirm complete rollback: no orphan user or profile created in DB
        assert User.objects.count() == initial_user_count
        assert UserProfile.objects.count() == initial_profile_count
        assert not User.objects.filter(email='failmail@example.com').exists()

    def test_register_customer_duplicate_email_case_insensitive(self):
        register_customer(
            email='duplicate@example.com',
            password='SecureCustomerPass2026!',
        )

        with pytest.raises(ValidationError) as exc_info:
            register_customer(
                email='DUPLICATE@EXAMPLE.COM',
                password='SecureCustomerPass2026!',
            )
        assert 'email' in exc_info.value.detail

    def test_activate_account_success_and_single_use(self):
        user = register_customer(
            email='activate_me@example.com',
            password='SecureCustomerPass2026!',
        )
        assert not user.is_active

        # Extract raw token from outbox email
        email_body = mail.outbox[-1].body
        token = email_body.split('token=')[1].split('\n')[0].strip()

        # First activation succeeds
        activated_user = activate_account(token, ip_address='127.0.0.1')
        assert activated_user.id == user.id
        assert activated_user.is_active

        # Second activation attempt with identical token fails (single use)
        with pytest.raises(TokenInvalidOrExpiredException, match='already been used'):
            activate_account(token)

    def test_activate_account_expired_token(self):
        user = register_customer(
            email='expired_tok@example.com',
            password='SecureCustomerPass2026!',
        )
        token_record = AccountToken.objects.get(user=user, token_type=AccountTokenType.ACTIVATION)
        token_record.expires_at = timezone.now() - timedelta(minutes=1)
        token_record.save()

        email_body = mail.outbox[-1].body
        token = email_body.split('token=')[1].split('\n')[0].strip()

        with pytest.raises(TokenInvalidOrExpiredException, match='expired'):
            activate_account(token)

    def test_authenticate_user_inactive_account(self):
        register_customer(
            email='inactiveuser@example.com',
            password='SecureCustomerPass2026!',
        )
        with pytest.raises(AccountInactiveException):
            authenticate_user('inactiveuser@example.com', 'SecureCustomerPass2026!')

    def test_authenticate_user_bad_password_and_lockout(self):
        user = register_customer(
            email='lockouttest@example.com',
            password='SecureCustomerPass2026!',
        )
        user.is_active = True
        user.save()

        # 4 failed attempts raise InvalidCredentialsException
        for _ in range(4):
            with pytest.raises(InvalidCredentialsException):
                authenticate_user('lockouttest@example.com', 'WrongPassword123!')

        user.refresh_from_db()
        assert not user.is_locked_out

        # 5th failed attempt triggers lockout
        with pytest.raises(AccountLockedOutException):
            authenticate_user('lockouttest@example.com', 'WrongPassword123!')

        user.refresh_from_db()
        assert user.is_locked_out

        # Even correct password is now blocked by lockout
        with pytest.raises(AccountLockedOutException):
            authenticate_user('lockouttest@example.com', 'SecureCustomerPass2026!')

    def test_authenticate_user_success_and_token_refresh(self):
        user = register_customer(
            email='successuser@example.com',
            password='SecureCustomerPass2026!',
        )
        user.is_active = True
        user.save()

        auth_user, access_token, refresh_token = authenticate_user(
            'successuser@example.com',
            'SecureCustomerPass2026!',
            ip_address='127.0.0.1',
        )
        assert auth_user.id == user.id
        assert access_token
        assert refresh_token

        # Silent refresh rotates the token
        refreshed_user, new_access, new_refresh = refresh_access_token(refresh_token)
        assert refreshed_user.id == user.id
        assert new_access != access_token
        assert new_refresh != refresh_token

        # Attempting to reuse the old refresh token fails because it is blacklisted
        with pytest.raises(TokenInvalidOrExpiredException):
            refresh_access_token(refresh_token)

    def test_change_password(self):
        user = register_customer(
            email='changepw@example.com',
            password='OldSecurePassword2026!',
        )
        user.is_active = True
        user.save()

        # Incorrect current password fails
        with pytest.raises(ValidationError):
            change_password(user, 'WrongCurrentPw123!', 'NewSecurePassword2026!')

        # Correct current password succeeds
        change_password(user, 'OldSecurePassword2026!', 'NewSecurePassword2026!')
        user.refresh_from_db()
        assert user.check_password('NewSecurePassword2026!')

    def test_change_password_revokes_outstanding_refresh_tokens(self):
        user = register_customer(
            email='revokepw@example.com',
            password='OldSecurePassword2026!',
        )
        user.is_active = True
        user.save()

        auth_user, access_token, refresh_token = authenticate_user(
            'revokepw@example.com',
            'OldSecurePassword2026!',
        )
        assert refresh_token

        # Change password
        change_password(user, 'OldSecurePassword2026!', 'NewSecurePassword2026!')

        # The previous refresh token must now be rejected/blacklisted
        with pytest.raises(TokenInvalidOrExpiredException):
            refresh_access_token(refresh_token)

    def test_password_reset_flow(self):
        mail.outbox.clear()
        user = register_customer(
            email='resetuser@example.com',
            password='OldPassword123!',
        )
        user.is_active = True
        user.save()
        mail.outbox.clear()

        # Request reset for non-existent email returns True (no enumeration)
        assert request_password_reset('nonexistent@example.com') is True
        assert len(mail.outbox) == 0

        # Request reset for active user dispatches email
        assert request_password_reset('resetuser@example.com') is True
        assert len(mail.outbox) == 1
        assert 'Reset Your LogiFlows Password' in mail.outbox[0].subject

        email_body = mail.outbox[0].body
        reset_token = email_body.split('token=')[1].split('\n')[0].strip()

        # Confirm password reset with token
        confirm_password_reset(reset_token, 'BrandNewPassword2026!')
        user.refresh_from_db()
        assert user.check_password('BrandNewPassword2026!')

        # Cannot reuse reset token
        with pytest.raises(TokenInvalidOrExpiredException):
            confirm_password_reset(reset_token, 'AnotherPassword2026!')

    def test_password_reset_revokes_outstanding_refresh_tokens(self):
        mail.outbox.clear()
        user = register_customer(
            email='resetrevoke@example.com',
            password='OldSecurePassword2026!',
        )
        user.is_active = True
        user.save()

        auth_user, access_token, refresh_token = authenticate_user(
            'resetrevoke@example.com',
            'OldSecurePassword2026!',
        )
        assert refresh_token

        request_password_reset('resetrevoke@example.com')
        email_body = mail.outbox[-1].body
        reset_token = email_body.split('token=')[1].split('\n')[0].strip()

        confirm_password_reset(reset_token, 'BrandNewPassword2026!')

        # The previous refresh token must now be rejected/blacklisted
        with pytest.raises(TokenInvalidOrExpiredException):
            refresh_access_token(refresh_token)

