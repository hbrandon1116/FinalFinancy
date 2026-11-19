"""Temporary operational endpoints.

This module only contains the database connectivity check used to validate the
Render/Supabase deployment. Remove it when the temporary endpoint is retired.
"""

import hmac
import logging

from django.conf import settings
from django.db import connection
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

DATABASE_HEALTH_TOKEN_HEADER = "X-Database-Health-Token"


class DatabaseHealthView(APIView):
    """Protected, non-sensitive check that PostgreSQL answers SELECT 1.

    The endpoint is disabled when DATABASE_HEALTH_TOKEN is not configured.
    Missing or wrong tokens return 401. Database failures return a generic 503;
    no exception text, URL, username, host or password is exposed.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        configured_token = getattr(settings, "DATABASE_HEALTH_TOKEN", "")
        if not configured_token:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        provided_token = request.headers.get(DATABASE_HEALTH_TOKEN_HEADER, "")
        if not provided_token or not hmac.compare_digest(
            provided_token,
            configured_token,
        ):
            return Response(
                {"detail": "No autorizado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            # Creating the cursor opens the real Django database connection.
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
        except Exception as exc:  # noqa: BLE001 - do not leak database details
            # Log only the exception class; never log the connection string.
            logger.warning(
                "Database health check failed: %s",
                type(exc).__name__,
            )
            return Response(
                {"status": "error", "database": "unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if not result or result[0] != 1:
            logger.warning(
                "Database health check returned an unexpected result."
            )
            return Response(
                {"status": "error", "database": "unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {"status": "ok", "database": "ok"},
            status=status.HTTP_200_OK,
        )
