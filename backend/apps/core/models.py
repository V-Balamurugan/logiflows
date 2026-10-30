import uuid
from django.db import models


class UUIDModel(models.Model):
    """
    Abstract base model that uses a UUIDv4 as primary key.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class TimeStampedModel(models.Model):
    """
    Abstract base model that provides self-updating created_at and updated_at fields.
    """
    created_at = models.DateTimeField('created at', auto_now_add=True)
    updated_at = models.DateTimeField('updated at', auto_now=True)

    class Meta:
        abstract = True


class BaseModel(UUIDModel, TimeStampedModel):
    """
    Combined abstract base model with UUID primary key and timestamp audit fields.
    """
    class Meta:
        abstract = True
