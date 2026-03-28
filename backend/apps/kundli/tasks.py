"""
Celery tasks for kundli computation pipeline.

Flow:
  onboarding complete
    → compute_birth_chart(profile_id)
    → compute_compatibility_for_user(profile_id)
    → generate_narrative(user_a_id, user_b_id)  [top-N pairs only]
"""

from __future__ import annotations
import logging
from datetime import timezone

from celery import shared_task
from django.conf import settings
from django.utils import timezone as django_tz

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="birth_charts",
    name="apps.kundli.tasks.compute_birth_chart",
)
def compute_birth_chart(self, profile_id: str):
    """
    Compute Vedic birth chart for a profile using pyswisseph.
    Stores result in BirthChart model, then triggers compatibility computation.
    """
    from apps.profiles.models import Profile
    from apps.profiles.services import geocode_place
    from .models import BirthChart, BirthChartStatus
    from .astrology import compute_birth_chart as _compute

    try:
        profile = Profile.objects.select_related("user").get(pk=profile_id)
    except Profile.DoesNotExist:
        logger.error("Profile %s not found", profile_id)
        return

    chart, _ = BirthChart.objects.get_or_create(profile=profile)
    chart.status = BirthChartStatus.PROCESSING
    chart.save(update_fields=["status"])

    try:
        lat = float(profile.birth_lat) if profile.birth_lat else None
        lng = float(profile.birth_lng) if profile.birth_lng else None

        if lat is None or lng is None:
            coords = geocode_place(profile.place_of_birth)
            if not coords:
                raise ValueError(f"Could not geocode '{profile.place_of_birth}'")
            lat, lng = coords
            profile.birth_lat, profile.birth_lng = lat, lng
            profile.save(update_fields=["birth_lat", "birth_lng"])

        result = _compute(
            dob=profile.date_of_birth,
            tob=profile.time_of_birth,
            lat=lat,
            lng=lng,
        )

        chart.rashi = result["rashi"]
        chart.rashi_name = result["rashi_name"]
        chart.lagna = result["lagna"]
        chart.lagna_name = result["lagna_name"]
        chart.nakshatra = result["nakshatra"]
        chart.nakshatra_name = result["nakshatra_name"]
        chart.nakshatra_pada = result["nakshatra_pada"]
        chart.gana = result["gana"]
        chart.yoni = result["yoni"]
        chart.varna = result["varna"]
        chart.nadi = result["nadi"]
        chart.bhakoot = result["bhakoot"]
        chart.is_manglik = result["is_manglik"]
        chart.manglik_intensity = result["manglik_intensity"]
        chart.planetary_positions = result["planetary_positions"]
        chart.status = BirthChartStatus.COMPLETED
        chart.computed_at = django_tz.now()
        chart.error_message = ""
        chart.save()

        logger.info("Birth chart computed for profile %s", profile_id)

        # Trigger compatibility computation for this user
        compute_compatibility_for_user.delay(profile_id)

    except Exception as exc:
        chart.status = BirthChartStatus.FAILED
        chart.error_message = str(exc)
        chart.save(update_fields=["status", "error_message"])
        logger.exception("Birth chart computation failed for profile %s", profile_id)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=2,
    queue="compatibility",
    name="apps.kundli.tasks.compute_compatibility_for_user",
)
def compute_compatibility_for_user(self, profile_id: str):
    """
    Compute Ashtakoot Guna Milan scores between this user and all other
    users who have completed birth charts.
    """
    from apps.profiles.models import Profile, DatingPreference, SexualOrientation
    from apps.matches.models import CompatibilityScore
    from .models import BirthChart, BirthChartStatus
    from .astrology import compute_ashtakoot

    try:
        profile = Profile.objects.select_related("birth_chart").get(pk=profile_id)
        chart = profile.birth_chart
    except (Profile.DoesNotExist, BirthChart.DoesNotExist):
        logger.error("Profile or BirthChart not found for %s", profile_id)
        return

    if chart.status != BirthChartStatus.COMPLETED:
        logger.warning("BirthChart not complete for %s, skipping compatibility", profile_id)
        return

    chart_a = _chart_to_dict(chart)

    # Fetch all other completed birth charts
    candidates = (
        BirthChart.objects
        .filter(status=BirthChartStatus.COMPLETED)
        .exclude(profile_id=profile_id)
        .select_related("profile")
    )

    created_count = 0
    top_pairs = []

    for candidate_chart in candidates:
        candidate = candidate_chart.profile

        # Hard filter: orientation / preference compatibility
        if not _is_compatible(profile, candidate):
            continue

        chart_b = _chart_to_dict(candidate_chart)
        scores = compute_ashtakoot(chart_a, chart_b)

        # Preference match score (0-30 points)
        pref_score = _preference_score(profile, candidate)

        # Overall weighted score: kundli 70% + preference 30%
        overall = round((scores["total"] / 36) * 70 + pref_score * 0.3, 2)

        # Manglik compatibility check
        manglik_ok = _check_manglik_compatibility(chart, candidate_chart)

        # Canonical ordering
        uid_a, uid_b = sorted([str(profile_id), str(candidate.user_id)])

        obj, created = CompatibilityScore.objects.update_or_create(
            user_a_id=uid_a,
            user_b_id=uid_b,
            defaults={
                "varna_score": scores["varna"],
                "vasya_score": scores["vasya"],
                "tara_score": scores["tara"],
                "yoni_score": scores["yoni"],
                "graha_maitri_score": scores["graha_maitri"],
                "gana_score": scores["gana"],
                "bhakoot_score": scores["bhakoot"],
                "nadi_score": scores["nadi"],
                "guna_milan_total": scores["total"],
                "is_manglik_compatible": manglik_ok,
                "overall_score": overall,
            },
        )
        if created:
            created_count += 1

        if obj.narrative is None and overall >= 50:
            top_pairs.append((uid_a, uid_b, overall))

    logger.info("Computed %d compatibility scores for profile %s", created_count, profile_id)

    # Queue narrative generation for top-20 pairs without narratives
    top_pairs.sort(key=lambda x: x[2], reverse=True)
    for uid_a, uid_b, _ in top_pairs[:20]:
        generate_narrative.delay(uid_a, uid_b)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=120,
    queue="default",
    name="apps.kundli.tasks.generate_narrative",
)
def generate_narrative(self, user_a_id: str, user_b_id: str):
    """
    Generate a Vedic compatibility narrative using Ollama.
    Cached forever in CompatibilityScore.narrative — never regenerated.
    """
    from apps.matches.models import CompatibilityScore
    from apps.profiles.models import Profile
    from .models import BirthChart

    uid_a, uid_b = sorted([user_a_id, user_b_id])

    try:
        score = CompatibilityScore.objects.get(user_a_id=uid_a, user_b_id=uid_b)
    except CompatibilityScore.DoesNotExist:
        return

    if score.narrative:
        return  # Already cached

    try:
        chart_a = BirthChart.objects.get(profile_id=uid_a)
        chart_b = BirthChart.objects.get(profile_id=uid_b)
        profile_a = Profile.objects.get(user_id=uid_a)
        profile_b = Profile.objects.get(user_id=uid_b)
    except Exception as exc:
        logger.exception("Missing data for narrative %s/%s", uid_a, uid_b)
        raise self.retry(exc=exc)

    prompt = _build_narrative_prompt(score, chart_a, chart_b, profile_a, profile_b)

    try:
        import httpx
        response = httpx.post(
            f"{settings.OLLAMA_BASE_URL}/api/generate",
            json={
                "model": settings.OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.4, "num_predict": 300},
            },
            timeout=120.0,
        )
        response.raise_for_status()
        narrative = response.json().get("response", "").strip()

        if narrative:
            score.narrative = narrative
            score.narrative_generated_at = django_tz.now()
            score.save(update_fields=["narrative", "narrative_generated_at"])
            logger.info("Narrative generated for %s/%s", uid_a, uid_b)

    except Exception as exc:
        logger.exception("Ollama narrative generation failed for %s/%s", uid_a, uid_b)
        raise self.retry(exc=exc)


