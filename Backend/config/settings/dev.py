"""Development settings for FinanzasPro."""

from .base import *  # noqa: F401,F403
from .base import env_bool, env_list

DEBUG = env_bool("DJANGO_DEBUG", True)

ALLOWED_HOSTS = env_list(
    "DJANGO_ALLOWED_HOSTS",
    ("localhost", "127.0.0.1", "[::1]"),
)

CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    ("http://localhost:5173", "http://127.0.0.1:5173"),
)

CSRF_TRUSTED_ORIGINS = env_list(
    "CSRF_TRUSTED_ORIGINS",
    ("http://localhost:5173", "http://127.0.0.1:5173"),
)

REFRESH_COOKIE_SECURE = env_bool("REFRESH_COOKIE_SECURE", False)
