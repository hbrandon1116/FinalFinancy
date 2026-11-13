"""Isolated settings for automated tests.

Tests are expected to use PostgreSQL, as in development and production. The
database name is overridden by Django's test runner, so test data never touches
the development database.

The guard prevents Django's test discovery from applying these overrides when
this file is merely imported as a ``test*.py`` module.
"""

import os

from .base import *  # noqa: F401,F403

if os.getenv("DJANGO_SETTINGS_MODULE") == "config.settings.test":
    DEBUG = False
    ALLOWED_HOSTS = ["testserver", "localhost", "127.0.0.1"]

    PASSWORD_HASHERS = [
        "django.contrib.auth.hashers.MD5PasswordHasher",
    ]

    # Preserve Django's defaults for the nested TEST dictionary; replacing it
    # would remove keys such as MIRROR that the test runner expects.
    test_database = DATABASES["default"].setdefault("TEST", {})
    test_database["NAME"] = os.getenv("TEST_DATABASE_NAME", "test_finanzaspro")
