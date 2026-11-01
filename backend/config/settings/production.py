"""
Production settings for LogiFlows.
Enforces SSL, secure cookies, strict security headers, and fail-fast environment validation.
"""
import os
from django.core.exceptions import ImproperlyConfigured
from .base import *

DEBUG = False
ENVIRONMENT = 'production'

# Fail-Fast Validation for Production Environment Variables (Gate Item A1)
INSECURE_DEV_SECRET_KEY = 'django-insecure-dev-key-logiflows-platform-2026'
INSECURE_DEV_DB_PASSWORD = 'logiflows_dev_password_2026'

prod_secret_key = os.getenv('DJANGO_SECRET_KEY')
if not prod_secret_key or prod_secret_key == INSECURE_DEV_SECRET_KEY:
    raise ImproperlyConfigured(
        "Missing or insecure required environment variable 'DJANGO_SECRET_KEY'. "
        "Production requires an explicit, unpredictable secret key."
    )
SECRET_KEY = prod_secret_key

prod_db_name = os.getenv('POSTGRES_DB')
if not prod_db_name:
    raise ImproperlyConfigured(
        "Missing required environment variable 'POSTGRES_DB' for production database."
    )

prod_db_user = os.getenv('POSTGRES_USER')
if not prod_db_user:
    raise ImproperlyConfigured(
        "Missing required environment variable 'POSTGRES_USER' for production database."
    )

prod_db_password = os.getenv('POSTGRES_PASSWORD')
if not prod_db_password or prod_db_password == INSECURE_DEV_DB_PASSWORD:
    raise ImproperlyConfigured(
        "Missing or insecure required environment variable 'POSTGRES_PASSWORD'. "
        "Production requires an explicit database password distinct from development defaults."
    )

DATABASES['default']['NAME'] = prod_db_name
DATABASES['default']['USER'] = prod_db_user
DATABASES['default']['PASSWORD'] = prod_db_password

# Security Headers & SSL Hardening
SECURE_SSL_REDIRECT = os.getenv('DJANGO_SECURE_SSL_REDIRECT', 'True') == 'True'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HTTP Strict Transport Security (HSTS)
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Production OpenAPI Documentation Gating (Gate Item A2)
# Strip all local development credentials, persona tables, and dev-only instructions
SPECTACULAR_SETTINGS = {
    **SPECTACULAR_SETTINGS,
    'DESCRIPTION': (
        '# LogiFlows — Enterprise B2B Postal & Logistics Platform API\n\n'
        'Welcome to the official REST API for **LogiFlows**, an AI-powered smart postal and B2B delivery management system.\n\n'
        '---\n\n'
        '### Authentication\n\n'
        'All protected endpoints require an authenticated JWT Bearer access token in the `Authorization` header:\n\n'
        '```http\n'
        'Authorization: Bearer <your_access_token>\n'
        '```\n\n'
        'To obtain a token, authenticate via `POST /api/v1/auth/login/` with your registered credentials.\n\n'
        '---\n\n'
        '### Standard Error Envelope\n\n'
        'All API error responses adhere to the standard envelope schema:\n'
        '```json\n'
        '{\n'
        '  "error": {\n'
        '    "code": "ERROR_CODE",\n'
        '    "message": "Human-readable explanation of the condition.",\n'
        '    "details": null\n'
        '  }\n'
        '}\n'
        '```\n'
    ),
}

# Production Logging
LOGGING['root']['level'] = 'WARNING'
LOGGING['loggers']['django']['level'] = 'WARNING'
LOGGING['loggers']['apps']['level'] = 'INFO'
