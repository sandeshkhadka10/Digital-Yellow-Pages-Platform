from rest_framework import serializers
from django.core.validators import EmailValidator


class RequestOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(validators=[EmailValidator()])

    def validate_email(self, value):
        return value.lower().strip()


class VerifyOTPSerializer(serializers.Serializer):
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP must be 6 digits.")
        return value
