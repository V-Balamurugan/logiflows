import re
from rest_framework import serializers
from .models import Organization, OrganizationMembership, OrganizationStatus
from apps.accounts.models import UserRole


class OrganizationRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for initial organization registration requests.
    Validates code format, uniqueness, and contact email.
    """
    class Meta:
        model = Organization
        fields = [
            'id',
            'name',
            'legal_name',
            'registration_number',
            'code',
            'contact_email',
            'contact_phone',
            'address',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_code(self, value):
        code = value.strip().upper()
        if not re.match(r'^[A-Z0-9_-]{3,50}$', code):
            raise serializers.ValidationError(
                'Organization code must be 3-50 uppercase alphanumeric characters, hyphens, or underscores.'
            )
        if Organization.objects.filter(code__iexact=code).exists():
            raise serializers.ValidationError(
                f"An organization with code '{code}' already exists."
            )
        return code


class OrganizationDetailSerializer(serializers.ModelSerializer):
    """
    Comprehensive serializer for organization details, status, and tenant settings.
    """
    owner_email = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            'id',
            'name',
            'legal_name',
            'registration_number',
            'code',
            'contact_email',
            'contact_phone',
            'address',
            'status',
            'rejection_reason',
            'suspension_reason',
            'settings',
            'owner_email',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'code',
            'status',
            'rejection_reason',
            'suspension_reason',
            'owner_email',
            'created_at',
            'updated_at',
        ]

    def get_owner_email(self, obj):
        owner_membership = obj.memberships.filter(
            role=UserRole.ORGANIZATION_OWNER,
        ).select_related('user').first()
        return owner_membership.user.email if owner_membership else None


class OrganizationUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for organization owners and admins to update profile and settings.
    Organization code is immutable.
    """
    class Meta:
        model = Organization
        fields = [
            'name',
            'legal_name',
            'registration_number',
            'contact_email',
            'contact_phone',
            'address',
            'settings',
        ]


class OrganizationActionReasonSerializer(serializers.Serializer):
    """
    Serializer for actions requiring a mandatory reason (e.g. rejection or suspension).
    """
    reason = serializers.CharField(
        min_length=5,
        max_length=1000,
        required=True,
        error_messages={
            'required': 'A clear justification reason is mandatory for this action.',
            'min_length': 'Reason must be at least 5 characters long.',
        },
    )


class OrganizationMembershipSerializer(serializers.ModelSerializer):
    """
    Serializer for user-to-organization membership representation.
    """
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_code = serializers.CharField(source='organization.code', read_only=True)
    organization_status = serializers.CharField(source='organization.status', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)

    class Meta:
        model = OrganizationMembership
        fields = [
            'id',
            'organization',
            'organization_name',
            'organization_code',
            'organization_status',
            'user',
            'user_email',
            'user_full_name',
            'role',
            'branch',
            'branch_name',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'organization_name',
            'organization_code',
            'organization_status',
            'user_email',
            'user_full_name',
            'branch_name',
            'created_at',
            'updated_at',
        ]


class OrganizationMembershipUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating an existing organization membership role, branch, or active state.
    """
    class Meta:
        model = OrganizationMembership
        fields = ['role', 'branch', 'is_active']

    def validate_role(self, value):
        allowed_roles = [
            UserRole.ORGANIZATION_ADMIN,
            UserRole.BRANCH_MANAGER,
            UserRole.EMPLOYEE,
        ]
        if value not in allowed_roles:
            raise serializers.ValidationError(
                f"Role '{value}' cannot be assigned via standard membership management."
            )
        return value

    def validate(self, attrs):
        branch = attrs.get('branch')
        if branch and self.instance:
            if branch.organization_id != self.instance.organization_id:
                raise serializers.ValidationError({
                    'branch': f"Branch '{branch.code}' belongs to a different organization."
                })
        return attrs
