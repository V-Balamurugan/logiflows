import pytest
from io import StringIO
from django.core.management import call_command, CommandError
from apps.accounts.models import User, UserRole, AuditLog


@pytest.mark.django_db
class TestManagementCommands:
    def test_createplatformadmin_success(self):
        out = StringIO()
        call_command(
            'createplatformadmin',
            email='cli_admin@logiflows.test',
            password='AdminSuperPassword2026!',
            first_name='Root',
            last_name='Admin',
            stdout=out,
        )

        output = out.getvalue()
        assert 'Successfully created PLATFORM_ADMIN' in output

        user = User.objects.get(email='cli_admin@logiflows.test')
        assert user.role == UserRole.PLATFORM_ADMIN
        assert user.is_staff
        assert user.is_superuser
        assert user.is_active
        assert user.check_password('AdminSuperPassword2026!')
        assert hasattr(user, 'profile')

        # AuditLog entry created
        log = AuditLog.objects.filter(actor=user, action='PLATFORM_ADMIN_SEEDED').first()
        assert log is not None
        assert log.metadata['source'] == 'management_command'

    def test_createplatformadmin_duplicate_email_fails(self):
        User.objects.create_user(email='existing@logiflows.test', password='Password123!')
        out = StringIO()
        with pytest.raises(CommandError, match='already exists'):
            call_command(
                'createplatformadmin',
                email='existing@logiflows.test',
                password='AdminSuperPassword2026!',
                stdout=out,
            )

    def test_createplatformadmin_weak_password_fails(self):
        out = StringIO()
        with pytest.raises(CommandError, match='Password policy error'):
            call_command(
                'createplatformadmin',
                email='weakadmin@logiflows.test',
                password='123',
                stdout=out,
            )

    def test_seedsampleusers_creates_all_roles(self):
        out = StringIO()
        call_command('seedsampleusers', stdout=out)
        output = out.getvalue()

        assert 'Finished seeding sample users: 6 created, 0 preserved' in output

        expected_roles = {
            'alex.mercer@logiflows.admin': (UserRole.PLATFORM_ADMIN, True, True),
            'sarah.jenkins@swiftpost.com': (UserRole.ORGANIZATION_OWNER, False, False),
            'marcus.vance@swiftpost.com': (UserRole.ORGANIZATION_ADMIN, False, False),
            'elena.rostova@swiftpost.com': (UserRole.BRANCH_MANAGER, False, False),
            'dave.miller@swiftpost.com': (UserRole.EMPLOYEE, False, False),
            'emma.watson@apexsupplies.com': (UserRole.CUSTOMER, False, False),
        }

        for email, (role, is_staff, is_superuser) in expected_roles.items():
            user = User.objects.get(email=email)
            assert user.role == role
            assert user.is_staff == is_staff
            assert user.is_superuser == is_superuser
            assert user.is_active is True
            assert user.check_password('LogiFlowsDev2026!')
            assert hasattr(user, 'profile')
            assert user.profile.phone.startswith('+1-555-010-')
            assert bool(user.profile.avatar_url)
            assert bool(user.profile.bio)

        logs = AuditLog.objects.filter(action='SAMPLE_USER_SEEDED')
        assert logs.count() == 6

    def test_seedsampleusers_idempotency_preserves_without_modification(self):
        call_command('seedsampleusers')
        out = StringIO()
        call_command('seedsampleusers', stdout=out)
        output = out.getvalue()
        assert 'Finished seeding sample users: 0 created, 6 preserved' in output
        assert User.objects.count() == 6

    def test_seedsampleusers_never_modifies_existing_users(self):
        """Gate Item A3: Existing users must never have their roles, flags, or passwords altered."""
        custom_password = 'ExistingCustomPassword123!'
        existing_user = User.objects.create_user(
            email='alex.mercer@logiflows.admin',
            password=custom_password,
            role=UserRole.CUSTOMER,
            is_staff=False,
            is_superuser=False,
            is_active=True,
        )

        out = StringIO()
        call_command('seedsampleusers', stdout=out)
        existing_user.refresh_from_db()

        # Invariant checks: role, flags, password remain completely untouched
        assert existing_user.role == UserRole.CUSTOMER
        assert existing_user.is_staff is False
        assert existing_user.is_superuser is False
        assert existing_user.check_password(custom_password) is True

    def test_seedsampleusers_environment_guard_blocks_production(self, settings):
        """Gate Item A3: seedsampleusers must raise CommandError in production environment."""
        settings.ENVIRONMENT = 'production'
        settings.DEBUG = False

        with pytest.raises(CommandError, match='Refusing to execute.*production'):
            call_command('seedsampleusers')
