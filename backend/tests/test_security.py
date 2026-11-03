import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import User, AuditLog, UserRole
from apps.accounts.serializers import UserSerializer


@pytest.mark.django_db
class TestSecurityAndHardening:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()

    def test_passwords_never_present_in_serialization(self):
        user = User.objects.create_user(
            email='securityuser@logiflows.test',
            password='SuperSecretPassword2026!',
            is_active=True,
        )
        data = UserSerializer(user).data
        assert 'password' not in data
        assert 'token_hash' not in data
        assert 'failed_login_attempts' not in data

    def test_passwords_never_logged_in_audit_logs(self):
        self.client.post(
            reverse('auth-login'),
            {'email': 'testaudit@logiflows.test', 'password': 'PlaintextPassword123!'},
            format='json',
        )
        logs = AuditLog.objects.all()
        for log in logs:
            log_str = f'{log.metadata} {log.action}'
            assert 'PlaintextPassword123!' not in log_str

    def test_user_enumeration_resistance_password_reset(self):
        """Responses for existing and non-existing accounts must be completely identical."""
        res_nonexist = self.client.post(
            reverse('auth-password-reset-request'),
            {'email': 'nonexistent_account@logiflows.test'},
            format='json',
        )
        User.objects.create_user(
            email='real_account@logiflows.test',
            password='Password123!',
            is_active=True,
        )
        res_exist = self.client.post(
            reverse('auth-password-reset-request'),
            {'email': 'real_account@logiflows.test'},
            format='json',
        )

        assert res_nonexist.status_code == status.HTTP_200_OK
        assert res_exist.status_code == status.HTTP_200_OK
        assert res_nonexist.data == res_exist.data

    def test_login_user_enumeration_resistance(self):
        """Login attempts with non-existent email vs incorrect password for existing account must return identical errors."""
        res_nonexist = self.client.post(
            reverse('auth-login'),
            {'email': 'nobody_exists@logiflows.test', 'password': 'WrongPassword123!'},
            format='json',
        )
        User.objects.create_user(
            email='real_user@logiflows.test',
            password='RealPassword123!',
            is_active=True,
        )
        res_exist_wrong_pass = self.client.post(
            reverse('auth-login'),
            {'email': 'real_user@logiflows.test', 'password': 'WrongPassword123!'},
            format='json',
        )
        assert res_nonexist.status_code == status.HTTP_401_UNAUTHORIZED
        assert res_exist_wrong_pass.status_code == status.HTTP_401_UNAUTHORIZED
        assert res_nonexist.data == res_exist_wrong_pass.data
        assert res_nonexist.data['error']['code'] == 'INVALID_CREDENTIALS'

    def test_cookie_flags_security(self):
        user = User.objects.create_user(
            email='cookie_security@logiflows.test',
            password='ValidPassword2026!',
            is_active=True,
        )
        response = self.client.post(
            reverse('auth-login'),
            {'email': 'cookie_security@logiflows.test', 'password': 'ValidPassword2026!'},
            format='json',
        )
        assert 'refresh_token' in response.cookies
        cookie = response.cookies['refresh_token']
        assert cookie['httponly'] is True
        assert cookie['path'] == '/api/v1/auth/'
        assert cookie['samesite'] == 'Lax'

    def test_brute_force_lockout_after_threshold(self):
        user = User.objects.create_user(
            email='bruteforce@logiflows.test',
            password='TargetPassword2026!',
            is_active=True,
        )
        for i in range(5):
            res = self.client.post(
                reverse('auth-login'),
                {'email': 'bruteforce@logiflows.test', 'password': f'WrongPass{i}!'},
                format='json',
            )
            if i < 4:
                assert res.status_code == status.HTTP_401_UNAUTHORIZED
                assert res.data['error']['code'] == 'INVALID_CREDENTIALS'

        # 5th attempt triggered lockout
        assert res.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert res.data['error']['code'] == 'THROTTLED'
