from django.conf import settings
from django.http import HttpRequest, HttpResponse
from typing import Optional


def set_refresh_cookie(response: HttpResponse, refresh_token: str) -> HttpResponse:
    """
    Set rotating JWT refresh token in an HttpOnly, Secure, SameSite cookie.
    Ensures frontend JavaScript cannot directly access or leak the refresh token.
    """
    cookie_name = getattr(settings, 'AUTH_COOKIE_NAME', 'refresh_token')
    cookie_path = getattr(settings, 'AUTH_COOKIE_PATH', '/api/v1/auth/')
    cookie_domain = getattr(settings, 'AUTH_COOKIE_DOMAIN', None)
    cookie_secure = getattr(settings, 'AUTH_COOKIE_SECURE', False)
    cookie_httponly = getattr(settings, 'AUTH_COOKIE_HTTPONLY', True)
    cookie_samesite = getattr(settings, 'AUTH_COOKIE_SAMESITE', 'Lax')
    cookie_max_age = getattr(settings, 'AUTH_COOKIE_MAX_AGE', 60 * 60 * 24 * 7)

    response.set_cookie(
        key=cookie_name,
        value=refresh_token,
        max_age=cookie_max_age,
        path=cookie_path,
        domain=cookie_domain,
        secure=cookie_secure,
        httponly=cookie_httponly,
        samesite=cookie_samesite,
    )
    return response


def clear_refresh_cookie(response: HttpResponse) -> HttpResponse:
    """
    Delete the refresh token cookie on logout or token invalidation.
    """
    cookie_name = getattr(settings, 'AUTH_COOKIE_NAME', 'refresh_token')
    cookie_path = getattr(settings, 'AUTH_COOKIE_PATH', '/api/v1/auth/')
    cookie_domain = getattr(settings, 'AUTH_COOKIE_DOMAIN', None)

    response.delete_cookie(
        key=cookie_name,
        path=cookie_path,
        domain=cookie_domain,
    )
    return response


def get_refresh_token_from_request(request: HttpRequest) -> Optional[str]:
    """
    Extract refresh token with priority given to HttpOnly cookie,
    with fallback to JSON request payload (if provided in API clients).
    """
    cookie_name = getattr(settings, 'AUTH_COOKIE_NAME', 'refresh_token')
    token_from_cookie = request.COOKIES.get(cookie_name)
    if token_from_cookie:
        return token_from_cookie

    if hasattr(request, 'data') and isinstance(request.data, dict):
        return request.data.get('refresh')

    return None
