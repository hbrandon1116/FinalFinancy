"""Temporary operational routes.

Remove this URL module when the database health endpoint is retired.
"""

from django.urls import path

from .views import DatabaseHealthView

urlpatterns = [
    path(
        "database/",
        DatabaseHealthView.as_view(),
        name="database-health",
    ),
]
