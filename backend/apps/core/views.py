import time
import logging
from django.conf import settings
from django.db import connection
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample

logger = logging.getLogger('apps.core')


class HealthCheckView(APIView):
    """
    Public Health & Readiness probe.
    Executes a SELECT 1; database query to verify PostgreSQL connectivity.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['03 - System Health & Diagnostics'],
        summary='System & Database Health Check Probe',
        description=(
            'Validates backend application health and PostgreSQL database readiness.\n\n'
            'Executes a live `SELECT 1;` probe query against the database cluster and returns '
            'query latency in milliseconds alongside server environment metadata.'
        ),
        responses={
            200: OpenApiResponse(
                description='Backend and PostgreSQL database are fully operational.',
                examples=[
                    OpenApiExample(
                        name='Healthy System Response',
                        value={
                            'status': 'healthy',
                            'db': 'ok',
                            'latency_ms': 1.45,
                            'environment': 'development',
                            'version': '1.0.0-phase-01',
                            'timestamp': '2026-10-31T19:00:00.000000Z',
                        },
                        response_only=True,
                    ),
                ],
            ),
            503: OpenApiResponse(
                description='PostgreSQL database connection failed.',
                examples=[
                    OpenApiExample(
                        name='Database Down Response',
                        value={
                            'error': {
                                'code': 'DATABASE_UNAVAILABLE',
                                'message': 'Database readiness probe failed.',
                                'details': 'could not connect to server: Connection refused',
                            }
                        },
                        response_only=True,
                    ),
                ],
            ),
        },
    )
    def get(self, request, *args, **kwargs):
        start_time = time.perf_counter()
        db_status = 'ok'
        db_error = None
        latency_ms = 0.0

        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1;')
                cursor.fetchone()
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        except Exception as exc:
            db_status = 'unavailable'
            db_error = str(exc)
            logger.error(f'Health check database failure: {exc}')

        if db_status != 'ok':
            return Response(
                {
                    'error': {
                        'code': 'DATABASE_UNAVAILABLE',
                        'message': 'Database readiness probe failed.',
                        'details': db_error,
                    }
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                'status': 'healthy',
                'db': 'ok',
                'latency_ms': latency_ms,
                'environment': getattr(settings, 'ENVIRONMENT', 'development'),
                'version': '1.0.0-phase-01',
                'timestamp': timezone.now().isoformat(),
            },
            status=status.HTTP_200_OK,
        )
