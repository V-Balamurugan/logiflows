from django.core.management.base import BaseCommand
from apps.accounts.models import User, UserProfile, UserRole
from apps.accounts.services.audit_service import log_audit_event

SAMPLE_USERS = [
    {
        'email': 'alex.mercer@logiflows.admin',
        'first_name': 'Alex',
        'last_name': 'Mercer',
        'role': UserRole.PLATFORM_ADMIN,
        'is_staff': True,
        'is_superuser': True,
        'phone': '+1-555-010-0001',
        'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
        'bio': 'Lead System Architect & Global Infrastructure Administrator at LogiFlows Core.',
    },
    {
        'email': 'sarah.jenkins@swiftpost.com',
        'first_name': 'Sarah',
        'last_name': 'Jenkins',
        'role': UserRole.ORGANIZATION_OWNER,
        'is_staff': False,
        'is_superuser': False,
        'phone': '+1-555-010-0002',
        'avatar_url': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80',
        'bio': 'Managing Director and Founder of SwiftPost Logistics Enterprise Group.',
    },
    {
        'email': 'marcus.vance@swiftpost.com',
        'first_name': 'Marcus',
        'last_name': 'Vance',
        'role': UserRole.ORGANIZATION_ADMIN,
        'is_staff': False,
        'is_superuser': False,
        'phone': '+1-555-010-0003',
        'avatar_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
        'bio': 'Regional Vice President of Operations overseeing North American Postal Hubs.',
    },
    {
        'email': 'elena.rostova@swiftpost.com',
        'first_name': 'Elena',
        'last_name': 'Rostova',
        'role': UserRole.BRANCH_MANAGER,
        'is_staff': False,
        'is_superuser': False,
        'phone': '+1-555-010-0004',
        'avatar_url': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
        'bio': 'Metro Hub Sorting & Logistics Director at SwiftPost Sorting Center 04.',
    },
    {
        'email': 'dave.miller@swiftpost.com',
        'first_name': 'Dave',
        'last_name': 'Miller',
        'role': UserRole.EMPLOYEE,
        'is_staff': False,
        'is_superuser': False,
        'phone': '+1-555-010-0005',
        'avatar_url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
        'bio': 'Senior Line-Haul Courier & Custody Verification Specialist at Hub 04.',
    },
    {
        'email': 'emma.watson@apexsupplies.com',
        'first_name': 'Emma',
        'last_name': 'Watson',
        'role': UserRole.CUSTOMER,
        'is_staff': False,
        'is_superuser': False,
        'phone': '+1-555-010-0006',
        'avatar_url': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
        'bio': 'Procurement & Commercial Dispatch Officer at Apex Global Supplies Inc.',
    },
]

DEFAULT_PASSWORD = 'LogiFlowsDev2026!'


class Command(BaseCommand):
    help = 'Seed canonical sample users across all 6 roles for development, testing, and UI preview.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            default=DEFAULT_PASSWORD,
            help=f'Password to set for all seeded sample users (default: {DEFAULT_PASSWORD})',
        )
        parser.add_argument(
            '--force-passwords',
            action='store_true',
            help='Reset passwords for existing users to the default/provided password',
        )

    def handle(self, *args, **options):
        password = options.get('password') or DEFAULT_PASSWORD
        force_passwords = options.get('force_passwords', False)

        self.stdout.write(self.style.MIGRATE_HEADING('Seeding LogiFlows sample users across all 6 roles...'))

        created_count = 0
        updated_count = 0

        for item in SAMPLE_USERS:
            email = item['email'].strip().lower()
            user = User.objects.filter(email__iexact=email).first()

            if user is None:
                user = User(
                    email=email,
                    first_name=item['first_name'],
                    last_name=item['last_name'],
                    role=item['role'],
                    is_active=True,
                    is_staff=item['is_staff'],
                    is_superuser=item['is_superuser'],
                )
                user.set_password(password)
                user.save()

                UserProfile.objects.create(
                    user=user,
                    phone=item['phone'],
                    avatar_url=item['avatar_url'],
                    bio=item['bio'],
                )

                log_audit_event(
                    action='SAMPLE_USER_SEEDED',
                    actor=user,
                    target_type='User',
                    target_id=str(user.id),
                    metadata={
                        'role': user.role,
                        'email': user.email,
                        'source': 'seedsampleusers',
                        'initial_creation': True,
                    },
                )
                created_count += 1
                self.stdout.write(self.style.SUCCESS(
                    f'  [CREATED] {user.role:<20} {user.email:<32} ({user.full_name})'
                ))
            else:
                # User already exists - update profile and optional password reset
                needs_save = False
                if user.role != item['role']:
                    user.role = item['role']
                    needs_save = True
                if user.is_staff != item['is_staff']:
                    user.is_staff = item['is_staff']
                    needs_save = True
                if user.is_superuser != item['is_superuser']:
                    user.is_superuser = item['is_superuser']
                    needs_save = True
                if not user.is_active:
                    user.is_active = True
                    needs_save = True

                if force_passwords:
                    user.set_password(password)
                    needs_save = True

                if needs_save:
                    user.save()

                profile, _ = UserProfile.objects.get_or_create(user=user)
                profile_updated = False
                if not profile.phone and item['phone']:
                    profile.phone = item['phone']
                    profile_updated = True
                if not profile.avatar_url and item['avatar_url']:
                    profile.avatar_url = item['avatar_url']
                    profile_updated = True
                if not profile.bio and item['bio']:
                    profile.bio = item['bio']
                    profile_updated = True
                if profile_updated:
                    profile.save()

                updated_count += 1
                self.stdout.write(self.style.WARNING(
                    f'  [EXISTS]  {user.role:<20} {user.email:<32} (preserved / updated)'
                ))

        self.stdout.write(self.style.SUCCESS(
            f'\nFinished seeding sample users: {created_count} created, {updated_count} existing.'
        ))
