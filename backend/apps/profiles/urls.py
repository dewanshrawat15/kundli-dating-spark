from django.urls import path
from .views import ProfileMeView, OnboardingView, ProfilePhotoView, ProfilePhotoDeleteView

urlpatterns = [
    path("me/", ProfileMeView.as_view(), name="profile-me"),
    path("me/onboarding/", OnboardingView.as_view(), name="profile-onboarding"),
    path("photos/", ProfilePhotoView.as_view(), name="profile-photos"),
    path("photos/<uuid:photo_id>/", ProfilePhotoDeleteView.as_view(), name="profile-photo-delete"),
]
