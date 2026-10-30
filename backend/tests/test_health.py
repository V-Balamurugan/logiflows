"""
Health check, pagination, and error envelope endpoint tests for LogiFlows API.
"""
from django.test import TestCase, RequestFactory
from django.urls import reverse
from django.core.paginator import Paginator
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.exceptions import ValidationError, PermissionDenied
from unittest.mock import patch
from apps.core.pagination import StandardResultsSetPagination
from apps.core.exceptions import custom_exception_handler


class HealthAndErrorEnvelopeTests(TestCase):
    """Test health check and standard error handling."""

    def setUp(self):
        self.client = APIClient()
        self.factory = RequestFactory()

    def test_health_check_returns_200_and_db_ok(self):
        url = reverse('health-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data.get('status'), 'healthy')
        self.assertEqual(data.get('db'), 'ok')
        self.assertIn('latency_ms', data)
        self.assertIn('environment', data)
        self.assertIn('version', data)
        self.assertIn('timestamp', data)

    def test_health_check_database_failure_returns_503_and_error_envelope(self):
        url = reverse('health-check')
        with patch('django.db.connection.cursor') as mock_cursor:
            mock_cursor.side_effect = Exception("Simulated DB connection failure")
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
            data = response.json()

            self.assertIn('error', data)
            self.assertEqual(data['error']['code'], 'DATABASE_UNAVAILABLE')
            self.assertEqual(data['error']['message'], 'Database readiness probe failed.')
            self.assertIn('Simulated DB connection failure', str(data['error']['details']))

    def test_invalid_endpoint_returns_standard_error_envelope(self):
        response = self.client.get('/api/v1/non-existent-endpoint/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        data = response.json()

        self.assertIn('error', data)
        self.assertEqual(data['error']['code'], 'NOT_FOUND')
        self.assertIn('was not found', data['error']['message'])

    def test_custom_exception_handler_drf_validation_error(self):
        exc = ValidationError({'email': ['This field is required.']})
        context = {'view': None}
        response = custom_exception_handler(exc, context)
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'VALIDATION_ERROR')
        self.assertIn('email', response.data['error']['details'])

    def test_custom_exception_handler_drf_permission_denied(self):
        exc = PermissionDenied('Access denied.')
        context = {'view': None}
        response = custom_exception_handler(exc, context)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error']['code'], 'PERMISSION_DENIED')

    def test_custom_exception_handler_unhandled_exception(self):
        exc = RuntimeError('Unexpected failure')
        context = {'view': None}
        response = custom_exception_handler(exc, context)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data['error']['code'], 'INTERNAL_SERVER_ERROR')

    def test_pagination_defaults_and_response_structure(self):
        pagination = StandardResultsSetPagination()
        self.assertEqual(pagination.page_size, 20)
        self.assertEqual(pagination.page_size_query_param, 'page_size')
        self.assertEqual(pagination.max_page_size, 100)

        # Test paginated response structure
        request = self.factory.get('/api/v1/items/?page=1&page_size=5')
        paginator = Paginator(list(range(10)), 5)
        page = paginator.page(1)
        pagination.page = page
        pagination.request = request
        response = pagination.get_paginated_response(['item1', 'item2'])
        self.assertEqual(response.data['count'], 10)
        self.assertEqual(response.data['total_pages'], 2)
        self.assertEqual(response.data['page'], 1)
        self.assertEqual(response.data['results'], ['item1', 'item2'])
