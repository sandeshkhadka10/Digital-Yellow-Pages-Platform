from django.urls import path
from .views import (
    ListingListCreateView,
    ListingDetailView,
    SearchView,
    PublicListingListView,
)

urlpatterns = [
    path("", ListingListCreateView.as_view(), name="listing-list-create"),
    path("public/", PublicListingListView.as_view(), name="listing-public-list"),
    path("<uuid:pk>/", ListingDetailView.as_view(), name="listing-detail"),
    path("search/", SearchView.as_view(), name="listing-search"),
]
