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
    Robust, developer-friendly JWT Authentication backend for LogiFlows.
    Extends SimpleJWT to handle:
    1. Standard 'Bearer <token>', 'Token <token>', 'JWT <token>' prefixes.
    2. Stripping accidental duplicate prefixes like 'Bearer Bearer <token>' (common in Swagger UI).
    3. Direct raw JWT strings ('eyJ...') sent without a prefix.
    4. Custom 'X-Auth-Token: <token>' header.
    5. Graceful handling on AllowAny (public) endpoints: if a client passes an invalid or expired
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

    def get_header(self, request: Request) -> Optional[bytes]:
        header = super().get_header(request)
        if header is not None:
            return header

        # Fallback: Support X-Auth-Token header
        x_auth = request.META.get('HTTP_X_AUTH_TOKEN')
        if x_auth:
            if isinstance(x_auth, str):
                return f'Bearer {x_auth}'.encode()
            return x_auth
        return None

    def get_raw_token(self, header: bytes) -> Optional[bytes]:
        """
        Extract raw token handling multiple prefixes, raw tokens, and duplicate headers.
        """
        parts = header.split()

        if len(parts) == 0:
            return None

        # Clean accidental duplicate prefixes (e.g. 'Bearer Bearer eyJ...', 'Token Token eyJ...')
        known_prefixes = {b'bearer', b'token', b'jwt'}
        while len(parts) > 1 and parts[0].lower() in known_prefixes and parts[1].lower() in known_prefixes:
            parts.pop(0)

        # Standard prefixes: 'Bearer <token>', 'Token <token>', 'JWT <token>'
        if len(parts) == 2 and parts[0].lower() in known_prefixes:
            return parts[1]

        # Raw JWT token without prefix (JWT strings start with 'ey')
        if len(parts) == 1 and parts[0].startswith(b'ey'):
            return parts[0]

        return super().get_raw_token(header)


class LogiFlowsJWTScheme(OpenApiAuthenticationExtension):
    """
    OpenAPI 3 / Swagger scheme for LogiFlowsJWTAuthentication.
    Registers 'jwtAuth' under securitySchemes.
    """
    target_class = 'apps.accounts.authentication.LogiFlowsJWTAuthentication'
    name = 'jwtAuth'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
            'description': (
                'Paste the auth token received from `POST /api/v1/auth/login/` (or `POST /api/v1/login/`).\n\n'
                'Supports raw `<token>`, `Bearer <token>`, or `Token <token>`.'
            ),
        }
