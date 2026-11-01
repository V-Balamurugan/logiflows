from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from apps.accounts.models import User, UserProfile, UserRole
from apps.accounts.services.audit_service import log_audit_event


class Command(BaseCommand):
    help = 'Create the initial Platform Administrator (PLATFORM_ADMIN). Must be executed via CLI only.'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Administrator email address', required=False)
        parser.add_argument('--password', type=str, help='Administrator password', required=False)
        parser.add_argument('--first-name', type=str, default='Platform', help='Administrator first name')
        parser.add_argument('--last-name', type=str, default='Admin', help='Administrator last name')

    def handle(self, *args, **options):
        email = options.get('email')
        password = options.get('password')
        first_name = options.get('first_name', 'Platform')
        last_name = options.get('last_name', 'Admin')

        if not email:
            email = input('Enter Platform Admin email address: ').strip()
        if not password:
            import getpass
            password = getpass.getpass('Enter Platform Admin password: ')

        email_clean = email.strip().lower()

        if User.objects.filter(email__iexact=email_clean).exists():
            raise CommandError(f'User with email "{email_clean}" already exists.')

        try:
            validate_password(password)
        except DjangoValidationError as err:
            raise CommandError(f'Password policy error: {"; ".join(err.messages)}')

        admin_user = User.objects.create_superuser(
            email=email_clean,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=UserRole.PLATFORM_ADMIN,
        )

        UserProfile.objects.get_or_create(
            user=admin_user,
            defaults={'phone': '', 'bio': 'Initial Platform Administrator'},
        )

        log_audit_event(
            action='PLATFORM_ADMIN_SEEDED',
            actor=admin_user,
            target_type='User',
            target_id=str(admin_user.id),
            metadata={'email': admin_user.email, 'source': 'management_command'},
        )

        self.stdout.write(self.style.SUCCESS(
            f'Successfully created PLATFORM_ADMIN account for "{admin_user.email}" [ID: {admin_user.id}]'
        ))
