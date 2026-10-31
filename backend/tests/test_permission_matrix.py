import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from apps.accounts.models import User, UserRole


@pytest.mark.django_db
class TestEndpointPermissionMatrix:
    """
    Parametrized permission matrix testing all Phase 01 endpoints across:
    - Anonymous (unauthenticated)
    - Inactive user
    - All 6 RBAC roles:
        1. PLATFORM_ADMIN
        2. ORGANIZATION_OWNER
        3. ORGANIZATION_ADMIN
        4. BRANCH_MANAGER
        5. EMPLOYEE
        6. CUSTOMER
    """

    @pytest.fixture(autouse=True)
    def setup_matrix_users(self):
        self.password = "MatrixPass2026!secure"
        self.users = {}
        for role in UserRole.values:
            email = f"matrix_{role.lower()}@logiflows.test"
            user = User.objects.create_user(
                email=email,
                password=self.password,
                role=role,
                is_active=True,
            )
            self.users[role] = user

        # Inactive user
        self.inactive_user = User.objects.create_user(
            email="matrix_inactive@logiflows.test",
            password=self.password,
            role=UserRole.CUSTOMER,
            is_active=False,
        )

    def _client_for(self, persona):
        client = APIClient()
        if persona == "anonymous":
            return client
        elif persona == "inactive":
            token = str(RefreshToken.for_user(self.inactive_user).access_token)
            client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
            return client
        else:
            token = str(RefreshToken.for_user(self.users[persona]).access_token)
            client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
            return client

    # 1. Protected Endpoint: GET /api/v1/users/me/
    @pytest.mark.parametrize("persona", [
        "anonymous",
        "inactive",
        UserRole.PLATFORM_ADMIN,
        UserRole.ORGANIZATION_OWNER,
        UserRole.ORGANIZATION_ADMIN,
        UserRole.BRANCH_MANAGER,
        UserRole.EMPLOYEE,
        UserRole.CUSTOMER,
    ])
    def test_users_me_access(self, persona):
        client = self._client_for(persona)
        res = client.get("/api/v1/users/me/")

        if persona in ("anonymous", "inactive"):
            assert res.status_code == status.HTTP_401_UNAUTHORIZED
        else:
            assert res.status_code == status.HTTP_200_OK
            assert res.data["email"] == self.users[persona].email
            assert res.data["role"] == persona

    # 2. Protected Endpoint: PATCH /api/v1/users/me/profile/
    @pytest.mark.parametrize("persona", [
        "anonymous",
        "inactive",
        UserRole.PLATFORM_ADMIN,
        UserRole.ORGANIZATION_OWNER,
        UserRole.ORGANIZATION_ADMIN,
        UserRole.BRANCH_MANAGER,
        UserRole.EMPLOYEE,
        UserRole.CUSTOMER,
    ])
    def test_users_me_profile_patch_access(self, persona):
        client = self._client_for(persona)
        payload = {"phone": "+1 555-0199"}
        res = client.patch("/api/v1/users/me/profile/", data=payload, format="json")

        if persona in ("anonymous", "inactive"):
            assert res.status_code == status.HTTP_401_UNAUTHORIZED
        else:
            assert res.status_code == status.HTTP_200_OK
            assert res.data["phone"] == "+1 555-0199"

    # 3. Protected Endpoint: POST /api/v1/auth/password/change/
    @pytest.mark.parametrize("persona", [
        "anonymous",
        "inactive",
        UserRole.PLATFORM_ADMIN,
        UserRole.ORGANIZATION_OWNER,
        UserRole.ORGANIZATION_ADMIN,
        UserRole.BRANCH_MANAGER,
        UserRole.EMPLOYEE,
        UserRole.CUSTOMER,
    ])
    def test_password_change_access(self, persona):
        client = self._client_for(persona)
        payload = {
            "current_password": self.password,
            "new_password": "NewMatrixPass2026!rev",
            "confirm_password": "NewMatrixPass2026!rev",
        }
        res = client.post("/api/v1/auth/password/change/", data=payload, format="json")

        if persona in ("anonymous", "inactive"):
            assert res.status_code == status.HTTP_401_UNAUTHORIZED
        else:
            assert res.status_code == status.HTTP_200_OK

    # 4. Public Endpoint: GET /api/v1/health/
    @pytest.mark.parametrize("persona", [
        "anonymous",
        "inactive",
        UserRole.PLATFORM_ADMIN,
        UserRole.ORGANIZATION_OWNER,
        UserRole.ORGANIZATION_ADMIN,
        UserRole.BRANCH_MANAGER,
        UserRole.EMPLOYEE,
        UserRole.CUSTOMER,
    ])
    def test_health_check_public_matrix(self, persona):
        client = self._client_for(persona)
        res = client.get("/api/v1/health/")
        assert res.status_code == status.HTTP_200_OK
        assert res.data["status"] == "healthy"

    # 5. Public Endpoint: POST /api/v1/auth/password/reset/request/
    @pytest.mark.parametrize("persona", [
        "anonymous",
        "inactive",
        UserRole.CUSTOMER,
    ])
    def test_password_reset_request_public_matrix(self, persona):
        client = self._client_for(persona)
        res = client.post(
            "/api/v1/auth/password/reset/request/",
            data={"email": "anyone@logiflows.test"},
            format="json",
        )
        assert res.status_code == status.HTTP_200_OK
        assert "password reset link" in res.data["message"].lower()
