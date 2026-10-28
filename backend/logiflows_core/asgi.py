"""
ASGI config for LogiFlows Core project.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'logiflows_core.settings')

application = get_asgi_application()
