"""
ThingSpeak data fetching tasks using APScheduler.
Automatically fetches sensor data from ThingSpeak every 30 seconds.
"""

import os
import logging
import requests
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler

from storage.db import MongoDB

logger = logging.getLogger(__name__)


def fetch_thingspeak_data() -> dict | None:
    """
    Fetch latest data from ThingSpeak channel.
    Returns dictionary with sensor data or None if fetch fails.
    """
    channel_id = os.getenv("THINGSPEAK_CHANNEL_ID")
    api_key = os.getenv("THINGSPEAK_READ_API_KEY")

    if not channel_id or not api_key:
        logger.error("ThingSpeak credentials not configured")
        return None

    url = f"https://api.thingspeak.com/channels/{channel_id}/feeds/last.json"

    try:
        response = requests.get(url, params={"api_key": api_key}, timeout=10)
        response.raise_for_status()
        latest = response.json()

        # Validate required fields
        if not latest.get("field2") or not latest.get("field3"):
            logger.warning("Incomplete ThingSpeak data received")
            return None

        try:
            temp = float(latest["field1"]) if latest.get("field1") else None
            humidity = float(latest["field2"]) if latest.get("field2") else None
            fan = latest.get("field3") == "1"
            peltier = latest.get("field4") == "1"
            gas = float(latest["field5"]) if latest.get("field5") else None
        except (ValueError, TypeError):
            logger.warning("Invalid sensor data format received")
            return None

        sensor_data = {
            "temperature": temp,
            "humidity": humidity,
            "fan_status": fan,
            "peltier_status": peltier,
            "gas_level": gas,
            "timestamp": datetime.utcnow(),
        }

        return sensor_data

    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching ThingSpeak data: {e}")
        return None


def fetch_and_store_sensor_data() -> bool:
    """
    Fetch data from ThingSpeak and store in MongoDB.
    """
    sensor_data = fetch_thingspeak_data()

    if not sensor_data:
        return False

    try:
        MongoDB.insert_sensor_data(sensor_data)
        logger.info(f"Stored sensor data: {sensor_data}")
        return True
    except Exception as e:
        logger.error(f"Error storing sensor data: {e}")
        return False


def start_scheduler() -> BackgroundScheduler:
    """
    Start APScheduler to fetch ThingSpeak data every 30 seconds.
    """
    scheduler = BackgroundScheduler()

    scheduler.add_job(
        fetch_and_store_sensor_data,
        "interval",
        seconds=30,
        id="fetch_thingspeak_data",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("ThingSpeak data fetch scheduler started")

    # Fetch immediately on startup
    fetch_and_store_sensor_data()

    return scheduler
