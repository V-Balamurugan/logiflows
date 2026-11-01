import pytest
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserProfile, UserRole, AccountToken, AccountTokenType


@pytest.mark.django_db
class TestAuthAPIEndpoints:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()
        mail.outbox.clear()

    def test_register_endpoint_success(self):
        response = self.client.post(
            reverse('auth-register'),
            {
                'email': 'customer1@logiflows.test',
                'password': 'SecurePassword2026!',
                'confirm_password': 'SecurePassword2026!',
                'first_name': 'First',
                'last_name': 'Customer',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert 'message' in response.data
        assert response.data['email'] == 'customer1@logiflows.test'

        # Verify DB state
        user = User.objects.get(email='customer1@logiflows.test')
        assert user.role == UserRole.CUSTOMER
        assert not user.is_active

    def test_register_privilege_escalation_rejected(self):
        """Test that client passing role=PLATFORM_ADMIN in registration payload is rejected."""
        response = self.client.post(
            reverse('auth-register'),
            {
                'email': 'hacker@logiflows.test',
                'password': 'SecurePassword2026!',
                'confirm_password': 'SecurePassword2026!',
                'role': 'PLATFORM_ADMIN',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
        assert response.data['error']['code'] == 'VALIDATION_ERROR'
        assert not User.objects.filter(email='hacker@logiflows.test').exists()

    def test_register_mismatched_password(self):
        response = self.client.post(
            reverse('auth-register'),
            {
                'email': 'mismatch@logiflows.test',
                'password': 'SecurePassword2026!',
                'confirm_password': 'DifferentPassword2026!',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['error']['code'] == 'VALIDATION_ERROR'

    def test_register_weak_password_rejected(self):
        response = self.client.post(
            reverse('auth-register'),
            {
                'email': 'weakpw@logiflows.test',
                'password': '123',
                'confirm_password': '123',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['error']['code'] == 'VALIDATION_ERROR'

    def test_activate_endpoint(self):
        # Register user to produce activation email
        self.client.post(
            reverse('auth-register'),
            {
                'email': 'activate_api@logiflows.test',
                'password': 'SecurePassword2026!',
                'confirm_password': 'SecurePassword2026!',
            },
            format='json',
        )
        token = mail.outbox[0].body.split('token=')[1].split('\n')[0].strip()

        # Call activate endpoint
        response = self.client.post(reverse('auth-activate'), {'token': token}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data

        user = User.objects.get(email='activate_api@logiflows.test')
        assert user.is_active

    def test_login_and_silent_refresh_via_cookie(self):
        user = User.objects.create_user(
            email='logintest@logiflows.test',
            password='ValidPassword2026!',
            first_name='Test',
            last_name='User',
            is_active=True,
        )
        UserProfile.objects.create(user=user, phone='+1234567890')

        # 1. Login
        login_res = self.client.post(
            reverse('auth-login'),
            {'email': 'logintest@logiflows.test', 'password': 'ValidPassword2026!'},
            format='json',
        )
        assert login_res.status_code == status.HTTP_200_OK
        assert 'access' in login_res.data
        assert login_res.data['user']['email'] == 'logintest@logiflows.test'
        assert login_res.data['user']['role'] == UserRole.CUSTOMER
        assert login_res.data['user']['profile']['phone'] == '+1234567890'

        # Refresh token is delivered in HttpOnly cookie
        assert 'refresh_token' in login_res.cookies
        cookie = login_res.cookies['refresh_token']
        assert cookie['httponly'] is True
        assert cookie['path'] == '/api/v1/auth/'
        assert cookie['samesite'] == 'Lax'
        initial_refresh_token = cookie.value

        # 2. Silent Refresh using the cookie
        refresh_res = self.client.post(reverse('auth-refresh'), format='json')
        assert refresh_res.status_code == status.HTTP_200_OK
        assert 'access' in refresh_res.data
        assert refresh_res.data['access'] != login_res.data['access']
        assert 'refresh_token' in refresh_res.cookies
        new_refresh_token = refresh_res.cookies['refresh_token'].value
        assert new_refresh_token != initial_refresh_token

        # 3. Old refresh token reuse fails
        self.client.cookies['refresh_token'] = initial_refresh_token
        reuse_res = self.client.post(reverse('auth-refresh'), format='json')
        assert reuse_res.status_code == status.HTTP_400_BAD_REQUEST
        assert reuse_res.data['error']['code'] == 'TOKEN_EXPIRED'

    def test_login_invalid_credentials_returns_generic_error(self):
        response = self.client.post(
            reverse('auth-login'),
            {'email': 'nonexistent@logiflows.test', 'password': 'WrongPassword123!'},
            format='json',
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.data['error']['code'] == 'INVALID_CREDENTIALS'

    def test_login_inactive_user_returns_account_inactive(self):
        user = User.objects.create_user(
            email='inactive_api@logiflows.test',
            password='ValidPassword2026!',
            is_active=False,
        )
        response = self.client.post(
            reverse('auth-login'),
            {'email': 'inactive_api@logiflows.test', 'password': 'ValidPassword2026!'},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data['error']['code'] == 'ACCOUNT_INACTIVE'

    def test_logout_endpoint_clears_cookie_and_revokes(self):
        user = User.objects.create_user(
            email='logoutuser@logiflows.test',
            password='ValidPassword2026!',
            is_active=True,
        )
        login_res = self.client.post(
            reverse('auth-login'),
            {'email': 'logoutuser@logiflows.test', 'password': 'ValidPassword2026!'},
            format='json',
        )
        assert 'refresh_token' in login_res.cookies
        refresh_token = login_res.cookies['refresh_token'].value

        # Logout
        logout_res = self.client.post(reverse('auth-logout'), format='json')
        assert logout_res.status_code == status.HTTP_200_OK

        # Cookie deleted (empty string or max-age 0)
        assert logout_res.cookies['refresh_token'].value == ''

        # Refresh with revoked token fails
        self.client.cookies['refresh_token'] = refresh_token
        attempt_refresh = self.client.post(reverse('auth-refresh'), format='json')
        assert attempt_refresh.status_code == status.HTTP_400_BAD_REQUEST

    def test_password_change_endpoint(self):
        user = User.objects.create_user(
            email='pwchange_api@logiflows.test',
            password='OldPassword2026!',
            is_active=True,
        )
        login_res = self.client.post(
            reverse('auth-login'),
            {'email': 'pwchange_api@logiflows.test', 'password': 'OldPassword2026!'},
            format='json',
        )
        access_token = login_res.data['access']

        # Unauthenticated request fails
        unauth_res = self.client.post(
            reverse('auth-password-change'),
            {
                'current_password': 'OldPassword2026!',
                'new_password': 'NewPassword2026!',
                'confirm_password': 'NewPassword2026!',
            },
            format='json',
        )
        assert unauth_res.status_code == status.HTTP_401_UNAUTHORIZED

        # Authenticated with wrong current password fails
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        bad_cur_res = self.client.post(
            reverse('auth-password-change'),
            {
                'current_password': 'WrongPassword!',
                'new_password': 'NewPassword2026!',
                'confirm_password': 'NewPassword2026!',
            },
            format='json',
        )
        assert bad_cur_res.status_code == status.HTTP_400_BAD_REQUEST

        # Authenticated with matching password succeeds
        good_res = self.client.post(
            reverse('auth-password-change'),
            {
                'current_password': 'OldPassword2026!',
                'new_password': 'NewPassword2026!',
                'confirm_password': 'NewPassword2026!',
            },
            format='json',
        )
        assert good_res.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.check_password('NewPassword2026!')

    def test_password_reset_request_and_confirm_endpoints(self):
        user = User.objects.create_user(
            email='reset_api@logiflows.test',
            password='InitialPassword2026!',
            is_active=True,
        )

        # 1. Non-existent email returns generic 200 (no user enumeration)
        nonexist_res = self.client.post(
            reverse('auth-password-reset-request'),
            {'email': 'nobody@logiflows.test'},
            format='json',
        )
        assert nonexist_res.status_code == status.HTTP_200_OK
        assert len(mail.outbox) == 0

        # 2. Existing active user receives email and 200
        req_res = self.client.post(
            reverse('auth-password-reset-request'),
            {'email': 'reset_api@logiflows.test'},
            format='json',
        )
        assert req_res.status_code == status.HTTP_200_OK
        assert len(mail.outbox) == 1
        reset_token = mail.outbox[0].body.split('token=')[1].split('\n')[0].strip()

        # 3. Confirm password reset
        confirm_res = self.client.post(
            reverse('auth-password-reset-confirm'),
            {
                'token': reset_token,
                'new_password': 'ResetSuccessPassword2026!',
                'confirm_password': 'ResetSuccessPassword2026!',
            },
            format='json',
        )
        assert confirm_res.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.check_password('ResetSuccessPassword2026!')

    def test_users_me_and_profile_endpoints(self):
        user = User.objects.create_user(
            email='meuser@logiflows.test',
            password='Password2026!',
            first_name='Current',
            last_name='User',
            is_active=True,
        )
        UserProfile.objects.create(user=user, phone='+9876543210', bio='Logistics manager')

        login_res = self.client.post(
            reverse('auth-login'),
            {'email': 'meuser@logiflows.test', 'password': 'Password2026!'},
            format='json',
        )
        access_token = login_res.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        # GET /api/v1/users/me/
        me_res = self.client.get(reverse('users-me'))
        assert me_res.status_code == status.HTTP_200_OK
        assert me_res.data['email'] == 'meuser@logiflows.test'
        assert me_res.data['profile']['phone'] == '+9876543210'

        # PATCH /api/v1/users/me/
        patch_res = self.client.patch(
            reverse('users-me'),
            {
                'first_name': 'UpdatedFirst',
                'phone': '+1122334455',
                'bio': 'Updated Bio',
            },
            format='json',
        )
        assert patch_res.status_code == status.HTTP_200_OK
        assert patch_res.data['first_name'] == 'UpdatedFirst'
        assert patch_res.data['profile']['phone'] == '+1122334455'
        assert patch_res.data['profile']['bio'] == 'Updated Bio'

        # GET /api/v1/users/me/profile/
        prof_res = self.client.get(reverse('users-me-profile'))
        assert prof_res.status_code == status.HTTP_200_OK
        assert prof_res.data['phone'] == '+1122334455'

    def test_login_response_payload_tokens(self):
        user = User.objects.create_user(
            email='tokenformat@logiflows.test',
            password='Password2026!',
            is_active=True,
        )
        UserProfile.objects.create(user=user)

        res = self.client.post(
            reverse('auth-login'),
            {'email': 'tokenformat@logiflows.test', 'password': 'Password2026!'},
            format='json',
        )
        assert res.status_code == status.HTTP_200_OK
        assert 'token' in res.data
        assert 'access' in res.data
        assert 'access_token' in res.data
        assert res.data['token_type'] == 'Bearer'
        assert res.data['expires_in'] == 900
        assert res.data['token'] == res.data['access']

    def test_login_direct_alias_endpoints(self):
        user = User.objects.create_user(
            email='aliaslogin@logiflows.test',
            password='Password2026!',
            is_active=True,
        )
        UserProfile.objects.create(user=user)

        # /api/v1/login/
        res1 = self.client.post(
            reverse('login-direct'),
            {'email': 'aliaslogin@logiflows.test', 'password': 'Password2026!'},
            format='json',
        )
        assert res1.status_code == status.HTTP_200_OK
        assert 'token' in res1.data

        # /login/ (root alias)
        res2 = self.client.post(
            reverse('root-login'),
            {'email': 'aliaslogin@logiflows.test', 'password': 'Password2026!'},
            format='json',
        )
        assert res2.status_code == status.HTTP_200_OK
        assert 'token' in res2.data

    def test_standard_jwt_bearer_auth_header_formats(self):
        """Gate Item A4: Standardize strictly on RFC 6750 Bearer authentication."""
        user = User.objects.create_user(
            email='bearerauth@logiflows.test',
            password='Password2026!',
            is_active=True,
        )
        UserProfile.objects.create(user=user)

        login_res = self.client.post(
            reverse('auth-login'),
            {'email': 'bearerauth@logiflows.test', 'password': 'Password2026!'},
            format='json',
        )
        token = login_res.data['token']

        # 1. Standard RFC 6750: Bearer <token>
        res = self.client.get(reverse('users-me'), HTTP_AUTHORIZATION=f'Bearer {token}')
        assert res.status_code == status.HTTP_200_OK

        # 2. Resilient UI duplicate: Bearer Bearer <token>
        res = self.client.get(reverse('users-me'), HTTP_AUTHORIZATION=f'Bearer Bearer {token}')
        assert res.status_code == status.HTTP_200_OK

        # 3. Raw JWT string starting with 'ey'
        res = self.client.get(reverse('users-me'), HTTP_AUTHORIZATION=token)
        assert res.status_code == status.HTTP_200_OK

        # 4. Non-standard prefix should be rejected on protected endpoints
        res = self.client.get(reverse('users-me'), HTTP_AUTHORIZATION=f'InvalidScheme {token}')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

        # 5. Non-standard header X-Auth-Token should be rejected
        res = self.client.get(reverse('users-me'), HTTP_X_AUTH_TOKEN=token)
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_allow_any_endpoint_with_invalid_token(self):
        """AllowAny endpoints should not crash with 401 when an invalid/expired token is sent."""
        res = self.client.get(reverse('health-check'), HTTP_AUTHORIZATION='Bearer totally_invalid_token')
        assert res.status_code == status.HTTP_200_OK
        assert res.data['status'] == 'healthy'

