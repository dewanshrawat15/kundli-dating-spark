from django.urls import path
from .views import MatchListView, MatchDecideView, MatchDetailView

urlpatterns = [
    path("", MatchListView.as_view(), name="match-list"),
    path("<uuid:profile_id>/", MatchDetailView.as_view(), name="match-detail"),
    path("<uuid:profile_id>/decide/", MatchDecideView.as_view(), name="match-decide"),
]
