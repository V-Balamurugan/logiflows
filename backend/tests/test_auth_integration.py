import pytest
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole, AuditLog


@pytest.mark.django_db
class TestFullAuthLifecycleIntegration:
    """
    Complete auth journey integration test:
    Register -> Activate -> Login -> Access /users/me/ -> Refresh -> Logout -> Refresh fails.
    Verifies audit logs created at each stage.
    """
    def test_complete_auth_journey(self):
        client = APIClient()
        mail.outbox.clear()

        # Step 1: Customer Self-Registration
        reg_payload = {
            'email': 'journey_user@logiflows.test',
            'password': 'JourneySecurePass2026!',
            'confirm_password': 'JourneySecurePass2026!',
            'first_name': 'Journey',
            'last_name': 'Tester',
        }
        reg_res = client.post(reverse('auth-register'), reg_payload, format='json')
        assert reg_res.status_code == status.HTTP_201_CREATED

        # Verify inactive user in DB and activation email
        user = User.objects.get(email='journey_user@logiflows.test')
        assert not user.is_active
        assert user.role == UserRole.CUSTOMER
        assert len(mail.outbox) == 1
        activation_email = mail.outbox[0]
        assert 'Activate Your LogiFlows Account' in activation_email.subject
        raw_activation_token = activation_email.body.split('token=')[1].split('\n')[0].strip()

        # Step 2: Account Activation via link token
        act_res = client.post(reverse('auth-activate'), {'token': raw_activation_token}, format='json')
        assert act_res.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.is_active

        # Step 3: User Login
        login_res = client.post(
            reverse('auth-login'),
            {'email': 'journey_user@logiflows.test', 'password': 'JourneySecurePass2026!'},
            format='json',
        )
        assert login_res.status_code == status.HTTP_200_OK
        access_token_1 = login_res.data['access']
        assert 'refresh_token' in login_res.cookies
        refresh_token_1 = login_res.cookies['refresh_token'].value

        # Step 4: Access /api/v1/users/me/ with access token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token_1}')
        me_res = client.get(reverse('users-me'))
        assert me_res.status_code == status.HTTP_200_OK
        assert me_res.data['email'] == 'journey_user@logiflows.test'
        assert me_res.data['full_name'] == 'Journey Tester'

        # Step 5: Silent Refresh (rotating refresh token in cookie)
        client.credentials()  # Clear auth header to verify cookie-only refresh
        refresh_res = client.post(reverse('auth-refresh'), format='json')
        assert refresh_res.status_code == status.HTTP_200_OK
        access_token_2 = refresh_res.data['access']
        refresh_token_2 = refresh_res.cookies['refresh_token'].value
        assert access_token_2 != access_token_1
        assert refresh_token_2 != refresh_token_1

        # Step 6: User Logout
        logout_res = client.post(reverse('auth-logout'), format='json')
        assert logout_res.status_code == status.HTTP_200_OK
        assert logout_res.cookies['refresh_token'].value == ''

        # Step 7: Attempt to Refresh with revoked token fails
        client.cookies['refresh_token'] = refresh_token_2
        failed_refresh = client.post(reverse('auth-refresh'), format='json')
        assert failed_refresh.status_code == status.HTTP_400_BAD_REQUEST
        assert failed_refresh.data['error']['code'] == 'TOKEN_EXPIRED'

        # Verify Audit Log Trail
        actions = list(AuditLog.objects.filter(actor=user).order_by('created_at').values_list('action', flat=True))
        assert 'AUTH_REGISTER' in actions
        assert 'AUTH_ACTIVATED' in actions
        assert 'AUTH_LOGIN_SUCCESS' in actions
        assert 'AUTH_TOKEN_REFRESH' in actions
