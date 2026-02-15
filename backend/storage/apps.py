"""
Django app configuration for storage application.
Initializes APScheduler for ThingSpeak data fetching.
"""

import logging
import os
from django.apps import AppConfig

logger = logging.getLogger(__name__)


class StorageConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'storage'

    def ready(self):
        # Prevent scheduler from running twice (Django auto-reloader issue)
        if os.environ.get("RUN_MAIN") != "true":
            return

        try:
            from storage.tasks import start_scheduler
            start_scheduler()
            logger.info("ThingSpeak scheduler started successfully.")
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}")
