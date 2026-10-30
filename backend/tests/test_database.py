"""
Database connectivity, configuration, abstract base models, and accounts.User model tests.
"""
import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import connection
from apps.accounts.models import User, UserRole
from apps.core.models import UUIDModel, TimeStampedModel, BaseModel


class DatabaseAndUserModelTests(TestCase):
    """Verify database connection and Phase 0 accounts.User custom model."""

    def test_database_connection(self):
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            result = cursor.fetchone()
            self.assertEqual(result[0], 1)

    def test_custom_user_model_is_configured(self):
        user_model = get_user_model()
        self.assertEqual(user_model, User)
        self.assertEqual(user_model.USERNAME_FIELD, 'email')
        self.assertEqual(user_model._meta.app_label, 'accounts')

    def test_create_user_with_uuid_and_email_normalization(self):
        user = User.objects.create_user(
            email='Dispatch.Admin@LOGIFLOWS.COM',
            password='SecurePassword2026!',
            first_name='John',
            last_name='Doe'
        )
        self.assertIsInstance(user.id, uuid.UUID)
        self.assertEqual(user.email, 'dispatch.admin@logiflows.com')
        self.assertEqual(user.role, UserRole.CUSTOMER)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password('SecurePassword2026!'))
        self.assertEqual(user.full_name, 'John Doe')
        self.assertIn('dispatch.admin@logiflows.com', str(user))

    def test_create_user_without_password(self):
        user = User.objects.create_user(email='nopass@logiflows.com')
        self.assertFalse(user.has_usable_password())

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            email='superadmin@logiflows.com',
            password='SuperAdminPass2026!'
        )
        self.assertIsInstance(admin.id, uuid.UUID)
        self.assertEqual(admin.role, UserRole.PLATFORM_ADMIN)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_active)

    def test_create_superuser_missing_is_staff_raises_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email='badstaff@logiflows.com',
                password='password',
                is_staff=False
            )

    def test_create_superuser_missing_is_superuser_raises_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email='badadmin@logiflows.com',
                password='password',
                is_superuser=False
            )

    def test_create_user_without_email_raises_value_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password='password')

    def test_user_roles_definition(self):
        expected_roles = {
            'PLATFORM_ADMIN',
            'ORGANIZATION_OWNER',
            'ORGANIZATION_ADMIN',
            'BRANCH_MANAGER',
            'EMPLOYEE',
            'CUSTOMER',
        }
        actual_roles = {choice[0] for choice in UserRole.choices}
        self.assertEqual(expected_roles, actual_roles)

    def test_core_abstract_models_exist(self):
        self.assertTrue(UUIDModel._meta.abstract)
        self.assertTrue(TimeStampedModel._meta.abstract)
        self.assertTrue(BaseModel._meta.abstract)

    def test_django_system_checks(self):
        # Call Django system check to ensure no configuration or model errors
        call_command('check')
