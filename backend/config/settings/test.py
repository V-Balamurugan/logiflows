"""
Test settings for LogiFlows backend test suites.
"""
from .base import *

DEBUG = False
ENVIRONMENT = 'test'

# Faster password hasher for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Use in-memory SQLite for unit tests unless USE_POSTGRES_TEST is explicitly enabled
if os.getenv('USE_POSTGRES_TEST', 'false').lower() not in ('true', '1', 'yes'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }

# Disable verbose logging in tests
LOGGING['root']['handlers'] = []
LOGGING['loggers']['django']['handlers'] = []
LOGGING['loggers']['apps']['handlers'] = []
