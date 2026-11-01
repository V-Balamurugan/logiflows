import pytest
from datetime import timedelta
from django.utils import timezone
from apps.accounts.models import User, UserProfile, UserRole, AuditLog, AccountToken, AccountTokenType


@pytest.mark.django_db
class TestAccountModels:
    def test_user_lockout_mechanism(self):
        user = User.objects.create_user(email='testlockout@example.com', password='ValidPassword123!')
        assert not user.is_locked_out
        assert user.failed_login_attempts == 0

        # Simulate 4 failed attempts
        for _ in range(4):
            user.record_failed_login(lockout_threshold=5, lockout_minutes=15)
        user.refresh_from_db()
        assert not user.is_locked_out
        assert user.failed_login_attempts == 4

        # 5th failed attempt triggers lockout
        user.record_failed_login(lockout_threshold=5, lockout_minutes=15)
        user.refresh_from_db()
        assert user.is_locked_out
        assert user.failed_login_attempts == 5
        assert user.lockout_until > timezone.now()

        # Reset failed logins
        user.reset_failed_logins(ip_address='192.168.1.10')
        user.refresh_from_db()
        assert not user.is_locked_out
        assert user.failed_login_attempts == 0
        assert user.last_login_ip == '192.168.1.10'

    def test_user_profile_linkage_and_representation(self):
        user = User.objects.create_user(
            email='profileuser@example.com',
            password='ValidPassword123!',
            first_name='Jane',
            last_name='Doe',
        )
        profile = UserProfile.objects.create(
            user=user,
            phone='+1234567890',
            bio='Test Bio',
        )
        assert profile.full_name == 'Jane Doe'
        assert str(profile) == 'Profile of profileuser@example.com'
        assert user.profile == profile

    def test_audit_log_creation_and_ordering(self):
        user = User.objects.create_user(email='audituser@example.com', password='ValidPassword123!')
        log1 = AuditLog.objects.create(
            actor=user,
            action='TEST_ACTION_1',
            ip_address='127.0.0.1',
            user_agent='TestAgent/1.0',
            metadata={'step': 1},
        )
        log2 = AuditLog.objects.create(
            actor=None,
            actor_email='anonymous@example.com',
            action='TEST_ACTION_2',
            ip_address='10.0.0.1',
            metadata={'step': 2},
        )

        logs = list(AuditLog.objects.filter(id__in=[log1.id, log2.id]))
        assert logs[0] == log2  # Ordered by -created_at
        assert logs[1] == log1
        assert 'TEST_ACTION_1' in str(log1)
        assert 'anonymous@example.com' in str(log2)

    def test_account_token_lifecycle(self):
        user = User.objects.create_user(email='tokenuser@example.com', password='ValidPassword123!')
        raw_token, token_obj = AccountToken.create_token(
            user=user,
            token_type=AccountTokenType.ACTIVATION,
            lifetime_hours=1,
        )

        assert token_obj.is_valid
        assert not token_obj.is_used
        assert AccountToken.hash_token(raw_token) == token_obj.token_hash

        # Expired token test
        token_obj.expires_at = timezone.now() - timedelta(minutes=5)
        token_obj.save()
        assert not token_obj.is_valid

        # Mark as used
        token_obj.mark_as_used()
        assert token_obj.is_used
        assert token_obj.used_at is not None
        assert not token_obj.is_valid
