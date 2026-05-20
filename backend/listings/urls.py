from django.urls import path
from .views import ListingListCreateView, ListingDetailView, SearchView

urlpatterns = [
    path("", ListingListCreateView.as_view(), name="listing-list-create"),
    path("<uuid:pk>/", ListingDetailView.as_view(), name="listing-detail"),
    path("search/", SearchView.as_view(), name="listing-search"),
]
