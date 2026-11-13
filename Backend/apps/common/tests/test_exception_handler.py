"""Tests for the centralized API error format."""

from django.test import SimpleTestCase
from rest_framework import exceptions
from rest_framework.test import APIRequestFactory

from apps.common.exception_handler import api_exception_handler


class ExceptionHandlerTests(SimpleTestCase):
    def setUp(self):
        self.request = APIRequestFactory().post("/api/v1/movements/")

    def test_validation_error_uses_contract_shape(self):
        response = api_exception_handler(
            exceptions.ValidationError({"amount": ["El monto debe ser positivo."]}),
            {"request": self.request},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"]["code"], "validation_error")
        self.assertIn("amount", response.data["error"]["details"])
        self.assertTrue(response.data["error"]["request_id"].startswith("req_"))

    def test_missing_authentication_uses_stable_code(self):
        response = api_exception_handler(
            exceptions.NotAuthenticated(),
            {"request": self.request},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.data["error"]["code"],
            "authentication_required",
        )
