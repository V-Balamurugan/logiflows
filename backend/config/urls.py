"""
Root URL Configuration for LogiFlows.
Defines admin, API v1 namespace, and OpenAPI / Swagger documentation endpoints.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from apps.accounts.views import LoginView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def custom_page_not_found(request, exception=None):
    """Global JSON 404 handler matching standard error envelope."""
    return JsonResponse({
        "error": {
            "code": "NOT_FOUND",
            "message": f"Endpoint '{request.path}' was not found on this server.",
            "details": None,
        }
    }, status=404)


def custom_server_error(request):
    """Global JSON 500 handler matching standard error envelope."""
    return JsonResponse({
        "error": {
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected internal server error occurred.",
            "details": None,
        }
    }, status=500)


handler404 = custom_page_not_found
handler500 = custom_server_error

urlpatterns = [
    path('admin/', admin.site.urls),

    # Core API namespace /api/v1/
    path('api/v1/', include('apps.core.urls')),
    path('api/v1/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.organizations.urls')),
    path('api/v1/', include('apps.branches.urls')),
    path('api/v1/', include('apps.employees.urls')),

    # Direct Convenience Login Alias
    path('login/', LoginView.as_view(), name='root-login'),

    # OpenAPI Schema & Interactive Documentation
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
