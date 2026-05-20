import secrets
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP."""
    return str(secrets.randbelow(900000) + 100000)


def send_otp_email(email: str, otp: str) -> bool:
    """
    Send the OTP to the user's email address.
    Returns True on success, False on failure.
    """
    subject = "Your Yellow Pages verification code"
    message = (
        f"Your one-time verification code is: {otp}\n\n"
        f"This code expires in 5 minutes.\n"
        f"If you did not request this, please ignore this email."
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return True
    except Exception as exc:
        logger.error("Failed to send OTP email to %s: %s", email, exc)
        return False


def check_rate_limit(otp_record) -> bool:
    """
    Returns True if the email is within the allowed request rate.
    Resets the window counter if the window has expired.
    """
    now = timezone.now()
    window_seconds = settings.OTP_RATE_LIMIT_WINDOW
    max_requests = settings.OTP_RATE_LIMIT_MAX

    elapsed = (now - otp_record.window_start).total_seconds()

    if elapsed > window_seconds:
        # window expired — reset
        otp_record.window_start = now
        otp_record.request_count = 1
        return True

    if otp_record.request_count >= max_requests:
        return False

    otp_record.request_count += 1
    return True
