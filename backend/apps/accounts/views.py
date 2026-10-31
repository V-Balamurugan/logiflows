import logging
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample
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
        description=(
            'Public registration endpoint for new customers and consignors.\n\n'
            'Creates an inactive user with role **CUSTOMER** and dispatches a single-use '
            'activation token via email (captured in the local Mailpit inbox at http://localhost:8025).\n\n'
            '**Security Notice**: Any payload attempting to supply elevated roles (e.g. PLATFORM_ADMIN) '
            'is strictly rejected.'
        ),
        request=RegisterSerializer,
        examples=[
            OpenApiExample(
                name='Valid Customer Registration',
                summary='Standard self-registration for an enterprise client',
                description='Registers a new customer account with full name and matching strong passwords.',
                value={
                    'email': 'customer.demo@apexsupplies.com',
                    'password': 'StrongPassword2026!',
                    'confirm_password': 'StrongPassword2026!',
                    'first_name': 'Emma',
                    'last_name': 'Watson',
                },
                request_only=True,
            ),
        ],
        responses={
            201: OpenApiResponse(
                description='Registration successful. Verification email dispatched.',
                examples=[
                    OpenApiExample(
                        name='Successful Registration Response',
                        value={
                            'message': 'Registration successful. Please check your email to activate your account.',
                            'email': 'customer.demo@apexsupplies.com',
                        },
                        response_only=True,
                    ),
                ],
            ),
            400: OpenApiResponse(
                description='Validation error, passwords mismatch, or email already registered.',
                examples=[
                    OpenApiExample(
                        name='Duplicate Email Error',
                        value={
                            'error': {
                                'code': 'VALIDATION_ERROR',
                                'message': 'Validation errors occurred.',
                                'details': {
                                    'email': ['A user with this email address already exists.']
                                },
                            }
                        },
                        response_only=True,
                    ),
                ],
            ),
        },
        tags=['01 - Authentication & Session'],
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
        summary='Activate user account with token',
        description=(
            'Consumes a single-use 64-character hexadecimal email activation token to activate the user account.\n\n'
            '**How to find a token in local dev**:\n'
            '1. Register a new customer via `POST /api/v1/auth/register/`.\n'
            '2. Open the Mailpit inbox at **http://localhost:8025**.\n'
            '3. Copy the 64-character token from the activation link query parameter.\n'
            '4. Paste it into this request body and execute.'
        ),
        request=ActivationSerializer,
        examples=[
            OpenApiExample(
                name='Valid Activation Token',
                summary='Single-use activation token',
                value={
                    'token': 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'
                },
                request_only=True,
            ),
        ],
        responses={
            200: OpenApiResponse(
                description='Account activated successfully.',
                examples=[
                    OpenApiExample(
                        name='Activation Success',
                        value={
                            'message': 'Account activated successfully. You may now log in.',
                            'email': 'customer.demo@apexsupplies.com',
                        },
                        response_only=True,
                    ),
                ],
            ),
            400: OpenApiResponse(
                description='Token invalid, expired, or already used.',
                examples=[
                    OpenApiExample(
                        name='Expired/Invalid Token Error',
                        value={
                            'error': {
                                'code': 'TOKEN_EXPIRED',
                                'message': 'The token provided is invalid or has expired.',
                                'details': 'Activation or reset link is invalid or expired.',
                            }
                        },
                        response_only=True,
                    ),
                ],
            ),
        },
        tags=['01 - Authentication & Session'],
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
        description=(
            'Authenticates user credentials and issues:\n'
            '- **Access Token** (short-lived, 15 minutes) delivered in the JSON response body.\n'
            '- **Refresh Token** (rotating, 7 days) stored in an **HttpOnly, Secure, SameSite=Lax** cookie (`refresh_token`).\n\n'
            '💡 **Pre-Configured Test Accounts**:\n'
            'Select any of the 6 roles from the **Examples dropdown** below to test immediately with no typing needed!\n'
            'Default dev password for all seeded accounts is: `LogiFlowsDev2026!`'
        ),
        request=LoginSerializer,
        examples=[
            OpenApiExample(
                name='1. Platform Admin (Alex Mercer)',
                summary='Global Platform Super Administrator',
                description='Full system visibility, admin CLI operations, and global audit log inspection.',
                value={
                    'email': 'alex.mercer@logiflows.admin',
                    'password': 'LogiFlowsDev2026!',
                },
                request_only=True,
            ),
            OpenApiExample(
                name='2. Organization Owner (Sarah Jenkins)',
                summary='Enterprise Logistics Tenant Owner (SwiftPost)',
                description='Full tenant governance, billing management, and administrative authority.',
                value={
                    'email': 'sarah.jenkins@swiftpost.com',
                    'password': 'LogiFlowsDev2026!',
                },
                request_only=True,
            ),
            OpenApiExample(
                name='3. Organization Admin (Marcus Vance)',
                summary='Regional Logistics Operations Director',
                description='Regional hub management, driver/vehicle assignments, and logistics fleet oversight.',
                value={
                    'email': 'marcus.vance@swiftpost.com',
                    'password': 'LogiFlowsDev2026!',
                },
                request_only=True,
            ),
            OpenApiExample(
                name='4. Branch Manager (Elena Rostova)',
                summary='Sorting Facility & Hub Manager (Metro Hub #04)',
                description='Sorting center throughput, driver dispatching, and custody verification.',
                value={
                    'email': 'elena.rostova@swiftpost.com',
                    'password': 'LogiFlowsDev2026!',
                },
                request_only=True,
            ),
            OpenApiExample(
                name='5. Courier / Driver (Dave Miller)',
                summary='Line-Haul Courier & Sorting Specialist',
                description='Parcel barcode/QR scanning (ePOD) and delivery manifest execution.',
                value={
                    'email': 'dave.miller@swiftpost.com',
                    'password': 'LogiFlowsDev2026!',
                },
                request_only=True,
            ),
            OpenApiExample(
                name='6. Customer (Emma Watson)',
                summary='B2B Consignor / Client (Apex Global Supplies)',
                description='Self-service consignor booking parcels, printing waybills, and tracking shipments.',
                value={
                    'email': 'emma.watson@apexsupplies.com',
                    'password': 'LogiFlowsDev2026!',
                },
                request_only=True,
            ),
        ],
        responses={
            200: OpenApiResponse(
                description='Authentication successful. Access token returned in body, refresh token stored in HttpOnly cookie.',
                examples=[
                    OpenApiExample(
                        name='Successful Login Response',
                        value={
                            'access': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                            'user': {
                                'id': '8190744b-ffc6-44ab-ad99-71ae7494f453',
                                'email': 'alex.mercer@logiflows.admin',
                                'first_name': 'Alex',
                                'last_name': 'Mercer',
                                'full_name': 'Alex Mercer',
                                'role': 'PLATFORM_ADMIN',
                                'is_active': True,
                                'created_at': '2026-10-30T00:00:00Z',
                                'profile': {
                                    'phone': '+1-555-010-0001',
                                    'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
                                    'bio': 'Lead System Architect & Global Infrastructure Administrator at LogiFlows Core.',
                                    'created_at': '2026-10-30T00:00:00Z',
                                    'updated_at': '2026-10-30T00:00:00Z',
                                },
                            },
                        },
                        response_only=True,
                    ),
                ],
            ),
            401: OpenApiResponse(
                description='Invalid email or password.',
                examples=[
                    OpenApiExample(
                        name='Invalid Credentials Error',
                        value={
                            'error': {
                                'code': 'INVALID_CREDENTIALS',
                                'message': 'Invalid email or password.',
                                'details': 'Invalid email or password.',
                            }
                        },
                        response_only=True,
                    ),
                ],
            ),
            403: OpenApiResponse(
                description='Account is inactive (pending email activation).',
                examples=[
                    OpenApiExample(
                        name='Account Inactive Error',
                        value={
                            'error': {
                                'code': 'ACCOUNT_INACTIVE',
                                'message': 'This account is inactive. Please activate your account via the email link.',
                                'details': 'This account is inactive. Please activate your account via the email link.',
                            }
                        },
                        response_only=True,
                    ),
                ],
            ),
            429: OpenApiResponse(
                description='Account temporarily locked due to excessive failed attempts.',
                examples=[
                    OpenApiExample(
                        name='Lockout Throttled Error',
                        value={
                            'error': {
                                'code': 'THROTTLED',
                                'message': 'Account is temporarily locked due to excessive failed attempts. Please try again later.',
                                'details': 'Account is temporarily locked due to excessive failed attempts. Please try again later.',
                            }
                        },
                        response_only=True,
                    ),
                ],
            ),
        },
        tags=['01 - Authentication & Session'],
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
        description=(
            'Rotates the refresh token pair and issues a new access token.\n\n'
            '- **In Web Browsers**: The refresh token is read automatically from the secure `refresh_token` HttpOnly cookie.\n'
            '- **In Swagger UI / cURL / Postman**: If cookies are not automatically forwarded, provide the token '
            'in the JSON body as `{ "refresh": "<your_refresh_token>" }`.\n\n'
            '**Security Notice**: Refresh tokens rotate on every invocation. Old refresh tokens are added to the server blacklist.'
        ),
        request=RefreshTokenSerializer,
        examples=[
            OpenApiExample(
                name='Swagger / API Client Payload',
                summary='JSON request body for Swagger or API testing tools',
                description='Supply the refresh token in the JSON body when testing outside of a browser cookie context.',
                value={
                    'refresh': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTgwMDAwMDAwMCwianRpIjoiYWJjZDEyMzQiLCJ1c2VyX2lkIjoiODFmZDEyMzQtNTY3OC05MGFiLWNkZWYtMTIzNDU2Nzg5MGFiIn0.signature'
                },
                request_only=True,
            ),
        ],
        responses={
            200: OpenApiResponse(
                description='Token refresh successful. New access token returned and cookie updated.',
                examples=[
                    OpenApiExample(
                        name='Refresh Success Response',
                        value={
                            'access': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                            'user': {
                                'id': '8190744b-ffc6-44ab-ad99-71ae7494f453',
                                'email': 'alex.mercer@logiflows.admin',
                                'role': 'PLATFORM_ADMIN',
                            },
                        },
                        response_only=True,
                    ),
                ],
            ),
            400: OpenApiResponse(
                description='Refresh token missing, invalid, expired, or blacklisted.',
                examples=[
                    OpenApiExample(
                        name='Missing / Expired Token Error',
                        value={
                            'error': {
                                'code': 'TOKEN_EXPIRED',
                                'message': 'The token provided is invalid or has expired.',
                                'details': 'Refresh token is required.',
                            }
                        },
                        response_only=True,
                    ),
                ],
            ),
        },
        tags=['01 - Authentication & Session'],
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
        description=(
            'Terminates the user session by:\n'
            '1. Adding the active refresh token to the server blacklist (preventing replay attacks).\n'
            '2. Deleting the `refresh_token` HttpOnly cookie from the client.'
        ),
        request=RefreshTokenSerializer,
        examples=[
            OpenApiExample(
                name='Swagger / API Client Logout Payload',
                summary='Optional refresh token in JSON body',
                value={
                    'refresh': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                request_only=True,
            ),
        ],
        responses={
            200: OpenApiResponse(
                description='Logged out successfully.',
                examples=[
                    OpenApiExample(
                        name='Logout Success',
                        value={'message': 'Successfully logged out.'},
                        response_only=True,
                    ),
                ],
            ),
        },
        tags=['01 - Authentication & Session'],
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
        description=(
            'Requires authentication (**Bearer JWT access token**).\n\n'
            'Verifies the caller\'s current password and sets a new password complying with Django security policies.'
        ),
        request=PasswordChangeSerializer,
        examples=[
            OpenApiExample(
                name='Password Change Request',
                summary='Standard password update payload',
                value={
                    'current_password': 'LogiFlowsDev2026!',
                    'new_password': 'NewSecurePassword2026!',
                    'confirm_password': 'NewSecurePassword2026!',
                },
                request_only=True,
            ),
        ],
        responses={
            200: OpenApiResponse(
                description='Password updated successfully.',
                examples=[
                    OpenApiExample(
                        name='Password Change Success',
                        value={'message': 'Password changed successfully.'},
                        response_only=True,
                    ),
                ],
            ),
            400: OpenApiResponse(
                description='Validation error or incorrect current password.',
                examples=[
                    OpenApiExample(
                        name='Incorrect Password Error',
                        value={
                            'error': {
                                'code': 'VALIDATION_ERROR',
                                'message': 'Validation errors occurred.',
                                'details': {
                                    'current_password': ['Current password is not correct.']
                                },
                            }
                        },
                        response_only=True,
                    ),
                ],
            ),
            401: OpenApiResponse(
                description='Authentication required. Bearer token missing or expired.',
            ),
        },
        tags=['01 - Authentication & Session'],
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
        description=(
            'Dispatches a 24-hour cryptographic password reset token to the requested email.\n\n'
            '- **Anti-Enumeration**: Always returns a uniform 200 OK success message regardless of whether the email exists.\n'
            '- **Local Dev**: Emails are captured in Mailpit at **http://localhost:8025**.'
        ),
        request=PasswordResetRequestSerializer,
        examples=[
            OpenApiExample(
                name='Password Reset Request Payload',
                summary='Request password reset for a registered user',
                value={
                    'email': 'emma.watson@apexsupplies.com'
                },
                request_only=True,
            ),
        ],
        responses={
            200: OpenApiResponse(
                description='Password reset instructions dispatched.',
                examples=[
                    OpenApiExample(
                        name='Dispatch Success',
                        value={
                            'message': 'If an active account exists with that email address, a password reset link has been dispatched.',
                        },
                        response_only=True,
                    ),
                ],
            ),
        },
        tags=['01 - Authentication & Session'],
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
        summary='Confirm password reset with token',
        description=(
            'Redeems a single-use 64-character token received via email and sets a new account password.\n\n'
            '**How to find token in local dev**:\n'
            '1. Call `POST /api/v1/auth/password/reset/request/` with any seeded email.\n'
            '2. Open Mailpit at **http://localhost:8025** and inspect the latest reset email.\n'
            '3. Copy the token and paste it here with matching new passwords.'
        ),
        request=PasswordResetConfirmSerializer,
        examples=[
            OpenApiExample(
                name='Password Reset Confirmation Payload',
                summary='Complete password reset using valid token',
                value={
                    'token': 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
                    'new_password': 'BrandNewPassword2026!',
                    'confirm_password': 'BrandNewPassword2026!',
                },
                request_only=True,
            ),
        ],
        responses={
            200: OpenApiResponse(
                description='Password reset successfully.',
                examples=[
                    OpenApiExample(
                        name='Reset Success',
                        value={
                            'message': 'Password has been successfully reset. You may now log in with your new password.',
                        },
                        response_only=True,
                    ),
                ],
            ),
            400: OpenApiResponse(
                description='Token invalid, expired, or password validation error.',
                examples=[
                    OpenApiExample(
                        name='Invalid Token Error',
                        value={
                            'error': {
                                'code': 'TOKEN_EXPIRED',
                                'message': 'The token provided is invalid or has expired.',
                                'details': 'Activation or reset link is invalid or expired.',
                            }
                        },
                        response_only=True,
                    ),
                ],
            ),
        },
        tags=['01 - Authentication & Session'],
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
        description=(
            'Returns the authenticated user\'s core account record, role, active status, '
            'and nested profile attributes (phone, avatar URL, bio).\n\n'
            'Requires **Bearer JWT access token** in the `Authorization` header.'
        ),
        responses={
            200: OpenApiResponse(
                response=UserSerializer,
                description='Current user profile details.',
                examples=[
                    OpenApiExample(
                        name='Current User Profile Response',
                        value={
                            'id': '8190744b-ffc6-44ab-ad99-71ae7494f453',
                            'email': 'alex.mercer@logiflows.admin',
                            'first_name': 'Alex',
                            'last_name': 'Mercer',
                            'full_name': 'Alex Mercer',
                            'role': 'PLATFORM_ADMIN',
                            'is_active': True,
                            'created_at': '2026-10-30T00:00:00Z',
                            'profile': {
                                'phone': '+1-555-010-0001',
                                'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
                                'bio': 'Lead System Architect & Global Infrastructure Administrator at LogiFlows Core.',
                                'created_at': '2026-10-30T00:00:00Z',
                                'updated_at': '2026-10-30T00:00:00Z',
                            },
                        },
                        response_only=True,
                    ),
                ],
            ),
            401: OpenApiResponse(description='Missing or invalid Bearer JWT token.'),
        },
        tags=['02 - User Profile & Identity'],
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary='Update current user profile information',
        description=(
            'Partially updates profile information for the authenticated user (names, phone, avatar URL, bio).\n\n'
            'Fields like `email`, `role`, and `id` are immutable and cannot be altered via this endpoint.'
        ),
        request=UserUpdateSerializer,
        examples=[
            OpenApiExample(
                name='Profile Update Payload',
                summary='Update user names, phone, and bio',
                value={
                    'first_name': 'Alex',
                    'last_name': 'Mercer',
                    'phone': '+1-555-010-9999',
                    'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
                    'bio': 'Lead Infrastructure Architect overseeing LogiFlows platform telemetry.',
                },
                request_only=True,
            ),
        ],
        responses={
            200: OpenApiResponse(
                response=UserSerializer,
                description='User profile updated successfully.',
            ),
            400: OpenApiResponse(description='Validation error on submitted fields.'),
            401: OpenApiResponse(description='Authentication required.'),
        },
        tags=['02 - User Profile & Identity'],
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
        description='Fetches the `UserProfile` relation for the authenticated user (phone, avatar URL, bio notes).',
        responses={
            200: OpenApiResponse(
                response=UserProfileSerializer,
                description='User profile attributes.',
                examples=[
                    OpenApiExample(
                        name='Profile Attributes Response',
                        value={
                            'phone': '+1-555-010-0001',
                            'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
                            'bio': 'Lead System Architect & Global Infrastructure Administrator at LogiFlows Core.',
                            'created_at': '2026-10-30T00:00:00Z',
                            'updated_at': '2026-10-30T00:00:00Z',
                        },
                        response_only=True,
                    ),
                ],
            ),
            401: OpenApiResponse(description='Authentication required.'),
        },
        tags=['02 - User Profile & Identity'],
    )
    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile:
            from apps.accounts.models import UserProfile
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

