"""
Development settings for LogiFlows.
"""
from .base import *

DEBUG = True

# Explicitly ensure console logging level is DEBUG
LOGGING['loggers']['apps']['level'] = 'DEBUG'
