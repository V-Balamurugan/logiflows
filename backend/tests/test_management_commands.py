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