@shared_task(
    queue="birth_charts",
    name="apps.kundli.tasks.retry_failed_birth_charts",
)
def retry_failed_birth_charts():
    """Nightly Celery Beat task: retry all failed birth chart computations."""
    from .models import BirthChart, BirthChartStatus

    failed_ids = BirthChart.objects.filter(
        status=BirthChartStatus.FAILED
    ).values_list("profile_id", flat=True)

    for profile_id in failed_ids:
        compute_birth_chart.delay(str(profile_id))

    logger.info("Queued %d failed birth chart retries", len(failed_ids))


# ── Helpers ───────────────────────────────────────────────────────────────────

def _chart_to_dict(chart) -> dict:
    return {
        "rashi": chart.rashi,
        "rashi_name": chart.rashi_name,
        "lagna": chart.lagna,
        "nakshatra": chart.nakshatra,
        "gana": chart.gana,
        "yoni": chart.yoni,
        "varna": chart.varna,
        "nadi": chart.nadi,
        "bhakoot": chart.bhakoot,
        "is_manglik": chart.is_manglik,
        "manglik_intensity": chart.manglik_intensity,
    }


def _is_compatible(profile_a, profile_b) -> bool:
    """Check if two profiles are compatible based on orientation and preference."""
    from apps.profiles.models import DatingPreference, SexualOrientation

    def _gender_from_pref(p):
        # Infer the user's apparent gender from their sexual_orientation + dating_preference
        # This is a simplified heuristic
        if p.sexual_orientation == SexualOrientation.STRAIGHT:
            return "M" if p.dating_preference == DatingPreference.WOMEN else "F"
        return None  # Non-binary / complex — include by default

    gender_a = _gender_from_pref(profile_a)
    gender_b = _gender_from_pref(profile_b)

    # Check if A is interested in B's apparent gender and vice versa
    pref_a = profile_a.dating_preference
    pref_b = profile_b.dating_preference

    if pref_a == DatingPreference.EVERYONE and pref_b == DatingPreference.EVERYONE:
        return True

    # Simple check: both should appear in each other's preference
    def _wants(pref, other_gender):
        if pref == DatingPreference.EVERYONE:
            return True
        if pref == DatingPreference.MEN and other_gender == "M":
            return True
        if pref == DatingPreference.WOMEN and other_gender == "F":
            return True
        return False

    if gender_a and gender_b:
        return _wants(pref_a, gender_b) and _wants(pref_b, gender_a)
    return True


