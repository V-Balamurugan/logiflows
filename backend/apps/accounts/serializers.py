from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.accounts.models import User, UserProfile, UserRole


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile attributes."""
    class Meta:
        model = UserProfile
        fields = ('phone', 'avatar_url', 'bio', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class UserSerializer(serializers.ModelSerializer):
    """Read-only and public representations of User account."""
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'is_active',
            'created_at',
            'profile',
        )
        read_only_fields = ('id', 'role', 'is_active', 'created_at', 'full_name')


class RegisterSerializer(serializers.Serializer):
    """
    Serializer for public customer self-registration.
    Accepts email, password, confirm_password, and optional personal name fields.
    Rejects or ignores any attempt to supply privileged roles.
    """
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    role = serializers.CharField(required=False, write_only=True)

    def validate_email(self, value):
        email_clean = value.strip().lower()
        if User.objects.filter(email__iexact=email_clean).exists():
            raise serializers.ValidationError('A user with this email address already exists.')
        return email_clean

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})

        # Validate password against system security policy
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as err:
            raise serializers.ValidationError({'password': list(err.messages)})

        # Security check: If client attempts privilege escalation via payload role field, reject
        client_role = attrs.get('role')
        if client_role and client_role != UserRole.CUSTOMER:
            raise serializers.ValidationError({'role': 'Client is not permitted to specify an administrative role.'})

        return attrs


class ActivationSerializer(serializers.Serializer):
    """Serializer for account email activation link redemption."""
    token = serializers.CharField(required=True, min_length=1)


class LoginSerializer(serializers.Serializer):
    """Serializer for user authentication requests."""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class RefreshTokenSerializer(serializers.Serializer):
    """
    Serializer for refresh token endpoint.
    Token can be supplied in JSON body or extracted from HttpOnly cookie.
    """
    refresh = serializers.CharField(required=False, allow_blank=True)


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for authenticated password changes."""
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'New passwords do not match.'})
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting a password reset email."""
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming a password reset via token."""
    token = serializers.CharField(required=True, min_length=1)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'New passwords do not match.'})
        return attrs


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for user profile updates."""
    phone = serializers.CharField(source='profile.phone', required=False, allow_blank=True)
    avatar_url = serializers.URLField(source='profile.avatar_url', required=False, allow_blank=True)
    bio = serializers.CharField(source='profile.bio', required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'phone', 'avatar_url', 'bio')

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save(update_fields=['first_name', 'last_name', 'updated_at'])

        if hasattr(instance, 'profile'):
            profile = instance.profile
            for attr, val in profile_data.items():
                setattr(profile, attr, val)
            profile.save()

        return instance
