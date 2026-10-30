"""
Common API route endpoints: Health, Readiness, and Platform Baseline Info.
"""
from django.urls import path
from apps.common.views import HealthCheckView, ReadinessCheckView, PlatformInfoView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('readiness/', ReadinessCheckView.as_view(), name='readiness-check'),
    path('platform-info/', PlatformInfoView.as_view(), name='platform-info'),
]
