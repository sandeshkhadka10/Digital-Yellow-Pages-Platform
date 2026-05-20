from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RequestOTPView,
    VerifyOTPView,
    LoginRequestOTPView,
    LoginVerifyOTPView,
    LogoutView,
    MeView,
)

urlpatterns = [
    path("request-otp/", RequestOTPView.as_view(), name="request-otp"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("login/request-otp/", LoginRequestOTPView.as_view(), name="login-request-otp"),
    path("login/verify-otp/", LoginVerifyOTPView.as_view(), name="login-verify-otp"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
]
