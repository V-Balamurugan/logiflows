from django.urls import path
from apps.accounts.views import (
    RegisterView,
    ActivateView,
    LoginView,
    RefreshTokenView,
    LogoutView,
    PasswordChangeView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    UserMeView,
    UserProfileView,
)

auth_patterns = [
    # Canonical auth routes
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/activate/', ActivateView.as_view(), name='auth-activate'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/password/change/', PasswordChangeView.as_view(), name='auth-password-change'),
    path('auth/password/reset/request/', PasswordResetRequestView.as_view(), name='auth-password-reset-request'),
    path('auth/password/reset/confirm/', PasswordResetConfirmView.as_view(), name='auth-password-reset-confirm'),

    # Direct convenience aliases (/api/v1/login/ and /api/v1/register/)
    path('login/', LoginView.as_view(), name='login-direct'),
    path('register/', RegisterView.as_view(), name='register-direct'),
]

user_patterns = [
    path('users/me/', UserMeView.as_view(), name='users-me'),
    path('users/me/profile/', UserProfileView.as_view(), name='users-me-profile'),
]

urlpatterns = auth_patterns + user_patterns
