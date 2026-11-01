import logging
from typing import Tuple, Optional
from django.db import transaction
from django.utils import timezone
from apps.accounts.models import AccountToken, AccountTokenType, User

logger = logging.getLogger('apps.accounts.tokens')


class TokenExpiredOrInvalid(Exception):
    """Raised when token cannot be resolved, has expired, or was already consumed."""
    pass


def create_account_token(
    user: User,
    token_type: str,
    lifetime_hours: int = 24,
) -> Tuple[str, AccountToken]:
    """
    Generate a cryptographic single-use token and store its SHA-256 digest in DB.
    Invalidates any previous unused tokens of the same type for this user.
    Returns:
        (raw_token_string, token_instance)
    """
    # Invalidate previous unconsumed tokens of the same type
    AccountToken.objects.filter(
        user=user,
        token_type=token_type,
        is_used=False,
    ).update(is_used=True, used_at=timezone.now())

    raw_token, token_instance = AccountToken.create_token(
        user=user,
        token_type=token_type,
        lifetime_hours=lifetime_hours,
    )
    logger.debug(f'Issued {token_type} token for user {user.email}')
    return raw_token, token_instance


def validate_and_consume_token(
    raw_token: str,
    token_type: str,
) -> User:
    """
    Validate token signature/hash, ensure non-expiration and non-use,
    and atomically mark as consumed in a database transaction with select_for_update.
    Returns:
        User associated with the token.
    Raises:
        TokenExpiredOrInvalid
    """
    if not raw_token or not raw_token.strip():
        raise TokenExpiredOrInvalid('Token must not be empty.')

    token_hash = AccountToken.hash_token(raw_token.strip())

    with transaction.atomic():
        try:
            token_record = (
                AccountToken.objects.select_for_update()
                .select_related('user')
                .get(token_hash=token_hash, token_type=token_type)
            )
        except AccountToken.DoesNotExist:
            logger.warning(f'Token validation failed: hash not found for type {token_type}')
            raise TokenExpiredOrInvalid('Activation or reset link is invalid or expired.')

        if token_record.is_used:
            logger.warning(f'Token validation failed: token {token_record.id} already used')
            raise TokenExpiredOrInvalid('This link has already been used.')

        if timezone.now() >= token_record.expires_at:
            logger.warning(f'Token validation failed: token {token_record.id} expired at {token_record.expires_at}')
            raise TokenExpiredOrInvalid('This link has expired. Please request a new one.')

        token_record.mark_as_used()
        return token_record.user
