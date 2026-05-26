import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MaxLengthValidator


class BusinessListing(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="listings",
    )

    business_title = models.CharField(max_length=100)

    # Rich text / markdown description of services
    service_detail = models.TextField(validators=[MaxLengthValidator(2000)])

    phone_number = models.CharField(max_length=20)

    business_email = models.EmailField()

    # Google Maps / Apple Maps / OSM URL (optional — coordinates now sourced from GPS pin)
    location_url = models.URLField(max_length=500, blank=True, default="")

    # Optional geo fields for radius searches
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    # Optional city/region for text-based geo filtering (MVP approach)
    city = models.CharField(max_length=100, blank=True, default="")
    region = models.CharField(max_length=100, blank=True, default="")

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "business_listings"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["city"]),
            models.Index(fields=["region"]),
            models.Index(fields=["is_active"]),
            models.Index(
                fields=["latitude", "longitude"], name="business_li_lat_lon_idx"
            ),
        ]

    def __str__(self):
        return self.business_title
