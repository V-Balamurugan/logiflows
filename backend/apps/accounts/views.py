import logging
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.cookies import set_refresh_cookie, clear_refresh_cookie, get_refresh_token_from_request
from apps.accounts.throttling import LoginRateThrottle, PasswordResetRateThrottle, RegisterRateThrottle
from apps.accounts.serializers import (
    RegisterSerializer,
    ActivationSerializer,
    LoginSerializer,
    RefreshTokenSerializer,
    PasswordChangeSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    UserSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
)
from apps.accounts.services import (
    get_client_ip,
    get_client_user_agent,
    register_customer,
    activate_account,
    authenticate_user,
    refresh_access_token,
    revoke_refresh_token,
    change_password,
    request_password_reset,
    confirm_password_reset,
)

logger = logging.getLogger('apps.accounts.views')


class RegisterView(APIView):
    """Public customer registration endpoint."""
    permission_classes = [AllowAny]
    throttle_classes = [RegisterRateThrottle]

    @extend_schema(
        summary='Self-register new customer account',
        description='Creates a customer account (CUSTOMER role) and dispatches an email activation token.',
        request=RegisterSerializer,
        responses={
            201: OpenApiResponse(description='Registration successful. Verification email dispatched.'),
            400: OpenApiResponse(description='Validation error or duplicate email.'),
        },
        tags=['Authentication'],
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = register_customer(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password'],
            first_name=serializer.validated_data.get('first_name', ''),
            last_name=serializer.validated_data.get('last_name', ''),
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
        )

        return Response(
            {
                'message': 'Registration successful. Please check your email to activate your account.',
                'email': user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class ActivateView(APIView):
    """Account activation link redemption."""
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Activate user account',
        description='Consumes a single-use signed email token to activate the account.',
        request=ActivationSerializer,
        responses={
            200: OpenApiResponse(description='Account activated successfully.'),
            400: OpenApiResponse(description='Token invalid, expired, or already used.'),
        },
        tags=['Authentication'],
    )
    def post(self, request):
        serializer = ActivationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = activate_account(
            raw_token=serializer.validated_data['token'],
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
        )

        return Response(
            {
                'message': 'Account activated successfully. You may now log in.',
                'email': user.email,
            },
            status=status.HTTP_200_OK,
        )


class LoginView(APIView):
    """User authentication and JWT token issuance."""
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    @extend_schema(
        summary='Authenticate user and issue JWT tokens',
        description='Validates credentials and delivers an access token in the JSON body and a refresh token in an HttpOnly cookie.',
        request=LoginSerializer,
        responses={
            200: OpenApiResponse(description='Login successful. Access token returned and cookie set.'),
            401: OpenApiResponse(description='Invalid credentials.'),
            403: OpenApiResponse(description='Account inactive.'),
            429: OpenApiResponse(description='Account temporarily locked out.'),
        },
        tags=['Authentication'],
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user, access_token, refresh_token = authenticate_user(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password'],
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
        )

        user_data = UserSerializer(user).data

        response = Response(
            {
                'access': access_token,
                'user': user_data,
            },
            status=status.HTTP_200_OK,
        )
        set_refresh_cookie(response, refresh_token)
        return response


class RefreshTokenView(APIView):
    """Silent token refresh and rotating cookie update."""
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Refresh JWT access token',
        description='Reads rotating refresh token from HttpOnly cookie or request body, blacklists old token, and issues a new pair.',
        request=RefreshTokenSerializer,
        responses={
            200: OpenApiResponse(description='Token refresh successful.'),
            400: OpenApiResponse(description='Token invalid or expired.'),
        },
        tags=['Authentication'],
    )
    def post(self, request):
        raw_refresh_token = get_refresh_token_from_request(request)

        user, new_access_token, new_refresh_token = refresh_access_token(
            raw_refresh_token=raw_refresh_token,
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
        )

        user_data = UserSerializer(user).data

        response = Response(
            {
                'access': new_access_token,
                'user': user_data,
            },
            status=status.HTTP_200_OK,
        )
        set_refresh_cookie(response, new_refresh_token)
        return response


class LogoutView(APIView):
    """Revoke refresh token and clear authentication cookie."""
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Log out and revoke refresh token',
        description='Revokes refresh token in the blacklist and clears the HttpOnly cookie.',
        request=RefreshTokenSerializer,
        responses={
            200: OpenApiResponse(description='Logged out successfully.'),
        },
        tags=['Authentication'],
    )
    def post(self, request):
        raw_refresh_token = get_refresh_token_from_request(request)

        revoke_refresh_token(
            raw_refresh_token=raw_refresh_token,
            actor=request.user if request.user.is_authenticated else None,
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
        )

        response = Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        clear_refresh_cookie(response)
        return response


class PasswordChangeView(APIView):
    """Change password for authenticated user."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Change password for current user',
        description='Requires verification of current password and sets a new password meeting policy standards.',
        request=PasswordChangeSerializer,
        responses={
            200: OpenApiResponse(description='Password updated successfully.'),
            400: OpenApiResponse(description='Validation error or incorrect current password.'),
        },
        tags=['Authentication'],
    )
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        change_password(
            user=request.user,
            current_password=serializer.validated_data['current_password'],
            new_password=serializer.validated_data['new_password'],
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
        )

        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    """Public password reset request."""
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    @extend_schema(
        summary='Request password reset email',
        description='Dispatches password reset link if active account exists. Generic response prevents user enumeration.',
        request=PasswordResetRequestSerializer,
        responses={
            200: OpenApiResponse(description='Password reset instructions dispatched.'),
        },
        tags=['Authentication'],
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        request_password_reset(
            email=serializer.validated_data['email'],
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
        )

        return Response(
            {
                'message': 'If an active account exists with that email address, a password reset link has been dispatched.',
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """Public password reset confirmation via token."""
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Confirm password reset via single-use token',
        description='Sets a new password using a valid, unexpired password reset token.',
        request=PasswordResetConfirmSerializer,
        responses={
            200: OpenApiResponse(description='Password reset successfully.'),
            400: OpenApiResponse(description='Token invalid, expired, or validation error.'),
        },
        tags=['Authentication'],
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        confirm_password_reset(
            raw_token=serializer.validated_data['token'],
            new_password=serializer.validated_data['new_password'],
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
        )

        return Response(
            {
                'message': 'Password has been successfully reset. You may now log in with your new password.',
            },
            status=status.HTTP_200_OK,
        )


class UserMeView(APIView):
    """Retrieve or update currently authenticated user."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Get currently authenticated user details',
        responses={200: UserSerializer},
        tags=['Users'],
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary='Update current user profile information',
        request=UserUpdateSerializer,
        responses={200: UserSerializer},
        tags=['Users'],
    )
    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()
        return Response(UserSerializer(updated_user).data, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    """Retrieve detailed profile information for current user."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Get current user profile attributes',
        responses={200: UserProfileSerializer},
        tags=['Users'],
    )
    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile:
            from apps.accounts.models import UserProfile
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
