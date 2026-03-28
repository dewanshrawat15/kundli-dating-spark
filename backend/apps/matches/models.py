import uuid
from django.db import models


class CompatibilityScore(models.Model):
    """
    Pre-computed pairwise Ashtakoot Guna Milan scores.
    Always stored with user_a_id < user_b_id (canonical UUID string ordering).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_a = models.ForeignKey(
        "profiles.Profile", on_delete=models.CASCADE, related_name="scores_as_a"
    )
    user_b = models.ForeignKey(
        "profiles.Profile", on_delete=models.CASCADE, related_name="scores_as_b"
    )

    # Ashtakoot breakdown
    varna_score = models.PositiveSmallIntegerField(default=0)
    vasya_score = models.PositiveSmallIntegerField(default=0)
    tara_score = models.PositiveSmallIntegerField(default=0)
    yoni_score = models.PositiveSmallIntegerField(default=0)
    graha_maitri_score = models.PositiveSmallIntegerField(default=0)
    gana_score = models.PositiveSmallIntegerField(default=0)
    bhakoot_score = models.PositiveSmallIntegerField(default=0)
    nadi_score = models.PositiveSmallIntegerField(default=0)
    guna_milan_total = models.PositiveSmallIntegerField(default=0)

    is_manglik_compatible = models.BooleanField(default=True)
    overall_score = models.FloatField(default=0.0)

    # LLM narrative — generated once, cached forever
    narrative = models.TextField(null=True, blank=True)
    narrative_generated_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "compatibility_scores"
        unique_together = [("user_a", "user_b")]
        indexes = [
            models.Index(fields=["user_a", "-overall_score"]),
            models.Index(fields=["user_b", "-overall_score"]),
            models.Index(fields=["guna_milan_total"]),
        ]

    def __str__(self):
        return f"Score({self.user_a_id} ↔ {self.user_b_id}, {self.overall_score:.1f})"


class UserMatchDecision(models.Model):
    """
    Tracks each user's accept/reject decision on a candidate profile.
    The Bloom filter is the fast pre-filter; this table is the source of truth.
    """
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    DECISION_CHOICES = [(ACCEPTED, "Accepted"), (REJECTED, "Rejected")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "profiles.Profile", on_delete=models.CASCADE, related_name="decisions_made"
    )
    candidate = models.ForeignKey(
        "profiles.Profile", on_delete=models.CASCADE, related_name="decisions_received"
    )
    decision = models.CharField(max_length=10, choices=DECISION_CHOICES)
    decided_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_match_decisions"
        unique_together = [("user", "candidate")]
        indexes = [
            models.Index(fields=["user", "decision"]),
            models.Index(fields=["candidate", "decision"]),
        ]

    def __str__(self):
        return f"{self.user_id} {self.decision} {self.candidate_id}"
