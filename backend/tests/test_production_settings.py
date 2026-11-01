import os
import importlib
import pytest
from django.core.exceptions import ImproperlyConfigured


class TestProductionSettingsFailFast:
    """
    Gate Item A1 & A2: Verify production settings fail fast on missing/default credentials,
    and that production OpenAPI documentation omits development credentials.
    """

    def test_missing_secret_key_raises_improperly_configured(self, monkeypatch):
        monkeypatch.delenv('DJANGO_SECRET_KEY', raising=False)
        monkeypatch.setenv('POSTGRES_DB', 'prod_db')
        monkeypatch.setenv('POSTGRES_USER', 'prod_user')
        monkeypatch.setenv('POSTGRES_PASSWORD', 'prod_secure_password_987!')

        with pytest.raises(ImproperlyConfigured) as exc_info:
            import config.settings.production
            importlib.reload(config.settings.production)

        assert 'DJANGO_SECRET_KEY' in str(exc_info.value)

    def test_insecure_dev_secret_key_in_production_raises_improperly_configured(self, monkeypatch):
        monkeypatch.setenv('DJANGO_SECRET_KEY', 'django-insecure-dev-key-logiflows-platform-2026')
        monkeypatch.setenv('POSTGRES_DB', 'prod_db')
        monkeypatch.setenv('POSTGRES_USER', 'prod_user')
        monkeypatch.setenv('POSTGRES_PASSWORD', 'prod_secure_password_987!')

        with pytest.raises(ImproperlyConfigured) as exc_info:
            import config.settings.production
            importlib.reload(config.settings.production)

        assert 'DJANGO_SECRET_KEY' in str(exc_info.value)

    def test_missing_postgres_credentials_raises_improperly_configured(self, monkeypatch):
        monkeypatch.setenv('DJANGO_SECRET_KEY', 'valid-prod-secret-key-at-least-32-chars-long!')
        monkeypatch.delenv('POSTGRES_DB', raising=False)

        with pytest.raises(ImproperlyConfigured) as exc_info:
            import config.settings.production
            importlib.reload(config.settings.production)

        assert 'POSTGRES_DB' in str(exc_info.value)

    def test_insecure_postgres_password_raises_improperly_configured(self, monkeypatch):
        monkeypatch.setenv('DJANGO_SECRET_KEY', 'valid-prod-secret-key-at-least-32-chars-long!')
        monkeypatch.setenv('POSTGRES_DB', 'prod_db')
        monkeypatch.setenv('POSTGRES_USER', 'prod_user')
        monkeypatch.setenv('POSTGRES_PASSWORD', 'logiflows_dev_password_2026')

        with pytest.raises(ImproperlyConfigured) as exc_info:
            import config.settings.production
            importlib.reload(config.settings.production)

        assert 'POSTGRES_PASSWORD' in str(exc_info.value)

    def test_valid_production_settings_load_successfully_and_gate_demo_credentials(self, monkeypatch):
        monkeypatch.setenv('DJANGO_SECRET_KEY', 'valid-prod-secret-key-at-least-32-chars-long!')
        monkeypatch.setenv('POSTGRES_DB', 'prod_db')
        monkeypatch.setenv('POSTGRES_USER', 'prod_user')
        monkeypatch.setenv('POSTGRES_PASSWORD', 'prod_secure_password_987!')

        import config.settings.production
        prod_settings = importlib.reload(config.settings.production)

        assert prod_settings.DEBUG is False
        assert prod_settings.ENVIRONMENT == 'production'

        # Gate Item A2: Verify demo credentials are absent from OpenAPI description
        description = prod_settings.SPECTACULAR_SETTINGS.get('DESCRIPTION', '')
        assert 'LogiFlowsDev2026!' not in description
        assert 'alex.mercer@logiflows.admin' not in description
        assert 'Sample Personas for One-Click Testing' not in description
