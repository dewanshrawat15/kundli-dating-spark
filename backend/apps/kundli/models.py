from django.db import models


class BirthChartStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class Gana(models.TextChoices):
    DEVA = "deva", "Deva"
    MANUSHYA = "manushya", "Manushya"
    RAKSHASA = "rakshasa", "Rakshasa"


class BirthChart(models.Model):
    profile = models.OneToOneField(
        "profiles.Profile",
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="birth_chart",
    )
    status = models.CharField(
        max_length=20, choices=BirthChartStatus.choices, default=BirthChartStatus.PENDING
    )

    # Moon sign (Rashi) — 1–12
    rashi = models.PositiveSmallIntegerField(null=True, blank=True)
    rashi_name = models.CharField(max_length=50, blank=True, default="")

    # Ascendant (Lagna) — 1–12
    lagna = models.PositiveSmallIntegerField(null=True, blank=True)
    lagna_name = models.CharField(max_length=50, blank=True, default="")

    # Nakshatra — 1–27
    nakshatra = models.PositiveSmallIntegerField(null=True, blank=True)
    nakshatra_name = models.CharField(max_length=50, blank=True, default="")
    nakshatra_pada = models.PositiveSmallIntegerField(null=True, blank=True)  # 1–4

    # Derived Koot values
    gana = models.CharField(max_length=20, choices=Gana.choices, blank=True, default="")
    yoni = models.CharField(max_length=50, blank=True, default="")   # animal symbol
    varna = models.CharField(max_length=50, blank=True, default="")  # spiritual group
    nadi = models.CharField(max_length=20, blank=True, default="")   # aadi/madhya/antya
    bhakoot = models.PositiveSmallIntegerField(null=True, blank=True)  # rashi index for Bhakoot

    # Manglik Dosha
    is_manglik = models.BooleanField(null=True)
    manglik_intensity = models.CharField(max_length=20, blank=True, default="none")

    # Full planetary positions
    planetary_positions = models.JSONField(null=True, blank=True)

    computed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "birth_charts"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["rashi"]),
            models.Index(fields=["nakshatra"]),
        ]

    def __str__(self):
        return f"BirthChart({self.profile_id}, {self.status})"
