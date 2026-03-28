import uuid
from django.conf import settings
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
import boto3
from botocore.client import Config

from .models import Profile, ProfileImage
from .serializers import ProfileSerializer, OnboardingSerializer, ProfileUpdateSerializer
from .services import geocode_place


class ProfileMeView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(responses=ProfileSerializer, summary="Get own profile")
    def get(self, request):
        try:
            profile = request.user.profile
        except Profile.DoesNotExist:
            return Response({"detail": "Profile not found. Complete onboarding first."}, status=404)
        return Response(ProfileSerializer(profile).data)

    @extend_schema(request=ProfileUpdateSerializer, responses=ProfileSerializer, summary="Update own profile")
    def put(self, request):
        profile = request.user.profile
        serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProfileSerializer(profile).data)


class OnboardingView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(request=OnboardingSerializer, responses=ProfileSerializer, summary="Complete onboarding")
    def post(self, request):
        user = request.user
        serializer = OnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Geocode birth place if lat/lng not provided
        if not data.get("birth_lat") and data.get("place_of_birth"):
            coords = geocode_place(data["place_of_birth"])
            if coords:
                data["birth_lat"], data["birth_lng"] = coords

        profile, created = Profile.objects.update_or_create(
            user=user,
            defaults=data,
        )

        # Mark onboarding complete
        user.is_onboarding_complete = True
        user.save(update_fields=["is_onboarding_complete"])

        # Trigger birth chart computation
        from apps.kundli.tasks import compute_birth_chart
        compute_birth_chart.delay(str(profile.user_id))

        return Response(
            ProfileSerializer(profile).data,
            status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED,
        )


class ProfilePhotoView(APIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser,)

    @extend_schema(summary="Upload a profile photo")
    def post(self, request):
        profile = request.user.profile
        image_file = request.FILES.get("image")
        if not image_file:
            return Response({"detail": "No image provided."}, status=400)

        # Validate image
        if image_file.content_type not in ("image/jpeg", "image/png", "image/webp"):
            return Response({"detail": "Only JPEG, PNG, or WebP images are accepted."}, status=400)

        ext = image_file.name.rsplit(".", 1)[-1].lower()
        key = f"profiles/{profile.user_id}/{uuid.uuid4()}.{ext}"

        # Upload to MinIO
        s3 = _get_s3_client()
        s3.upload_fileobj(
            image_file,
            settings.AWS_STORAGE_BUCKET_NAME,
            key,
            ExtraArgs={"ContentType": image_file.content_type},
        )

        is_primary = not profile.images.filter(is_primary=True).exists()
        img = ProfileImage.objects.create(
            profile=profile,
            image_key=key,
            order=profile.images.count(),
            is_primary=is_primary,
        )

        from .serializers import ProfileImageSerializer
        return Response(ProfileImageSerializer(img).data, status=status.HTTP_201_CREATED)


class ProfilePhotoDeleteView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(summary="Delete a profile photo")
    def delete(self, request, photo_id):
        try:
            img = ProfileImage.objects.get(id=photo_id, profile__user=request.user)
        except ProfileImage.DoesNotExist:
            return Response(status=404)

        was_primary = img.is_primary
        key = img.image_key
        img.delete()

        # Delete from MinIO
        try:
            s3 = _get_s3_client()
            s3.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key)
        except Exception:
            pass  # Log but don't fail the request

        # Promote next image to primary
        if was_primary:
            first = ProfileImage.objects.filter(profile__user=request.user).order_by("order").first()
            if first:
                first.is_primary = True
                first.save(update_fields=["is_primary"])

        return Response(status=status.HTTP_204_NO_CONTENT)


def _get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        use_ssl=settings.AWS_S3_USE_SSL,
    )
