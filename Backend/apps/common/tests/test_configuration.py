"""Configuration smoke tests that do not require a database connection."""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import SimpleTestCase


class ProjectConfigurationTests(SimpleTestCase):
    def test_custom_user_model_is_configured(self):
        self.assertEqual(settings.AUTH_USER_MODEL, "users.User")
        self.assertEqual(get_user_model()._meta.label, "users.User")

    def test_timezone_and_locale(self):
        self.assertEqual(settings.TIME_ZONE, "America/Bogota")
        self.assertEqual(settings.LANGUAGE_CODE, "es-co")
        self.assertTrue(settings.USE_TZ)

    def test_database_is_postgresql(self):
        self.assertEqual(
            settings.DATABASES["default"]["ENGINE"],
            "django.db.backends.postgresql",
        )

    def test_drf_defaults(self):
        rest_framework = settings.REST_FRAMEWORK
        self.assertIn(
            "rest_framework_simplejwt.authentication.JWTAuthentication",
            rest_framework["DEFAULT_AUTHENTICATION_CLASSES"],
        )
        self.assertIn(
            "rest_framework.permissions.IsAuthenticated",
            rest_framework["DEFAULT_PERMISSION_CLASSES"],
        )
        self.assertEqual(
            rest_framework["EXCEPTION_HANDLER"],
            "apps.common.exception_handler.api_exception_handler",
        )
        self.assertEqual(rest_framework["PAGE_SIZE"], 20)

    def test_cors_allows_idempotency_header(self):
        self.assertTrue(settings.CORS_ALLOW_CREDENTIALS)
        self.assertIn("idempotency-key", settings.CORS_ALLOW_HEADERS)

    def test_jwt_uses_rotation_and_blacklist(self):
        self.assertTrue(settings.SIMPLE_JWT["ROTATE_REFRESH_TOKENS"])
        self.assertTrue(settings.SIMPLE_JWT["BLACKLIST_AFTER_ROTATION"])
        self.assertEqual(settings.SIMPLE_JWT["AUTH_HEADER_TYPES"], ("Bearer",))
