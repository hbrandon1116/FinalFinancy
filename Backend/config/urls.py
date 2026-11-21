"""Root URL configuration.

All API routes live under /api/v1/. Authentication routes are added in phase 1;
the remaining app-level routes are added in later phases.
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.users.urls")),
    path("api/v1/", include("apps.categories.urls")),
    path("api/v1/", include("apps.movements.urls")),
    path("api/v1/", include("apps.budgets.urls")),
    path("api/v1/", include("apps.savings.urls")),
    path("api/v1/", include("apps.analytics.urls")),
]
