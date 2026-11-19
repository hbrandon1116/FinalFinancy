"""Tests for the temporary database health endpoint.

The database connection is mocked. These tests do not require PostgreSQL and do
not execute migrations or queries against a real database.
"""

from unittest.mock import patch

from django.db.utils import OperationalError
from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIClient

URL = "/api/v1/health/database/"
TOKEN = "test-database-health-token"
HEADER = "HTTP_X_DATABASE_HEALTH_TOKEN"


class DatabaseHealthViewTests(SimpleTestCase):
    def setUp(self):
        self.client = APIClient()

    @override_settings(DATABASE_HEALTH_TOKEN=TOKEN)
    @patch("apps.common.views.connection")
    def test_successful_check_returns_200(self, mock_connection):
        cursor = mock_connection.cursor.return_value.__enter__.return_value
        cursor.fetchone.return_value = (1,)

        response = self.client.get(URL, **{HEADER: TOKEN})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": "ok", "database": "ok"},
        )
        cursor.execute.assert_called_once_with("SELECT 1")
        self.assertNotIn(TOKEN, response.content.decode())

    @override_settings(DATABASE_HEALTH_TOKEN=TOKEN)
    @patch("apps.common.views.connection")
    def test_database_failure_returns_503_without_internal_details(
        self,
        mock_connection,
    ):
        mock_connection.cursor.side_effect = OperationalError(
            "postgresql://user:password@example.test/database unavailable"
        )

        response = self.client.get(URL, **{HEADER: TOKEN})
        body = response.content.decode().lower()

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json(),
            {"status": "error", "database": "unavailable"},
        )
        self.assertNotIn("postgresql", body)
        self.assertNotIn("password", body)
        self.assertNotIn("operationalerror", body)
        self.assertNotIn(TOKEN.lower(), body)

    @override_settings(DATABASE_HEALTH_TOKEN=TOKEN)
    @patch("apps.common.views.connection")
    def test_unexpected_result_returns_503(self, mock_connection):
        cursor = mock_connection.cursor.return_value.__enter__.return_value
        cursor.fetchone.return_value = None

        response = self.client.get(URL, **{HEADER: TOKEN})

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json(),
            {"status": "error", "database": "unavailable"},
        )

    @override_settings(DATABASE_HEALTH_TOKEN="")
    @patch("apps.common.views.connection")
    def test_endpoint_is_disabled_without_configured_token(
        self,
        mock_connection,
    ):
        response = self.client.get(URL, **{HEADER: TOKEN})

        self.assertEqual(response.status_code, 404)
        mock_connection.cursor.assert_not_called()

    @override_settings(DATABASE_HEALTH_TOKEN=TOKEN)
    @patch("apps.common.views.connection")
    def test_missing_header_returns_401(self, mock_connection):
        response = self.client.get(URL)

        self.assertEqual(response.status_code, 401)
        mock_connection.cursor.assert_not_called()

    @override_settings(DATABASE_HEALTH_TOKEN=TOKEN)
    @patch("apps.common.views.connection")
    def test_wrong_token_returns_401(self, mock_connection):
        response = self.client.get(URL, **{HEADER: "wrong-token"})

        self.assertEqual(response.status_code, 401)
        mock_connection.cursor.assert_not_called()
