import phonenumbers
from rest_framework import serializers
from django.utils.html import strip_tags
from .models import BusinessListing


class BusinessListingSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source="owner.email", read_only=True)

    class Meta:
        model = BusinessListing
        fields = [
            "id",
            "owner_email",
            "business_title",
            "service_detail",
            "phone_number",
            "business_email",
            "location_url",
            "latitude",
            "longitude",
            "city",
            "region",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner_email", "created_at", "updated_at"]

    def validate_business_title(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("Business title must be at least 3 characters.")
        return value

    def validate_service_detail(self, value):
        value = strip_tags(value).strip()
        if len(value) < 20:
            raise serializers.ValidationError(
                "Service detail must be at least 20 characters. Please describe your services clearly."
            )
        if len(value) > 2000:
            raise serializers.ValidationError("Service detail must be 2000 characters or fewer.")
        return value

    def validate_phone_number(self, value):
        try:
            parsed = phonenumbers.parse(value, None)
            if not phonenumbers.is_valid_number(parsed):
                raise serializers.ValidationError(
                    "Invalid phone number. Please use international format, e.g. +977-1-4123456."
                )
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException:
            raise serializers.ValidationError(
                "Could not parse phone number. Include country code, e.g. +977XXXXXXXXX."
            )

    def validate_location_url(self, value):
        allowed_hosts = [
            "maps.google.com",
            "www.google.com",
            "goo.gl",
            "maps.apple.com",
            "www.openstreetmap.org",
            "osm.org",
        ]
        from urllib.parse import urlparse
        cleaned = value.strip()
        parsed = urlparse(cleaned)
        if parsed.scheme != "https":
            raise serializers.ValidationError("Location URL must use HTTPS.")
        if not any(parsed.netloc.endswith(host) for host in allowed_hosts):
            raise serializers.ValidationError(
                "Location URL must be a valid Google Maps, Apple Maps, or OpenStreetMap link."
            )
        return cleaned

    def validate_latitude(self, value):
        if value is None:
            return value
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if value is None:
            return value
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        latitude = attrs.get("latitude", getattr(instance, "latitude", None))
        longitude = attrs.get("longitude", getattr(instance, "longitude", None))
        if (latitude is None) ^ (longitude is None):
            raise serializers.ValidationError("Provide both latitude and longitude, or neither.")
        return attrs


class BusinessListingSearchSerializer(serializers.ModelSerializer):
    """Lightweight serializer for search result listing cards."""
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = BusinessListing
        fields = [
            "id",
            "business_title",
            "service_detail",
            "phone_number",
            "business_email",
            "location_url",
            "distance_km",
            "city",
            "region",
        ]

    def get_distance_km(self, obj):
        distances = self.context.get("distances")
        if not distances:
            return None
        distance = distances.get(str(obj.id))
        if distance is None:
            return None
        return round(distance, 2)
