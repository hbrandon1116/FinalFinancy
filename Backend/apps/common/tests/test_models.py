"""Tests for the shared abstract model bases."""

import uuid

from django.test import SimpleTestCase

from apps.common.models import BaseModel, TimeStampedModel, UUIDModel


class AbstractModelTests(SimpleTestCase):
    def test_uuid_model_is_abstract_and_uses_uuid_primary_key(self):
        self.assertTrue(UUIDModel._meta.abstract)

        field = UUIDModel._meta.get_field("id")
        self.assertTrue(field.primary_key)
        self.assertFalse(field.editable)
        self.assertIs(field.default, uuid.uuid4)

    def test_time_stamped_model_is_abstract_with_audit_timestamps(self):
        self.assertTrue(TimeStampedModel._meta.abstract)

        created_at = TimeStampedModel._meta.get_field("created_at")
        updated_at = TimeStampedModel._meta.get_field("updated_at")
        self.assertTrue(created_at.auto_now_add)
        self.assertTrue(updated_at.auto_now)

    def test_base_model_combines_both_behaviours(self):
        self.assertTrue(BaseModel._meta.abstract)
        self.assertTrue(issubclass(BaseModel, UUIDModel))
        self.assertTrue(issubclass(BaseModel, TimeStampedModel))

        field_names = {field.name for field in BaseModel._meta.fields}
        self.assertTrue({"id", "created_at", "updated_at"} <= field_names)
