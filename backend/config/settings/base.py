"""
Base settings for LogiFlows B2B Logistics Management Platform.
Contains shared settings used across development, production, and testing.
"""
from pathlib import Path
from datetime import timedelta
import os
import socket
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env file at workspace root
load_dotenv(BASE_DIR.parent / '.env')
load_dotenv(BASE_DIR / '.env')

# Security Settings
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-dev-key-logiflows-platform-2026')
DEBUG = os.getenv('DJANGO_DEBUG', 'True') == 'True'
ENVIRONMENT = os.getenv('DJANGO_ENVIRONMENT', 'development')

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1,backend,web,frontend,0.0.0.0').split(',')
    if host.strip()
]

# Application Definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party libraries
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'drf_spectacular',

    # LogiFlows Core & Accounts Apps
    'apps.core.apps.CoreConfig',
    'apps.accounts.apps.AccountsConfig',
]

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Database Configuration
DB_NAME = os.getenv('POSTGRES_DB', 'logiflows_db')
DB_USER = os.getenv('POSTGRES_USER', 'logiflows_user')
DB_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'logiflows_dev_password_2026')
DB_HOST = os.getenv('POSTGRES_HOST', 'localhost')
DB_PORT = os.getenv('POSTGRES_PORT', '5432')

# Automatically resolve DB_HOST: if 'db' resolves via DNS (inside Docker network), use 'db'; else use 'localhost'
if DB_HOST in ('db', 'localhost', '127.0.0.1'):
    try:
        socket.gethostbyname('db')
        DB_HOST = 'db'
    except (socket.gaierror, OSError):
        DB_HOST = 'localhost'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
        'CONN_MAX_AGE': 60,
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static & Media Files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,http://localhost:5174'
    ).split(',')
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

# Django REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.accounts.authentication.LogiFlowsJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
}

# SimpleJWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# Cookie-based Authentication Settings (HttpOnly Refresh Token)
AUTH_COOKIE_NAME = os.getenv('AUTH_COOKIE_NAME', 'refresh_token')
AUTH_COOKIE_PATH = os.getenv('AUTH_COOKIE_PATH', '/api/v1/auth/')
AUTH_COOKIE_DOMAIN = os.getenv('AUTH_COOKIE_DOMAIN', None)
AUTH_COOKIE_SECURE = os.getenv('AUTH_COOKIE_SECURE', 'False' if DEBUG else 'True') == 'True'
AUTH_COOKIE_HTTPONLY = True
AUTH_COOKIE_SAMESITE = os.getenv('AUTH_COOKIE_SAMESITE', 'Lax')
AUTH_COOKIE_MAX_AGE = int(os.getenv('AUTH_COOKIE_MAX_AGE', 60 * 60 * 24 * 7))  # 7 days

# Email Delivery Configuration (Mailpit in local dev, SMTP in staging/prod)
EMAIL_BACKEND = os.getenv(
    'DJANGO_EMAIL_BACKEND',
    'django.core.mail.backends.smtp.EmailBackend'
    if os.getenv('EMAIL_HOST') or not DEBUG
    else 'django.core.mail.backends.console.EmailBackend'
)
EMAIL_HOST = os.getenv('EMAIL_HOST', 'localhost')
if EMAIL_HOST in ('mailpit', 'localhost', '127.0.0.1'):
    try:
        socket.gethostbyname('mailpit')
        EMAIL_HOST = 'mailpit'
    except (socket.gaierror, OSError):
        EMAIL_HOST = 'localhost'
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '1025'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'False') == 'True'
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'LogiFlows <noreply@logiflows.com>')

