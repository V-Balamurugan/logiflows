"""
OpenAPI Schema and Swagger UI endpoint tests.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status


class OpenAPIDocumentationTests(TestCase):
    """Test OpenAPI and Swagger UI endpoint availability."""

    def setUp(self):
        self.client = APIClient()

    def test_openapi_schema_endpoint(self):
        url = reverse('schema')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Schema is either json or yaml format
        self.assertTrue(len(response.content) > 0)

    def test_swagger_ui_endpoint(self):
        url = reverse('swagger-ui')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(b'swagger-ui', response.content.lower())

    def test_redoc_endpoint(self):
        url = reverse('redoc')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(b'redoc', response.content.lower())
