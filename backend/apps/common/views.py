"""
Common and baseline health check views for LogiFlows.
"""
from datetime import datetime, timezone
from django.db import connection
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class HealthCheckView(APIView):
    """
    Health check endpoint for Docker Compose, Kubernetes, and frontend status widgets.
    Performs real database query verification.
    """
    permission_classes = []
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        db_status = "healthy"
        db_details = {
            "connected": False,
            "engine": settings.DATABASES['default']['ENGINE'].split('.')[-1],
            "latency_ms": None,
            "error": None
        }

        start_time = datetime.now(timezone.utc)
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                row = cursor.fetchone()
                if row and row[0] == 1:
                    db_details["connected"] = True
                    latency = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
                    db_details["latency_ms"] = round(latency, 2)
                else:
                    db_status = "degraded"
                    db_details["error"] = "Unexpected database query response"
        except Exception as exc:
            db_status = "unhealthy"
            db_details["connected"] = False
            db_details["error"] = str(exc)

        http_status = status.HTTP_200_OK if db_status in ("healthy", "degraded") else status.HTTP_503_SERVICE_UNAVAILABLE

        response_payload = {
            "status": db_status,
            "service": "LogiFlows B2B Service Platform API",
            "version": "0.1.0-phase-00",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "environment": "development" if settings.DEBUG else "production",
            "components": {
                "database": db_details,
                "api": {
                    "status": "healthy",
                    "framework": "Django REST Framework 3.15"
                }
            }
        }

        return Response(response_payload, status=http_status)


class PlatformInfoView(APIView):
    """
    Platform capability and tenant configuration baseline.
    """
    permission_classes = []
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        data = {
            "platform": "LogiFlows B2B Logistics & Supply Chain Platform",
            "phase": "Phase 00 - Foundation, Requirements & Docker Baseline",
            "status": "baseline_active",
            "architecture": {
                "multitenancy": "Shared-database with tenant-isolation (organization_id schema/row scoping)",
                "database": settings.DATABASES['default']['ENGINE'].split('.')[-1],
                "roles": [
                    "SUPER_ADMIN",
                    "TENANT_ADMIN",
                    "LOGISTICS_MANAGER",
                    "DISPATCHER",
                    "DRIVER",
                    "AUDITOR_VIEWER"
                ],
                "core_modules": [
                    "Multi-Tenant Organization Management",
                    "Role-Based Access Control (RBAC)",
                    "Freight Booking & Waybill Dispatch",
                    "Carrier & Fleet Management",
                    "Real-Time Telematics & Milestone Tracking",
                    "Contract Invoicing & Billing"
                ]
            }
        }
        return Response(data, status=status.HTTP_200_OK)
