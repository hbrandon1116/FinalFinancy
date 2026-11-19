"""Custom user model tests that do not touch the database."""

from unittest.mock import patch

from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from apps.users.models import User

FULL_NAME_CONSTRAINT = "users_user_full_name_valid"


class UserModelTests(SimpleTestCase):
    def _full_name_constraint(self):
        return next(
            constraint
            for constraint in User._meta.constraints
            if constraint.name == FULL_NAME_CONSTRAINT
        )

    def _assert_full_name_clean_rejected(self, value):
        user = User(email="persona@example.com", full_name=value)
        with self.assertRaises(ValidationError):
            user.clean()

    def test_full_name_constraint_is_declared_at_database_level(self):
        condition = repr(self._full_name_constraint().condition)

        self.assertIn("full_name__isnull", condition)
        self.assertIn("full_name__regex", condition)

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

    def test_full_name_clean_accepts_valid_value(self):
        user = User(email="persona@example.com", full_name="Ana")
        user.clean()
        self.assertEqual(user.full_name, "Ana")

    def test_full_name_clean_rejects_null(self):
        self._assert_full_name_clean_rejected(None)

    def test_full_name_clean_rejects_empty_value(self):
        self._assert_full_name_clean_rejected("")

    def test_full_name_clean_rejects_one_character(self):
        self._assert_full_name_clean_rejected("A")

    def test_full_name_clean_rejects_whitespace_only(self):
        self._assert_full_name_clean_rejected("   ")

    def test_clean_strips_full_name(self):
        user = User(email="persona@example.com", full_name="  Ana María  ")
        user.clean()
        self.assertEqual(user.full_name, "Ana María")

    def test_clean_rejects_one_character_after_stripping(self):
        user = User(email="persona@example.com", full_name="  A  ")
        with self.assertRaises(ValidationError):
            user.clean()

    def test_save_strips_full_name(self):
        user = User(email="persona@example.com", full_name="  Ana María  ")

        with patch("django.db.models.Model.save") as save_mock:
            user.save()

        self.assertEqual(user.full_name, "Ana María")
        save_mock.assert_called_once()
