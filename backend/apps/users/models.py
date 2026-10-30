from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Minimal custom user model for LogiFlows inheriting from AbstractUser.
    Established in Phase 0 prior to applying database migrations to ensure
    future extensibility and prevent breaking foreign key replacements.
    No extra business fields or auth flows are introduced during Phase 0.
    """

    class Meta:
        db_table = 'logiflows_users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.username
