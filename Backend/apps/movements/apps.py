"""Application configuration for the movements app."""

from django.apps import AppConfig


class MovementsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.movements"
    label = "movements"
    verbose_name = "Movimientos"
