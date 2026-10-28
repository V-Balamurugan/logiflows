"""
Common URLs: Health check and platform baseline metadata.
"""
from django.urls import path
from apps.common.views import HealthCheckView, PlatformInfoView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('platform-info/', PlatformInfoView.as_view(), name='platform-info'),
]
