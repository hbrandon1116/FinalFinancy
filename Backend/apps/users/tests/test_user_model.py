"""Custom user model tests that do not touch the database."""

from django.test import SimpleTestCase

from apps.users.models import User


class UserModelTests(SimpleTestCase):
    def test_email_is_the_login_field(self):
        self.assertEqual(User.USERNAME_FIELD, "email")
        self.assertEqual(User.REQUIRED_FIELDS, ["full_name"])

    def test_manager_normalizes_email(self):
        self.assertEqual(
            User.objects.normalize_email("  Persona@Example.COM  "),
            "persona@example.com",
        )

    def test_short_name_uses_first_name(self):
        user = User(email="persona@example.com", full_name="Ana María Pérez")
        self.assertEqual(user.get_short_name(), "Ana")
        self.assertEqual(user.get_full_name(), "Ana María Pérez")
