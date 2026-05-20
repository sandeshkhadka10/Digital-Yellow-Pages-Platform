from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, OTP
from .serializers import RequestOTPSerializer, VerifyOTPSerializer
from .utils import generate_otp, send_otp_email, check_rate_limit


def _request_otp_for_email(email: str) -> Response:
    # Check existing OTP record for rate limiting
    existing = OTP.objects.filter(email=email).first()

    if existing:
        allowed = check_rate_limit(existing)
        if not allowed:
            return Response(
                {"detail": "Too many OTP requests. Please wait 10 minutes before trying again."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        # Save updated rate limit counters then replace the OTP
        request_count = existing.request_count
        window_start = existing.window_start
        existing.delete()
    else:
        request_count = 1
        window_start = timezone.now()

    for _ in range(5):
        otp_code = generate_otp()
        if not OTP.objects.filter(code=otp_code).exists():
            break
    else:
        return Response(
            {"detail": "Failed to generate a unique OTP. Please try again."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    OTP.objects.create(
        email=email,
        code=otp_code,
        request_count=request_count,
        window_start=window_start,
    )

    email_sent = send_otp_email(email, otp_code)

    if not email_sent:
        return Response(
            {"detail": "Failed to send OTP email. Please try again shortly."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response(
        {"detail": "OTP sent successfully. Check your email."},
        status=status.HTTP_200_OK,
    )


class RequestOTPView(APIView):
    """
    POST /api/auth/request-otp/
    Body: { "email": "user@example.com" }

    Signup OTP request. Fails if the user already exists.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "User already exists. Please log in."},
                status=status.HTTP_409_CONFLICT,
            )

        return _request_otp_for_email(email)


class LoginRequestOTPView(APIView):
    """
    POST /api/auth/login/request-otp/
    Body: { "email": "user@example.com" }

    Login OTP request. Fails if the user does not exist.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        if not User.objects.filter(email=email).exists():
            return Response(
                {"detail": "User not found. Please sign up."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return _request_otp_for_email(email)


class VerifyOTPView(APIView):
    """
    POST /api/auth/verify-otp/
    Body: { "otp": "123456" }

    Signup OTP verify. Fails if the user already exists.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        otp_input = serializer.validated_data["otp"]

        matches = list(OTP.objects.filter(code=otp_input)[:2])
        if not matches:
            return Response(
                {"detail": "Invalid OTP. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(matches) > 1:
            return Response(
                {"detail": "OTP is not unique. Please request a new one."},
                status=status.HTTP_409_CONFLICT,
            )

        otp_record = matches[0]

        if User.objects.filter(email=otp_record.email).exists():
            return Response(
                {"detail": "User already exists. Please log in."},
                status=status.HTTP_409_CONFLICT,
            )

        if otp_record.is_locked_out():
            return Response(
                {"detail": "Account locked after too many incorrect attempts. Please request a new OTP."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if otp_record.is_expired():
            otp_record.delete()
            return Response(
                {"detail": "OTP has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # OTP is correct — clean up and authenticate
        otp_record.delete()

        user = User.objects.create_user(email=otp_record.email)
        created = True

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "detail": "Verified successfully.",
                "is_new_user": created,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


class LoginVerifyOTPView(APIView):
    """
    POST /api/auth/login/verify-otp/
    Body: { "otp": "123456" }

    Login OTP verify. Fails if the user does not exist.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        otp_input = serializer.validated_data["otp"]

        matches = list(OTP.objects.filter(code=otp_input)[:2])
        if not matches:
            return Response(
                {"detail": "Invalid OTP. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(matches) > 1:
            return Response(
                {"detail": "OTP is not unique. Please request a new one."},
                status=status.HTTP_409_CONFLICT,
            )

        otp_record = matches[0]

        if not User.objects.filter(email=otp_record.email).exists():
            return Response(
                {"detail": "User not found. Please sign up."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if otp_record.is_locked_out():
            return Response(
                {"detail": "Account locked after too many incorrect attempts. Please request a new OTP."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if otp_record.is_expired():
            otp_record.delete()
            return Response(
                {"detail": "OTP has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_record.delete()

        user = User.objects.get(email=otp_record.email)
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "detail": "Verified successfully.",
                "is_new_user": False,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Client-only logout. Delete stored tokens on the client.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        return Response(
            {"detail": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    """
    GET /api/auth/me/
    Returns the authenticated user's profile.
    """

    def get(self, request):
        user = request.user
        return Response(
            {
                "id": str(user.id),
                "email": user.email,
                "date_joined": user.date_joined,
            }
        )
