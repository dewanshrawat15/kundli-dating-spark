from rest_framework import serializers
from .models import CompatibilityScore, UserMatchDecision


class MatchListItemSerializer(serializers.Serializer):
    """Flat response for the ranked match list."""
    profile_id = serializers.UUIDField()
    name = serializers.CharField()
    age = serializers.IntegerField()
    city = serializers.CharField()
    bio_snippet = serializers.CharField()
    primary_photo_url = serializers.CharField(allow_null=True)
    email = serializers.EmailField()
    guna_milan_total = serializers.IntegerField()
    overall_score = serializers.FloatField()
    is_manglik_compatible = serializers.BooleanField()
    narrative = serializers.CharField(allow_null=True)
    score_breakdown = serializers.DictField()


class MatchDetailSerializer(serializers.Serializer):
    """Full match detail including kundli breakdown."""
    profile_id = serializers.UUIDField()
    name = serializers.CharField()
    age = serializers.IntegerField()
    city = serializers.CharField()
    bio = serializers.CharField()
    email = serializers.EmailField()
    photos = serializers.ListField(child=serializers.CharField())
    rashi_name = serializers.CharField()
    nakshatra_name = serializers.CharField()
    gana = serializers.CharField()
    nadi = serializers.CharField()
    is_manglik = serializers.BooleanField(allow_null=True)
    guna_milan_total = serializers.IntegerField()
    overall_score = serializers.FloatField()
    is_manglik_compatible = serializers.BooleanField()
    narrative = serializers.CharField(allow_null=True)
    score_breakdown = serializers.DictField()


class DecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["accepted", "rejected"])
