import re
from rest_framework import serializers
from .models import Branch, BranchStatus, ServiceArea
from apps.organizations.models import Organization, OrganizationStatus
from apps.accounts.models import User, UserRole


class ServiceAreaSerializer(serializers.ModelSerializer):
    """
    Serializer for postal code service areas.
    Enforces the documented intra-organization overlap-conflict rule.
    """
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    branch_code = serializers.CharField(source='branch.code', read_only=True)

    class Meta:
        model = ServiceArea
        fields = [
            'id',
            'branch',
            'branch_name',
            'branch_code',
            'postal_code',
            'is_serviceable',
            'created_at',
        ]
        read_only_fields = ['id', 'branch_name', 'branch_code', 'created_at']

    def validate_postal_code(self, value):
        code = value.strip().upper()
        if not re.match(r'^[A-Z0-9 -]{3,15}$', code):
            raise serializers.ValidationError('Invalid postal code format.')
        return code

    def validate(self, attrs):
        branch = attrs.get('branch') or (self.instance.branch if self.instance else None)
        postal_code = attrs.get('postal_code') or (self.instance.postal_code if self.instance else None)
        is_serviceable = attrs.get('is_serviceable', True)

        if not branch:
            raise serializers.ValidationError({'branch': 'Branch reference is required.'})

        # Overlap-conflict rule:
        # Within the SAME organization, only ONE active branch may have is_serviceable=True for a postal code.
        if is_serviceable:
            conflict_qs = ServiceArea.objects.filter(
                branch__organization=branch.organization,
                postal_code__iexact=postal_code,
                is_serviceable=True,
                branch__status=BranchStatus.ACTIVE,
            ).exclude(branch=branch)

            if self.instance:
                conflict_qs = conflict_qs.exclude(id=self.instance.id)

            conflicting_area = conflict_qs.select_related('branch').first()
            if conflicting_area:
                raise serializers.ValidationError({
                    'postal_code': (
                        f"Postal code '{postal_code}' is already actively served by branch "
                        f"'{conflicting_area.branch.name}' ({conflicting_area.branch.code}) "
                        f"in this organization."
                    )
                })

        return attrs


class BranchSerializer(serializers.ModelSerializer):
    """
    Comprehensive Branch serializer with operational metadata, manager details,
    and service area counts.
    """
    organization_code = serializers.CharField(source='organization.code', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    manager_name = serializers.CharField(source='manager.full_name', read_only=True, allow_null=True)
    manager_email = serializers.EmailField(source='manager.email', read_only=True, allow_null=True)
    service_areas = ServiceAreaSerializer(many=True, read_only=True)
    service_area_count = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [
            'id',
            'organization',
            'organization_code',
            'organization_name',
            'code',
            'name',
            'address',
            'pincode',
            'city',
            'state',
            'country',
            'contact_email',
            'contact_phone',
            'latitude',
            'longitude',
            'operating_hours',
            'status',
            'manager',
            'manager_name',
            'manager_email',
            'service_areas',
            'service_area_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'organization_code',
            'organization_name',
            'manager_name',
            'manager_email',
            'service_areas',
            'service_area_count',
            'created_at',
            'updated_at',
        ]

    def get_service_area_count(self, obj):
        return obj.service_areas.count()

    def validate_code(self, value):
        code = value.strip().upper()
        if not re.match(r'^[A-Z0-9_-]{2,50}$', code):
            raise serializers.ValidationError(
                'Branch code must be 2-50 uppercase alphanumeric characters, hyphens, or underscores.'
            )
        return code

    def validate(self, attrs):
        organization = attrs.get('organization') or (self.instance.organization if self.instance else None)
        code = attrs.get('code')

        if organization and organization.status != OrganizationStatus.APPROVED:
            raise serializers.ValidationError({
                'organization': f"Cannot create branches in an unapproved organization (Status: {organization.status})."
            })

        if organization and code:
            qs = Branch.objects.filter(
                organization=organization,
                code__iexact=code,
            )
            if self.instance:
                qs = qs.exclude(id=self.instance.id)
            if qs.exists():
                raise serializers.ValidationError({
                    'code': f"A branch with code '{code}' already exists in this organization."
                })

        return attrs


class BranchUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for modifying existing branch attributes.
    Organization and Branch Code are immutable after creation.
    """
    class Meta:
        model = Branch
        fields = [
            'name',
            'address',
            'pincode',
            'city',
            'state',
            'country',
            'contact_email',
            'contact_phone',
            'latitude',
            'longitude',
            'operating_hours',
            'status',
            'manager',
        ]

