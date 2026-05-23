from django.db.models import Q
from math import radians, cos, sin, asin, sqrt
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination

from .models import BusinessListing
from .serializers import BusinessListingSerializer, BusinessListingSearchSerializer


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# ── Public feed ───────────────────────────────────────────────────────────────


class PublicListingListView(APIView):
    """
    GET /api/listings/public/  — paginated list of all active listings (no auth required)
    """

    permission_classes = [AllowAny]

    def get(self, request):
        listings = BusinessListing.objects.filter(is_active=True)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(listings, request)
        serializer = BusinessListingSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


def haversine_km(lat1, lon1, lat2, lon2):
    # Great-circle distance in kilometers.
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return 6371.0 * c


# ── Listing CRUD ──────────────────────────────────────────────────────────────


class ListingListCreateView(APIView):
    """
    GET  /api/listings/          — list the authenticated user's own listings
    POST /api/listings/          — create a new business listing
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        listings = BusinessListing.objects.filter(owner=request.user, is_active=True)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(listings, request)
        serializer = BusinessListingSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = BusinessListingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(owner=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ListingDetailView(APIView):
    """
    GET    /api/listings/<id>/   — retrieve a single listing (public)
    PUT    /api/listings/<id>/   — update a listing (owner only)
    DELETE /api/listings/<id>/   — soft-delete a listing (owner only)
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_object(self, pk, user=None):
        try:
            listing = BusinessListing.objects.get(pk=pk, is_active=True)
        except BusinessListing.DoesNotExist:
            return None
        if user and listing.owner != user:
            return "forbidden"
        return listing

    def get(self, request, pk):
        listing = BusinessListing.objects.filter(pk=pk, is_active=True).first()
        if not listing:
            return Response(
                {"detail": "Listing not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = BusinessListingSerializer(listing)
        return Response(serializer.data)

    def put(self, request, pk):
        listing = self.get_object(pk, user=request.user)
        if listing is None:
            return Response(
                {"detail": "Listing not found."}, status=status.HTTP_404_NOT_FOUND
            )
        if listing == "forbidden":
            return Response(
                {"detail": "You do not own this listing."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = BusinessListingSerializer(listing, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        listing = self.get_object(pk, user=request.user)
        if listing is None:
            return Response(
                {"detail": "Listing not found."}, status=status.HTTP_404_NOT_FOUND
            )
        if listing == "forbidden":
            return Response(
                {"detail": "You do not own this listing."},
                status=status.HTTP_403_FORBIDDEN,
            )

        listing.is_active = False
        listing.save(update_fields=["is_active"])
        return Response({"detail": "Listing removed."}, status=status.HTTP_200_OK)


# ── Search ────────────────────────────────────────────────────────────────────


class SearchView(APIView):
    """
    GET /api/listings/search/?q=plumber&city=Kathmandu&region=Bagmati

    Parameters:
        q       — keyword(s) matched against business_title and service_detail
        city    — optional city filter (case-insensitive)
        region  — optional region filter (case-insensitive)
        lat     — latitude for GPS search
        lng     — longitude for GPS search
        radius_km — radius in kilometers for GPS search

    Results are filtered to active listings only and ordered by newest first.
    Full-text search uses Django ORM icontains which maps to SQLite LIKE.
    For production with PostgreSQL, swap to SearchVector/SearchQuery for FTS.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        city = request.query_params.get("city", "").strip()
        region = request.query_params.get("region", "").strip()
        lat_param = request.query_params.get("lat")
        lng_param = request.query_params.get("lng")
        radius_param = request.query_params.get("radius_km")

        lat = None
        lng = None
        radius_km = None

        if lat_param or lng_param or radius_param:
            if not (lat_param and lng_param):
                return Response(
                    {"detail": "Provide both lat and lng when using GPS search."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not radius_param:
                return Response(
                    {"detail": "Provide radius_km when using GPS search."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                lat = float(lat_param)
                lng = float(lng_param)
                radius_km = float(radius_param)
            except ValueError:
                return Response(
                    {"detail": "lat, lng, and radius_km must be valid numbers."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if lat < -90 or lat > 90 or lng < -180 or lng > 180:
                return Response(
                    {
                        "detail": "lat must be between -90 and 90, lng between -180 and 180."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if radius_km <= 0:
                return Response(
                    {"detail": "radius_km must be greater than 0."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if not query and not city and not region and lat is None:
            return Response(
                {"detail": "Provide at least one of: q, city, region, or lat/lng."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        listings = BusinessListing.objects.filter(is_active=True)

        # Keyword search across title + service detail
        if query:
            listings = listings.filter(
                Q(business_title__icontains=query) | Q(service_detail__icontains=query)
            )

        # Location filters
        if city:
            listings = listings.filter(city__icontains=city)

        if region:
            listings = listings.filter(region__icontains=region)

        distances = None

        if lat is not None:
            lat_delta = radius_km / 111.0
            lng_divisor = max(0.000001, 111.0 * cos(radians(lat)))
            lng_delta = radius_km / lng_divisor

            listings = listings.filter(
                latitude__isnull=False,
                longitude__isnull=False,
                latitude__gte=lat - lat_delta,
                latitude__lte=lat + lat_delta,
                longitude__gte=lng - lng_delta,
                longitude__lte=lng + lng_delta,
            )

            distances = {}
            filtered = []
            for listing in listings:
                distance = haversine_km(lat, lng, listing.latitude, listing.longitude)
                if distance <= radius_km:
                    distances[str(listing.id)] = distance
                    filtered.append(listing)

            filtered.sort(key=lambda item: distances[str(item.id)])
            listings = filtered

        if isinstance(listings, list):
            ordered_listings = listings
        else:
            ordered_listings = listings.order_by("-created_at")

        paginator = StandardPagination()
        page = paginator.paginate_queryset(ordered_listings, request)
        serializer = BusinessListingSearchSerializer(
            page,
            many=True,
            context={"distances": distances},
        )
        return paginator.get_paginated_response(serializer.data)