# Frontend Application Web URL (used in email links)
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# DRF Spectacular OpenAPI / Swagger UI Settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'LogiFlows Enterprise B2B Logistics & Postal Management API',
    'DESCRIPTION': (
        '# LogiFlows — Enterprise B2B Postal & Logistics Platform API\n\n'
        'Welcome to the interactive REST API documentation for **LogiFlows**, an AI-powered smart postal and B2B delivery management system.\n\n'
        '---\n\n'
        '### Quick Start Guide: How to Authenticate & Test in Swagger\n\n'
        '1. **Get an Access Token**:\n'
        '   - Navigate to the **`01 - Authentication & Session`** section below.\n'
        '   - Open **`POST /api/v1/auth/login/`** and click **Try it out**.\n'
        '   - Notice the pre-filled test credentials (`alex.mercer@logiflows.admin` / `LogiFlowsDev2026!`). You can also choose another persona from the **Examples** dropdown!\n'
        '   - Click **Execute**.\n'
        '   - In the `200 OK` response body below, copy the string value inside `"access"`.\n\n'
        '2. **Authorize Swagger**:\n'
        '   - Scroll to the top right of this page and click the green **Authorize** button.\n'
        '   - In the `Value` box, paste your token: `Bearer <your_token>` (or just `<your_token>`).\n'
        '   - Click **Authorize**, then click **Close**.\n\n'
        '3. **Test Any Protected Endpoint**:\n'
        '   - Open **`GET /api/v1/users/me/`** or **`GET /api/v1/users/me/profile/`** under **`02 - User Profile & Identity`**.\n'
        '   - Click **Try it out** and then **Execute**.\n'
        '   - You will receive a `200 OK` response with the authenticated user profile!\n\n'
        '---\n\n'
        '### Pre-Configured Test Personas Cheat-Sheet\n\n'
        'All six canonical roles are pre-seeded in the system with the default development password: **`LogiFlowsDev2026!`**\n\n'
        '| Role | Sample User | Email Address | Password | Permissions & Scope |\n'
        '| :--- | :--- | :--- | :--- | :--- |\n'
        '| **`PLATFORM_ADMIN`** | Alex Mercer | `alex.mercer@logiflows.admin` | `LogiFlowsDev2026!` | Superuser / Platform administrator. Global audit logs, system seed CLI. |\n'
        '| **`ORGANIZATION_OWNER`** | Sarah Jenkins | `sarah.jenkins@swiftpost.com` | `LogiFlowsDev2026!` | SwiftPost tenant owner. Billing, branch administration, fleet contracts. |\n'
        '| **`ORGANIZATION_ADMIN`** | Marcus Vance | `marcus.vance@swiftpost.com` | `LogiFlowsDev2026!` | Regional logistics director. Multi-hub sorting networks, branch assignment. |\n'
        '| **`BRANCH_MANAGER`** | Elena Rostova | `elena.rostova@swiftpost.com` | `LogiFlowsDev2026!` | Sorting facility head. Driver dispatching, custody verification, manifests. |\n'
        '| **`EMPLOYEE`** | Dave Miller | `dave.miller@swiftpost.com` | `LogiFlowsDev2026!` | Driver & sorting specialist. Barcode/QR scanning (ePOD), delivery run sheets. |\n'
        '| **`CUSTOMER`** | Emma Watson | `emma.watson@apexsupplies.com`| `LogiFlowsDev2026!` | Consignor / B2B client. Self-registered, parcel bookings, live tracking. |\n\n'
        '> Tip: To re-seed or reset these test personas at any time, run: `python backend/manage.py seedsampleusers`.\n\n'
        '---\n\n'
        '### Authentication Architecture & Token Lifetimes\n\n'
        '- **Access Token**: Short-lived JWT (**15 minutes**). Returned in JSON response body upon login or refresh.\n'
        '- **Refresh Token**: Long-lived rotating token (**7 days**). In standard web traffic, it is stored in a secure **`HttpOnly`** cookie (`refresh_token`).\n'
        '- **Swagger / API Client Support**: For API testing tools (Swagger UI, Postman, cURL) where cookies are not automatically set across requests, `POST /api/v1/auth/refresh/` and `POST /api/v1/auth/logout/` also accept `{ "refresh": "<token>" }` in the JSON request body.\n'
        '- **Brute-Force Protection**: 5 failed consecutive attempts trigger a **15-minute temporary database lockout**.\n\n'
        '---\n\n'
        '### Local Email Inbox (Mailpit)\n\n'
        'In local development, all outbound transactional emails (account activation links, password reset links) are routed to the **Mailpit Dev Mail Sink**:\n'
        '- **Mailpit Web UI**: [http://localhost:8025](http://localhost:8025)\n'
        '- Open this dashboard to view activation links and copy 64-character verification tokens.\n\n'
        '---\n\n'
        '### Standard Error Envelope\n\n'
        'All API errors return a uniform, machine-readable envelope:\n'
        '```json\n'
        '{\n'
        '  "error": {\n'
        '    "code": "ERROR_CODE",\n'
        '    "message": "Human readable summary of the issue.",\n'
        '    "details": {...}\n'
        '  }\n'
        '}\n'
        '```\n\n'
        '**Common Error Codes:**\n'
        '- `INVALID_CREDENTIALS` (401): Email or password is incorrect.\n'
        '- `ACCOUNT_INACTIVE` (403): Account requires email activation before login.\n'
        '- `TOKEN_EXPIRED` (400): Activation or reset token is invalid or expired.\n'
        '- `THROTTLED` (429): Rate limit or temporary lockout triggered.\n'
        '- `VALIDATION_ERROR` (400): Request fields failed schema validation rules.\n'
        '- `AUTHENTICATION_REQUIRED` (401): Missing or expired Bearer JWT access token.\n'
        '- `PERMISSION_DENIED` (403): Role lacks authorization to access this resource.\n'
    ),
    'VERSION': '1.0.0-phase-01',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': False,
        'filter': True,
        'defaultModelsExpandDepth': 2,
        'defaultModelExpandDepth': 2,
        'docExpansion': 'list',
        'tryItOutEnabled': True,
    },
    'TAGS': [
        {
            'name': '01 - Authentication & Session',
            'description': 'Public registration, email activation, JWT login/refresh/logout, password change, and password reset flows.',
        },
        {
            'name': '02 - User Profile & Identity',
            'description': 'View and update personal profile attributes, avatar URL, phone number, and account metadata.',
        },
        {
            'name': '03 - System Health & Diagnostics',
            'description': 'Infrastructure readiness probes, database query latency telemetry, and service health checks.',
        },
    ],
}

# Centralized Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} [{name}:{lineno}] {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}