def _preference_score(profile_a, profile_b) -> float:
    """Return a 0-100 preference match score based on non-kundli factors."""
    score = 50.0  # Base

    # Age within mutual preferred range
    age_b = profile_b.age
    if profile_a.min_age_preference <= age_b <= profile_a.max_age_preference:
        score += 15

    age_a = profile_a.age
    if profile_b.min_age_preference <= age_a <= profile_b.max_age_preference:
        score += 15

    # Religion match (if both specified)
    if profile_a.religion and profile_b.religion and profile_a.religion == profile_b.religion:
        score += 10

    # Marital status match
    if profile_a.marital_status and profile_b.marital_status:
        if profile_a.marital_status == profile_b.marital_status:
            score += 5
        elif "never_married" in (profile_a.marital_status, profile_b.marital_status):
            score -= 5

    return min(score, 100)


def _check_manglik_compatibility(chart_a, chart_b) -> bool:
    """
    Manglik Dosha compatibility:
    - Full Manglik should ideally marry Full Manglik (cancels out)
    - Non-Manglik marrying Full Manglik is problematic
    - Partial Manglik with either is acceptable
    """
    a_intensity = chart_a.manglik_intensity
    b_intensity = chart_b.manglik_intensity

    if a_intensity == "none" and b_intensity == "none":
        return True
    if a_intensity == "full" and b_intensity == "full":
        return True  # Cancels out
    if a_intensity == "partial" or b_intensity == "partial":
        return True  # Partial is acceptable
    return False  # One full, one none — flagged


def _build_narrative_prompt(score, chart_a, chart_b, profile_a, profile_b) -> str:
    return f"""You are a Vedic astrology expert specializing in Kundli-based matrimonial compatibility.

Write a 3-4 sentence compatibility narrative for two people based on their Ashtakoot Guna Milan analysis.
Be warm, insightful, and specific to the actual scores. Do not make it a generic description.

Person A: {profile_a.name}, Rashi: {chart_a.rashi_name}, Nakshatra: {chart_a.nakshatra_name}, Gana: {chart_a.gana}, Nadi: {chart_a.nadi}
Person B: {profile_b.name}, Rashi: {chart_b.rashi_name}, Nakshatra: {chart_b.nakshatra_name}, Gana: {chart_b.gana}, Nadi: {chart_b.nadi}

Ashtakoot Scores (out of 36 total):
- Varna: {score.varna_score}/1
- Vasya: {score.vasya_score}/2
- Tara: {score.tara_score}/3
- Yoni: {score.yoni_score}/4
- Graha Maitri: {score.graha_maitri_score}/5
- Gana: {score.gana_score}/6
- Bhakoot: {score.bhakoot_score}/7
- Nadi: {score.nadi_score}/8 ({"same nadi - caution advised" if score.nadi_score == 0 else "different nadi - auspicious"})
Total: {score.guna_milan_total}/36

Manglik compatibility: {"Compatible" if score.is_manglik_compatible else "Caution - Manglik dosha incompatibility"}

Write only the narrative, 3-4 sentences, no preamble:"""
