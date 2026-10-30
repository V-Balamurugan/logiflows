"""
Health and readiness endpoint tests for LogiFlows API.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch


class HealthAndReadinessTests(TestCase):
    """Test health and readiness probes."""

    def setUp(self):
        self.client = APIClient()

    def test_health_check_endpoint(self):
        url = reverse('health-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertIn('status', data)
        self.assertIn('service', data)
        self.assertIn('version', data)
        self.assertIn('environment', data)
        self.assertIn('timestamp', data)
        self.assertIn('components', data)
        self.assertIn('database', data['components'])
        self.assertIn('api', data['components'])

    def test_readiness_check_endpoint_success(self):
        url = reverse('readiness-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertTrue(data.get('ready'))
        self.assertEqual(data.get('status'), 'ready')
        self.assertTrue(data['database']['connected'])

    def test_readiness_check_database_failure(self):
        url = reverse('readiness-check')
        with patch('django.db.connection.cursor') as mock_cursor:
            mock_cursor.side_effect = Exception("Simulated DB connection failure")
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
            data = response.json()
            self.assertFalse(data.get('ready'))
            self.assertEqual(data.get('status'), 'not_ready')
            self.assertFalse(data['database']['connected'])

    def test_invalid_endpoint_returns_standard_error(self):
        response = self.client.get('/api/v1/non-existent-endpoint/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
