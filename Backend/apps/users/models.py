"""Custom user model.

The schema follows docs/backend/database-design.md §4.1. No migration is
generated or applied in phase 1; the table will be created in phase 2 once the
authentication flow is implemented.
"""

import uuid

from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator
from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower

from .managers import UserManager


class User(AbstractUser):
    """Email-based user that owns all financial data."""

    # The product authenticates with email and stores a single full name.
    username = None
    first_name = None
    last_name = None

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(max_length=254, unique=True)
    full_name = models.CharField(
        max_length=150,
        validators=[MinLengthValidator(2)],
    )
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)
    anonymized_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        db_table = "users_user"
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"
        constraints = [
            models.UniqueConstraint(
                Lower("email"),
                name="users_user_email_lower_uniq",
            ),
            models.CheckConstraint(
                check=Q(email=Lower("email")),
                name="users_user_email_lower_check",
            ),
            models.CheckConstraint(
                check=Q(terms_accepted_at__isnull=False) | Q(is_staff=True),
                name="users_user_terms_required",
            ),
            models.CheckConstraint(
                check=Q(anonymized_at__isnull=True) | Q(is_active=False),
                name="users_user_anonymized_inactive",
            ),
            models.CheckConstraint(
                check=Q(anonymized_at__isnull=True)
                | Q(deactivated_at__isnull=False),
                name="users_user_anonymized_deactivated",
            ),
        ]

    def __str__(self) -> str:
        return self.email

    def get_full_name(self) -> str:
        return self.full_name

    def get_short_name(self) -> str:
        return self.full_name.split(maxsplit=1)[0] if self.full_name else ""
