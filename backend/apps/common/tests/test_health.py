"""
Unit and integration tests for backend health checks and platform information.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

class HealthCheckTests(TestCase):
    """Verify backend health endpoints execute and validate database connectivity."""

    def setUp(self):
        self.client = APIClient()

    def test_health_check_returns_200_and_valid_envelope(self):
        url = reverse('health-check')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Verify structure
        self.assertIn('status', data)
        self.assertIn('service', data)
        self.assertIn('version', data)
        self.assertIn('timestamp', data)
        self.assertIn('components', data)
        
        # Verify database component check
        self.assertIn('database', data['components'])
        self.assertTrue(data['components']['database']['connected'])
        self.assertIsNotNone(data['components']['database']['latency_ms'])
        self.assertIsNone(data['components']['database']['error'])
        
        # Verify API component check
        self.assertEqual(data['components']['api']['status'], 'healthy')

    def test_platform_info_endpoint(self):
        url = reverse('platform-info')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['platform'], 'LogiFlows B2B Logistics & Supply Chain Platform')
        self.assertIn('architecture', data)
        self.assertIn('SUPER_ADMIN', data['architecture']['roles'])
        self.assertIn('DISPATCHER', data['architecture']['roles'])
