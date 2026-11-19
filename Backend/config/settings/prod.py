"""Production settings for FinanzasPro.

This module is intentionally conservative. It does not contain secret values;
they must be provided through environment variables. Startup fails when a
production-critical setting is missing or unsafe.
"""

import os
from urllib.parse import urlsplit

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403
from .base import env_bool, env_int, env_list

_MIN_SECRET_KEY_LENGTH = 32
_PLACEHOLDER_SECRET_KEY_FRAGMENTS = (
    "change-me",
    "changeme",
    "django-insecure",
    "example",
    "insecure",
    "placeholder",
    "replace-with",
    "your-secret",
)


def _required_env(name: str) -> str:
    """Return a required non-empty environment value without logging it."""
    value = os.getenv(name)
    if value is None or not value.strip():
        raise ImproperlyConfigured(f"{name} es obligatoria en producción.")
    return value.strip()


def _validate_secret_key(value: str) -> None:
    if len(value) < _MIN_SECRET_KEY_LENGTH:
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY debe tener al menos "
            f"{_MIN_SECRET_KEY_LENGTH} caracteres en producción."
        )

    normalized = value.casefold()
    if any(
        fragment in normalized
        for fragment in _PLACEHOLDER_SECRET_KEY_FRAGMENTS
    ):
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY no puede contener valores de ejemplo o "
            "placeholder en producción."
        )


def _validate_database_url(value: str) -> None:
    try:
        parsed = urlsplit(value)
        hostname = parsed.hostname
    except ValueError as exc:
        raise ImproperlyConfigured(
            "DATABASE_URL no tiene un formato válido para PostgreSQL."
        ) from exc

    if parsed.scheme.casefold() not in {"postgres", "postgresql"}:
        raise ImproperlyConfigured(
            "DATABASE_URL debe usar el esquema postgresql:// o postgres:// "
            "en producción."
        )

    if not parsed.netloc or not hostname or not parsed.path.strip("/"):
        raise ImproperlyConfigured(
            "DATABASE_URL debe incluir host y nombre de base de datos "
            "PostgreSQL."
        )


def _validate_origins(name: str, origins: list[str]) -> None:
    if not origins:
        raise ImproperlyConfigured(
            f"{name} debe contener al menos un origen en producción."
        )

    for origin in origins:
        if not origin or "*" in origin:
            raise ImproperlyConfigured(
                f"{name} no admite comodines en producción."
            )

        try:
            parsed = urlsplit(origin)
        except ValueError as exc:
            raise ImproperlyConfigured(
                f"{name} contiene un origen con formato inválido."
            ) from exc

        if (
            parsed.scheme.casefold() not in {"http", "https"}
            or not parsed.netloc
            or parsed.path
            or parsed.query
            or parsed.fragment
            or parsed.username
            or parsed.password
        ):
            raise ImproperlyConfigured(
                f"{name} debe contener orígenes esquema://host[:puerto], "
                "sin rutas, credenciales ni comodines."
            )


_secret_key = _required_env("DJANGO_SECRET_KEY")
_validate_secret_key(_secret_key)

_database_url = _required_env("DATABASE_URL")
_validate_database_url(_database_url)

if DATABASES["default"].get("ENGINE") != "django.db.backends.postgresql":
    raise ImproperlyConfigured(
        "La base de datos de producción debe usar el backend PostgreSQL."
    )

if not ALLOWED_HOSTS:
    raise ImproperlyConfigured(
        "DJANGO_ALLOWED_HOSTS debe contener al menos un host en producción."
    )

DEBUG = False

SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = env_int("SECURE_HSTS_SECONDS", 31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
REFRESH_COOKIE_SECURE = env_bool("REFRESH_COOKIE_SECURE", True)

CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")

_validate_origins("CORS_ALLOWED_ORIGINS", CORS_ALLOWED_ORIGINS)
_validate_origins("CSRF_TRUSTED_ORIGINS", CSRF_TRUSTED_ORIGINS)
