from rest_framework import serializers
from .models import Profile, ProfileImage


class ProfileImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProfileImage
        fields = ("id", "url", "order", "is_primary", "uploaded_at")
        read_only_fields = fields

    def get_url(self, obj):
        return obj.get_url()


class ProfileSerializer(serializers.ModelSerializer):
    images = ProfileImageSerializer(many=True, read_only=True)
    age = serializers.IntegerField(read_only=True)
    email = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = (
            "user_id", "name", "age", "email",
            "date_of_birth", "time_of_birth", "place_of_birth",
            "birth_lat", "birth_lng",
            "current_city", "current_lat", "current_lng",
            "bio", "sexual_orientation", "dating_preference",
            "religion", "caste", "mother_tongue", "marital_status",
            "min_age_preference", "max_age_preference", "max_distance_km",
            "images", "created_at", "updated_at",
        )
        read_only_fields = ("user_id", "age", "email", "created_at", "updated_at")

    def get_email(self, obj):
        return obj.user.email


class OnboardingSerializer(serializers.ModelSerializer):
    """Used for POST /api/profile/me/onboarding/ — creates/updates profile and marks onboarding complete."""

    class Meta:
        model = Profile
        fields = (
            "name",
            "date_of_birth", "time_of_birth", "place_of_birth",
            "bio", "sexual_orientation", "dating_preference",
            "religion", "caste", "mother_tongue", "marital_status",
            "min_age_preference", "max_age_preference", "max_distance_km",
            "current_city", "current_lat", "current_lng",
        )

    def validate(self, attrs):
        min_age = attrs.get("min_age_preference", 18)
        max_age = attrs.get("max_age_preference", 99)
        if min_age >= max_age:
            raise serializers.ValidationError("min_age_preference must be less than max_age_preference")
        return attrs


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = (
            "name", "bio",
            "sexual_orientation", "dating_preference",
            "religion", "caste", "mother_tongue", "marital_status",
            "min_age_preference", "max_age_preference", "max_distance_km",
            "current_city", "current_lat", "current_lng",
        )
