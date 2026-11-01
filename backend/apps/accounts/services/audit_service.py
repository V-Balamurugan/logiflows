import logging
from typing import Any, Dict, Optional
from django.http import HttpRequest
from apps.accounts.models import AuditLog, User

logger = logging.getLogger('apps.accounts.audit')


def get_client_ip(request: Optional[HttpRequest]) -> Optional[str]:
    """Extract client IP address from HttpRequest considering proxies."""
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
        return ip
    return request.META.get('REMOTE_ADDR')


def get_client_user_agent(request: Optional[HttpRequest]) -> str:
    """Extract User-Agent string from HttpRequest."""
    if not request:
        return ''
    return request.META.get('HTTP_USER_AGENT', '')[:500]


def log_audit_event(
    action: str,
    actor: Optional[User] = None,
    actor_email: Optional[str] = None,
    target_type: str = '',
    target_id: str = '',
    ip_address: Optional[str] = None,
    user_agent: str = '',
    metadata: Optional[Dict[str, Any]] = None,
    request: Optional[HttpRequest] = None,
) -> AuditLog:
    """
    Persist an immutable audit log record for security and compliance.
    Safe against exceptions to avoid failing primary user operations if logging fails.
    """
    if request:
        if not ip_address:
            ip_address = get_client_ip(request)
        if not user_agent:
            user_agent = get_client_user_agent(request)
        if not actor and hasattr(request, 'user') and request.user.is_authenticated:
            actor = request.user

    email = actor_email or (actor.email if actor else '')

    try:
        log_entry = AuditLog.objects.create(
            actor=actor,
            actor_email=email,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            ip_address=ip_address,
            user_agent=user_agent or '',
            metadata=metadata or {},
        )
        logger.info(f'AuditLog [{action}]: actor={email} target={target_type}:{target_id} ip={ip_address}')
        return log_entry
    except Exception as exc:
        logger.exception(f'Failed to record AuditLog entry [{action}]: {exc}')
        raise exc
