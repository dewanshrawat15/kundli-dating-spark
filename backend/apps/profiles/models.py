import uuid
from django.db import models
from django.conf import settings


class SexualOrientation(models.TextChoices):
    STRAIGHT = "straight", "Straight"
    LESBIAN = "lesbian", "Lesbian"
    GAY = "gay", "Gay"
    BISEXUAL = "bisexual", "Bisexual"
    PANSEXUAL = "pansexual", "Pansexual"
    OTHER = "other", "Other"


class DatingPreference(models.TextChoices):
    MEN = "men", "Men"
    WOMEN = "women", "Women"
    EVERYONE = "everyone", "Everyone"


class Religion(models.TextChoices):
    HINDU = "hindu", "Hindu"
    MUSLIM = "muslim", "Muslim"
    SIKH = "sikh", "Sikh"
    CHRISTIAN = "christian", "Christian"
    JAIN = "jain", "Jain"
    BUDDHIST = "buddhist", "Buddhist"
    OTHER = "other", "Other"


class MaritalStatus(models.TextChoices):
    NEVER_MARRIED = "never_married", "Never Married"
    DIVORCED = "divorced", "Divorced"
    WIDOWED = "widowed", "Widowed"


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="profile",
    )
    name = models.CharField(max_length=100)

    # Birth details (required for kundli computation)
    date_of_birth = models.DateField()
    time_of_birth = models.TimeField()
    place_of_birth = models.CharField(max_length=255)
    birth_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    birth_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Current location
    current_city = models.CharField(max_length=100, blank=True, default="")
    current_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    bio = models.TextField(blank=True, default="")

    # Identity
    sexual_orientation = models.CharField(max_length=20, choices=SexualOrientation.choices)
    dating_preference = models.CharField(max_length=20, choices=DatingPreference.choices)

    # Extended matrimonial fields
    religion = models.CharField(max_length=20, choices=Religion.choices, blank=True, default="")
    caste = models.CharField(max_length=100, blank=True, default="")
    mother_tongue = models.CharField(max_length=100, blank=True, default="")
    marital_status = models.CharField(
        max_length=20, choices=MaritalStatus.choices, blank=True, default=""
    )

    # Partner preferences
    min_age_preference = models.PositiveIntegerField(default=22)
    max_age_preference = models.PositiveIntegerField(default=35)
    max_distance_km = models.PositiveIntegerField(default=200)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "profiles"
        indexes = [
            models.Index(fields=["current_city"]),
            models.Index(fields=["dating_preference"]),
            models.Index(fields=["religion"]),
            models.Index(fields=["marital_status"]),
            models.Index(fields=["current_lat", "current_lng"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.user.email})"

    @property
    def age(self):
        from datetime import date
        today = date.today()
        dob = self.date_of_birth
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


class ProfileImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="images")
    image_key = models.CharField(max_length=512)  # MinIO object key
    order = models.PositiveSmallIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "profile_images"
        ordering = ["order"]

    def get_url(self):
        from django.conf import settings as django_settings
        endpoint = django_settings.AWS_S3_ENDPOINT_URL.rstrip("/")
        bucket = django_settings.AWS_STORAGE_BUCKET_NAME
        return f"{endpoint}/{bucket}/{self.image_key}"
