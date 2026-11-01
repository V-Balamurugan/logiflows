import re
from rest_framework import serializers
from .models import EmployeeProfile, EmployeeStatus
from apps.organizations.models import Organization, OrganizationMembership, UserRole
from apps.branches.models import Branch
from apps.accounts.models import User


class EmployeeProfileSerializer(serializers.ModelSerializer):
    """
    Comprehensive Employee serializer joining User, Membership, and Branch entities.
    """
    organization_id = serializers.UUIDField(source='membership.organization.id', read_only=True)
    organization_code = serializers.CharField(source='membership.organization.code', read_only=True)
    organization_name = serializers.CharField(source='membership.organization.name', read_only=True)
    user_id = serializers.UUIDField(source='membership.user.id', read_only=True)
    email = serializers.EmailField(source='membership.user.email', read_only=True)
    first_name = serializers.CharField(source='membership.user.first_name', read_only=True)
    last_name = serializers.CharField(source='membership.user.last_name', read_only=True)
    full_name = serializers.CharField(source='membership.user.full_name', read_only=True)
    role = serializers.CharField(source='membership.role', read_only=True)
    branch_id = serializers.UUIDField(source='membership.branch.id', read_only=True, allow_null=True)
    branch_name = serializers.CharField(source='membership.branch.name', read_only=True, allow_null=True)
    branch_code = serializers.CharField(source='membership.branch.code', read_only=True, allow_null=True)
    is_active = serializers.BooleanField(source='membership.is_active', read_only=True)

    class Meta:
        model = EmployeeProfile
        fields = [
            'id',
            'organization_id',
            'organization_code',
            'organization_name',
            'user_id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'branch_id',
            'branch_name',
            'branch_code',
            'employee_code',
            'designation',
            'phone',
            'status',
            'is_active',
            'joined_date',
            'temporary_password_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'organization_id',
            'organization_code',
            'organization_name',
            'user_id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'branch_id',
            'branch_name',
            'branch_code',
            'is_active',
            'temporary_password_active',
            'created_at',
            'updated_at',
        ]


class EmployeeCreateSerializer(serializers.Serializer):
    """
    Serializer for provisioning or inviting a new employee into an organization.
    """
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(max_length=150, required=True)
    last_name = serializers.CharField(max_length=150, required=True)
    employee_code = serializers.CharField(max_length=50, required=True)
    role = serializers.ChoiceField(
        choices=[
            UserRole.EMPLOYEE,
            UserRole.BRANCH_MANAGER,
            UserRole.ORGANIZATION_ADMIN,
        ],
        default=UserRole.EMPLOYEE,
    )
    branch_id = serializers.UUIDField(required=False, allow_null=True)
    designation = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    temporary_password = serializers.CharField(min_length=8, required=False, allow_blank=True)

    def validate_employee_code(self, value):
        code = value.strip().upper()
        if not re.match(r'^[A-Z0-9_-]{2,50}$', code):
            raise serializers.ValidationError(
                'Employee code must be 2-50 alphanumeric characters, hyphens, or underscores.'
            )
        return code


class EmployeeUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for modifying an existing employee record.
    """
    role = serializers.ChoiceField(
        choices=[
            UserRole.EMPLOYEE,
            UserRole.BRANCH_MANAGER,
            UserRole.ORGANIZATION_ADMIN,
        ],
        required=False,
    )
    branch_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = EmployeeProfile
        fields = [
            'designation',
            'phone',
            'status',
            'role',
            'branch_id',
        ]

