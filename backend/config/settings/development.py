"""
Development settings for LogiFlows.
"""
from .base import *

DEBUG = True

# Explicitly ensure console logging level is DEBUG
LOGGING['loggers']['apps']['level'] = 'DEBUG'

# Higher throttle headroom for local development and live E2E testing
LOGIN_THROTTLE_RATE = os.getenv('LOGIN_THROTTLE_RATE', '120/min')
REGISTER_THROTTLE_RATE = os.getenv('REGISTER_THROTTLE_RATE', '120/min')
PASSWORD_RESET_THROTTLE_RATE = os.getenv('PASSWORD_RESET_THROTTLE_RATE', '120/min')
