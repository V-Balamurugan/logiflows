"""
Database connectivity, configuration, and custom User model tests.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import connection
from apps.users.models import User


class DatabaseAndUserModelTests(TestCase):
    """Verify database connection and Phase 0 custom User model."""

    def test_database_connection(self):
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            result = cursor.fetchone()
            self.assertEqual(result[0], 1)

    def test_custom_user_model_is_configured(self):
        user_model = get_user_model()
        self.assertEqual(user_model, User)
        self.assertEqual(user_model._meta.db_table, 'logiflows_users')

    def test_create_minimal_user(self):
        user = User.objects.create_user(
            username='testlogistics',
            email='test@logiflows.local',
            password='TestPassword2026!'
        )
        self.assertIsNotNone(user.pk)
        self.assertEqual(user.username, 'testlogistics')
        self.assertTrue(user.check_password('TestPassword2026!'))

    def test_django_system_checks(self):
        # Call Django system check to ensure no configuration or model errors
        call_command('check')
