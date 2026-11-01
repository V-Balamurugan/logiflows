import logging
from typing import Optional, Tuple
from rest_framework.request import Request
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication, AuthUser, Token
from rest_framework_simplejwt.exceptions import InvalidToken
from drf_spectacular.extensions import OpenApiAuthenticationExtension

logger = logging.getLogger('apps.accounts.auth')


class LogiFlowsJWTAuthentication(JWTAuthentication):
    """
    Standardized, RFC 6750-compliant JWT Authentication backend for LogiFlows.
    Standardizes strictly on 'Bearer <token>' authorization header format.

    Developer Ergonomics & Resilience:
    1. Normalizes accidental duplicate 'Bearer Bearer <token>' prefixes from copy-paste
       events in Swagger UI / OpenAPI explorers.
    2. Allows raw JWT strings ('eyJ...') sent directly in the Authorization header.
    3. Graceful handling on AllowAny (public) endpoints: if a client passes an invalid or expired
       token to an AllowAny endpoint (e.g. Swagger persistAuthorization), degrades to AnonymousUser
       so public endpoints (like /health/, /login/, /register/, /activate/) always succeed.
    """

    def authenticate(self, request: Request) -> Optional[Tuple[AuthUser, Token]]:
        try:
            return super().authenticate(request)
        except (InvalidToken, AuthenticationFailed) as exc:
            # If the view allows unauthenticated access (AllowAny), do not crash public endpoints with 401
            if self._is_view_allow_any(request):
                logger.debug(f'Gracefully ignoring invalid token on AllowAny endpoint: {exc}')
                return None
            raise

    def _is_view_allow_any(self, request: Request) -> bool:
        """Inspect the active view permission classes to check if AllowAny is specified."""
        view = getattr(request, 'parser_context', {}).get('view') if hasattr(request, 'parser_context') else None
        if view and hasattr(view, 'permission_classes'):
            for perm in view.permission_classes:
                if perm == AllowAny or (isinstance(perm, type) and issubclass(perm, AllowAny)):
                    return True
        return False

    def get_raw_token(self, header: bytes) -> Optional[bytes]:
        """
        Extract raw token standardizing on RFC 6750 'Bearer <token>'.
        """
        parts = header.split()

        if len(parts) == 0:
            return None

        # Clean accidental duplicate 'Bearer Bearer' prefixes from copy-paste in UI
        while len(parts) > 1 and parts[0].lower() == b'bearer' and parts[1].lower() == b'bearer':
            parts.pop(0)

        # Standard RFC 6750: 'Bearer <token>'
        if len(parts) == 2 and parts[0].lower() == b'bearer':
            return parts[1]

        # Raw JWT token if pasted directly without prefix
        if len(parts) == 1 and parts[0].startswith(b'ey'):
            return parts[0]

        return super().get_raw_token(header)


class LogiFlowsJWTScheme(OpenApiAuthenticationExtension):
    """
    OpenAPI 3 / Swagger scheme for LogiFlowsJWTAuthentication.
    Registers 'jwtAuth' under securitySchemes as Bearer JWT.
    """
    target_class = 'apps.accounts.authentication.LogiFlowsJWTAuthentication'
    name = 'jwtAuth'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
            'description': (
                'Standard RFC 6750 Bearer JWT token received from `POST /api/v1/auth/login/`.\n\n'
                'Format: `Bearer <your_token>`'
            ),
        }
