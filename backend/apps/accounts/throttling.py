from django.conf import settings
from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Limits authentication attempts by client IP to prevent brute-force attacks.
    Default: 5 requests per minute in production, configurable in development.
    Bypassed in automated tests to prevent cross-test cache bleed.
    """
    scope = 'login'

    def get_rate(self):
        if getattr(settings, 'ENVIRONMENT', '') == 'test' or getattr(settings, 'DISABLE_THROTTLING', False):
            return None
        return getattr(settings, 'LOGIN_THROTTLE_RATE', '5/min')


class PasswordResetRateThrottle(AnonRateThrottle):
    """
    Limits password reset requests by client IP.
    Default: 5 requests per hour.
    """
    scope = 'password_reset'

    def get_rate(self):
        if getattr(settings, 'ENVIRONMENT', '') == 'test' or getattr(settings, 'DISABLE_THROTTLING', False):
            return None
        return getattr(settings, 'PASSWORD_RESET_THROTTLE_RATE', '5/hour')


class RegisterRateThrottle(AnonRateThrottle):
    """
    Limits public customer registration by client IP.
    Default: 10 requests per hour.
    """
    scope = 'register'

    def get_rate(self):
        if getattr(settings, 'ENVIRONMENT', '') == 'test' or getattr(settings, 'DISABLE_THROTTLING', False):
            return None
        return getattr(settings, 'REGISTER_THROTTLE_RATE', '10/hour')
