"""Centralized DRF exception handling.

The response shape follows docs/backend/api-contract.md: every error is wrapped
in an ``error`` object with a stable code and an optional ``request_id``.
Validation errors from DRF are normalized to the same shape.
"""

import logging
import uuid
from collections.abc import Mapping

from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)

_MESSAGES = {
    "validation_error": "Los datos enviados no son válidos.",
    "idempotency_key_required": "El header Idempotency-Key es obligatorio.",
    "invalid_idempotency_key": "El header Idempotency-Key no es válido.",
    "reauth_failed": "La contraseña actual no coincide.",
    "authentication_required": "Se requiere autenticación.",
    "invalid_credentials": "Correo o contraseña incorrectos.",
    "invalid_token": "El token no es válido o ha expirado.",
    "permission_denied": "No tiene permiso para realizar esta acción.",
    "csrf_failed": "La verificación CSRF falló.",
    "not_found": "Recurso no encontrado.",
    "method_not_allowed": "Método HTTP no permitido.",
    "duplicate_resource": "Ya existe un recurso con esos datos.",
    "resource_in_use": "El recurso está en uso y no puede modificarse.",
    "archived_goal": "La meta de ahorro está archivada.",
    "idempotency_conflict": (
        "La clave de idempotencia ya fue utilizada con otros datos."
    ),
    "throttled": "Límite de peticiones excedido.",
    "server_error": "Error interno del servidor.",
}


def _request_id(request) -> str:
    request_id = getattr(request, "request_id", None)
    if request_id:
        return str(request_id)
    return f"req_{uuid.uuid4().hex}"


def _declared_error_code(exc: Exception):
    """Return a documented code declared on the detail or class, if any."""
    detail = getattr(exc, "detail", None)
    detail_code = getattr(detail, "code", None)
    if detail_code in _MESSAGES:
        return detail_code

    default_code = getattr(exc, "default_code", None)
    if default_code in _MESSAGES:
        return default_code

    return None


def _error_code(exc: Exception) -> str:
    """Return the contract code declared by the exception when it is known."""
    declared_code = _declared_error_code(exc)
    if declared_code:
        return declared_code

    if isinstance(exc, exceptions.NotAuthenticated):
        return "authentication_required"
    if isinstance(exc, exceptions.AuthenticationFailed):
        return "invalid_token"
    if isinstance(exc, exceptions.PermissionDenied):
        return "permission_denied"
    if isinstance(exc, exceptions.NotFound):
        return "not_found"
    if isinstance(exc, exceptions.MethodNotAllowed):
        return "method_not_allowed"
    if isinstance(exc, exceptions.Throttled):
        return "throttled"
    if isinstance(exc, exceptions.ParseError):
        return "validation_error"
    if isinstance(exc, exceptions.UnsupportedMediaType):
        return "validation_error"
    return getattr(exc, "default_code", None) or "server_error"


def _details(data):
    if data is None:
        return None
    if isinstance(data, Mapping):
        return dict(data)
    if isinstance(data, list):
        return {"non_field_errors": data}
    return {"detail": [str(data)]}


def api_exception_handler(exc, context):
    """Normalize DRF errors and return a controlled 500 for unhandled errors."""
    response = drf_exception_handler(exc, context)
    request = context.get("request")

    if response is None:
        # Only unexpected exceptions reach this branch. Log the traceback for
        # operators, but never return it to the client.
        logger.exception("Unhandled API exception", exc_info=exc)
        code = "server_error"
        payload = {
            "error": {
                "code": code,
                "message": _MESSAGES[code],
                "request_id": _request_id(request),
            }
        }
        return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    code = _error_code(exc)
    if code not in _MESSAGES:
        code = "validation_error" if response.status_code < 500 else "server_error"

    payload = {
        "error": {
            "code": code,
            "message": _MESSAGES[code],
            "request_id": _request_id(request),
        }
    }

    details = _details(response.data)
    if details:
        payload["error"]["details"] = details

    response.data = payload
    return response
