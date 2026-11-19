"""Root URL configuration.

All API routes live under /api/v1/. The app-level URL modules are intentionally
empty in phase 1; their endpoints will be added in later phases.
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
