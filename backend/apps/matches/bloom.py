"""
Redis Bloom filter helpers for O(1) match decision pre-filtering.

Uses Redis Stack's RedisBloom module (BF.ADD / BF.EXISTS / BF.RESERVE).
Key per user: bloom:decisions:{user_id}
"""

from __future__ import annotations
import logging
from django.core.cache import cache

logger = logging.getLogger(__name__)

BLOOM_KEY_PREFIX = "bloom:decisions"
BLOOM_ERROR_RATE = 0.01   # 1% false positive rate
BLOOM_CAPACITY = 50_000   # Expected max users per filter


def _bloom_key(user_id: str) -> str:
    return f"{BLOOM_KEY_PREFIX}:{user_id}"


def _get_redis():
    """Return the underlying redis-py client from django-redis."""
    return cache.client.get_client()


def ensure_bloom_filter(user_id: str):
    """Create the Bloom filter for a user if it doesn't exist."""
    r = _get_redis()
    key = _bloom_key(user_id)
    try:
        # BF.RESERVE key error_rate capacity  — no-op if already exists
        r.execute_command("BF.RESERVE", key, BLOOM_ERROR_RATE, BLOOM_CAPACITY, "NONSCALING")
    except Exception:
        pass  # Already exists — that's fine


def add_decision(user_id: str, candidate_id: str):
    """Record that user has decided on candidate (add to Bloom filter)."""
    r = _get_redis()
    key = _bloom_key(user_id)
    try:
        r.execute_command("BF.ADD", key, str(candidate_id))
    except Exception as exc:
        logger.warning("BF.ADD failed for %s/%s: %s", user_id, candidate_id, exc)


def probably_decided(user_id: str, candidate_id: str) -> bool:
    """
    Returns True if the user has PROBABLY already decided on this candidate.
    False positives are possible (1%), false negatives are not.
    """
    r = _get_redis()
    key = _bloom_key(user_id)
    try:
        result = r.execute_command("BF.EXISTS", key, str(candidate_id))
        return bool(result)
    except Exception:
        return False  # On error, assume not seen (safe fallback)


def batch_probably_decided(user_id: str, candidate_ids: list[str]) -> list[bool]:
    """
    Pipeline BF.EXISTS for all candidates in one Redis round-trip.
    Returns list of booleans aligned with candidate_ids.
    """
    if not candidate_ids:
        return []

    r = _get_redis()
    key = _bloom_key(user_id)
    try:
        pipe = r.pipeline()
        for cid in candidate_ids:
            pipe.execute_command("BF.EXISTS", key, str(cid))
        return [bool(v) for v in pipe.execute()]
    except Exception as exc:
        logger.warning("Bloom filter pipeline failed for %s: %s", user_id, exc)
        return [False] * len(candidate_ids)  # Safe fallback: show all


def rebuild_bloom_filter_for_user(user_id: str):
    """
    Rebuild the Bloom filter from DB decisions.
    Called on startup or after Redis data loss.
    """
    from apps.matches.models import UserMatchDecision

    r = _get_redis()
    key = _bloom_key(user_id)

    # Delete and recreate
    r.delete(key)
    ensure_bloom_filter(user_id)

    decisions = UserMatchDecision.objects.filter(user_id=user_id).values_list("candidate_id", flat=True)
    if not decisions:
        return

    pipe = r.pipeline()
    for cid in decisions:
        pipe.execute_command("BF.ADD", key, str(cid))
    pipe.execute()
    logger.info("Rebuilt Bloom filter for user %s with %d entries", user_id, len(decisions))
