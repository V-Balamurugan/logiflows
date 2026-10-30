import logging
from django.conf import settings
from django.core.mail import send_mail
from apps.accounts.models import User

logger = logging.getLogger('apps.accounts.email')


def send_activation_email(user: User, raw_token: str) -> None:
    """
    Send account activation email with single-use verification link.
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    activation_url = f'{frontend_url}/activate?token={raw_token}'

    subject = 'Activate Your LogiFlows Account'
    message = (
        f'Hello {user.full_name or user.email},\n\n'
        f'Welcome to LogiFlows! Please activate your account by clicking the link below:\n\n'
        f'{activation_url}\n\n'
        f'This link is valid for 24 hours. If you did not create an account, please ignore this email.\n\n'
        f'Best regards,\nLogiFlows Team'
    )
    html_message = (
        f'<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">'
        f'<h2 style="color: #0f172a;">Welcome to LogiFlows</h2>'
        f'<p>Hello <strong>{user.full_name or user.email}</strong>,</p>'
        f'<p>Thank you for registering with LogiFlows. Please activate your account to begin managing your postal and logistics delivery workflows.</p>'
        f'<div style="margin: 32px 0;">'
        f'<a href="{activation_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Activate Account</a>'
        f'</div>'
        f'<p style="font-size: 14px; color: #64748b;">Or copy and paste this URL into your browser:<br/><a href="{activation_url}" style="color: #2563eb;">{activation_url}</a></p>'
        f'<p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">This link will expire in 24 hours. If you did not register, please disregard this email.</p>'
        f'</div>'
    )

    send_mail(
        subject=subject,
        message=message,
        html_message=html_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    logger.info(f'Activation email sent successfully to {user.email}')


def send_password_reset_email(user: User, raw_token: str) -> None:
    """
    Send password reset email containing single-use secure reset link.
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    reset_url = f'{frontend_url}/reset-password?token={raw_token}'

    subject = 'Reset Your LogiFlows Password'
    message = (
        f'Hello {user.full_name or user.email},\n\n'
        f'A password reset was requested for your LogiFlows account. Click the link below to set a new password:\n\n'
        f'{reset_url}\n\n'
        f'This link is valid for 24 hours. If you did not request a password reset, you can safely ignore this email.\n\n'
        f'Best regards,\nLogiFlows Team'
    )
    html_message = (
        f'<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">'
        f'<h2 style="color: #0f172a;">Password Reset Request</h2>'
        f'<p>Hello <strong>{user.full_name or user.email}</strong>,</p>'
        f'<p>We received a request to reset your LogiFlows account password. Click the button below to choose a new password:</p>'
        f'<div style="margin: 32px 0;">'
        f'<a href="{reset_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>'
        f'</div>'
        f'<p style="font-size: 14px; color: #64748b;">Or copy and paste this URL into your browser:<br/><a href="{reset_url}" style="color: #2563eb;">{reset_url}</a></p>'
        f'<p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">This link will expire in 24 hours. If you did not request this reset, your account is secure and no further action is required.</p>'
        f'</div>'
    )

    send_mail(
        subject=subject,
        message=message,
        html_message=html_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    logger.info(f'Password reset email sent successfully to {user.email}')
