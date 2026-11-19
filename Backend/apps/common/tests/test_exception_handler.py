"""Tests for the centralized API error format."""

from django.test import SimpleTestCase
from rest_framework import exceptions, status
from rest_framework.test import APIRequestFactory

from apps.common.exception_handler import api_exception_handler


class IdempotencyKeyRequired(exceptions.APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "idempotency_key_required"


class CsrfFailed(exceptions.PermissionDenied):
    default_code = "csrf_failed"


class DuplicateResource(exceptions.APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "duplicate_resource"


class ExceptionHandlerTests(SimpleTestCase):
    def setUp(self):
        self.request = APIRequestFactory().post("/api/v1/movements/")

    def _handle(self, exc):
        return api_exception_handler(exc, {"request": self.request})

    def test_validation_error_uses_contract_shape(self):
        response = self._handle(
            exceptions.ValidationError(
                {"amount": ["El monto debe ser positivo."]}
            )
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"]["code"], "validation_error")
        self.assertIn("amount", response.data["error"]["details"])
        self.assertTrue(response.data["error"]["request_id"].startswith("req_"))

    def test_missing_authentication_uses_stable_code(self):
        response = self._handle(exceptions.NotAuthenticated())

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.data["error"]["code"],
            "authentication_required",
        )

    def test_specific_400_code_is_preserved(self):
        response = self._handle(IdempotencyKeyRequired())

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["error"]["code"],
            "idempotency_key_required",
        )
        self.assertIn("Idempotency-Key", response.data["error"]["message"])

    def test_specific_403_code_is_preserved(self):
        response = self._handle(CsrfFailed())

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["error"]["code"], "csrf_failed")

    def test_code_kwarg_is_preserved(self):
        response = self._handle(
            exceptions.PermissionDenied("CSRF inválido", code="csrf_failed")
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["error"]["code"], "csrf_failed")

    def test_permission_denied_still_uses_generic_code(self):
        response = self._handle(exceptions.PermissionDenied())

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["error"]["code"], "permission_denied")

    def test_duplicate_resource_preserves_409_code(self):
        response = self._handle(DuplicateResource())

        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.data["error"]["code"],
            "duplicate_resource",
        )

    def test_unhandled_error_does_not_expose_sensitive_details(self):
        with self.assertLogs("apps.common.exception_handler", level="ERROR"):
            response = self._handle(RuntimeError("token=super-secret"))

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data["error"]["code"], "server_error")
        self.assertNotIn("super-secret", str(response.data))
