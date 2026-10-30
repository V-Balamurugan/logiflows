"""
Common baseline views for LogiFlows API: Health probes, readiness checks, and platform info.
"""
from datetime import datetime, timezone
import time
from django.db import connection
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiResponse


class HealthCheckView(APIView):
    """
    General Liveness and Health Check Endpoint.
    Returns the operational status of the LogiFlows API and attached dependencies.
    """
    permission_classes = []
    authentication_classes = []

    @extend_schema(
        summary="Application Liveness & Health Check",
        description="Returns API service health, environment details, and component status.",
        responses={
            200: OpenApiResponse(description="Service is healthy or degraded"),
            503: OpenApiResponse(description="Service is unhealthy"),
        }
    )
    def get(self, request, *args, **kwargs):
        db_status = "healthy"
        db_details = {
            "connected": False,
            "engine": settings.DATABASES['default']['ENGINE'].split('.')[-1],
            "latency_ms": None,
            "error": None
        }

        start_time = time.perf_counter()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                row = cursor.fetchone()
                latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
                if row and row[0] == 1:
                    db_details["connected"] = True
                    db_details["latency_ms"] = latency_ms
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
            "version": "1.0.0-phase-00",
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


class ReadinessCheckView(APIView):
    """
    Database & Infrastructure Readiness Probe Endpoint.
    Specifically checks if PostgreSQL is ready to accept queries.
    Used for Docker Compose condition: service_healthy and Kubernetes readiness probes.
    """
    permission_classes = []
    authentication_classes = []

    @extend_schema(
        summary="Database Readiness Probe",
        description="Performs an active database query to ensure PostgreSQL readiness.",
        responses={
            200: OpenApiResponse(description="Database is ready to accept transactions"),
            503: OpenApiResponse(description="Database connection failed"),
        }
    )
    def get(self, request, *args, **kwargs):
        start_time = time.perf_counter()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                row = cursor.fetchone()
                latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
                if row and row[0] == 1:
                    return Response({
                        "ready": True,
                        "status": "ready",
                        "database": {
                            "connected": True,
                            "latency_ms": latency_ms,
                            "engine": settings.DATABASES['default']['ENGINE'].split('.')[-1],
                        },
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({
                "ready": False,
                "status": "not_ready",
                "database": {
                    "connected": False,
                    "error": str(exc),
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response({
            "ready": False,
            "status": "not_ready",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class PlatformInfoView(APIView):
    """
    Platform capability and tenant configuration baseline.
    """
    permission_classes = []
    authentication_classes = []

    @extend_schema(
        summary="Platform Information & Architecture Baseline",
        description="Returns platform metadata, planned modules, and active architectural capabilities.",
        responses={200: OpenApiResponse(description="Platform metadata")}
    )
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
                "planned_modules": [
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
