from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(queue="default", name="apps.matches.tasks.rebuild_bloom_filter")
def rebuild_bloom_filter(user_id: str):
    """Rebuild Bloom filter from DB for a user (e.g. after Redis restart)."""
    from .bloom import rebuild_bloom_filter_for_user
    rebuild_bloom_filter_for_user(user_id)
