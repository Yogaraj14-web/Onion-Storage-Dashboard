"""
REST API views for Onion Storage Monitoring System.
Provides endpoints for sensor data and AI recommendations.
"""

import json
import logging
from bson import ObjectId
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from storage.db import MongoDB
from storage.ai_service import AIService

logger = logging.getLogger(__name__)


def serialize_mongo_document(doc):
    """Convert MongoDB document to JSON-safe format."""
    if not doc:
        return None

    doc["_id"] = str(doc["_id"])

    # Force UTC timezone indicator for frontend
    if "timestamp" in doc and doc["timestamp"]:
        ts = doc["timestamp"]

        # If timestamp is datetime object
        if hasattr(ts, "isoformat"):
            doc["timestamp"] = ts.isoformat() + "Z"

        # If already string but missing Z
        elif isinstance(ts, str) and not ts.endswith("Z"):
            doc["timestamp"] = ts + "Z"

    return doc


@require_http_methods(["GET"])
def latest_sensor_data(request):
    try:
        data = MongoDB.get_latest_sensor_data()

        if data is None:
            return JsonResponse({
                "success": False,
                "error": "No sensor data available"
            }, status=404)

        data = serialize_mongo_document(data)

        return JsonResponse({
            "success": True,
            "data": data
        })

    except Exception as e:
        logger.error(f"Error fetching latest sensor data: {e}")
        return JsonResponse({
            "success": False,
            "error": "Failed to fetch sensor data"
        }, status=500)


@require_http_methods(["GET"])
def sensor_history(request):
    try:
        try:
            limit = int(request.GET.get("limit", 50))
            limit = min(max(limit, 1), 100)
        except ValueError:
            limit = 50

        # Get optional interval parameter for 10-minute sampling
        interval_minutes = request.GET.get("interval")
        if interval_minutes:
            try:
                interval_minutes = int(interval_minutes)
            except ValueError:
                interval_minutes = None
        else:
            interval_minutes = None

        history = MongoDB.get_sensor_history(limit=limit, interval_minutes=interval_minutes)

        history = [serialize_mongo_document(doc) for doc in history]

        return JsonResponse({
            "success": True,
            "data": history,
            "count": len(history)
        })

    except Exception as e:
        logger.error(f"Error fetching sensor history: {e}")
        return JsonResponse({
            "success": False,
            "error": "Failed to fetch sensor history"
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def ai_recommendation(request):
    try:
        if request.content_type != "application/json":
            return JsonResponse({
                "success": False,
                "error": "Content-Type must be application/json"
            }, status=400)

        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                "success": False,
                "error": "Invalid JSON body"
            }, status=400)

        required_fields = ["temperature", "humidity", "fan_status", "peltier_status"]
        missing_fields = [f for f in required_fields if f not in body]

        if missing_fields:
            return JsonResponse({
                "success": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }, status=400)

        try:
            sensor_data = {
                "temperature": float(body["temperature"]),
                "humidity": float(body["humidity"]),
                "fan_status": str(body["fan_status"]).lower() in ["true", "1"],
                "peltier_status": str(body["peltier_status"]).lower() in ["true", "1"],
                "gas_level": float(body["gas_level"]) if body.get("gas_level") else None,
            }
        except (ValueError, TypeError) as e:
            return JsonResponse({
                "success": False,
                "error": f"Invalid data types: {str(e)}"
            }, status=400)

        result = AIService.get_recommendation(sensor_data)

        if result.get("success"):
            return JsonResponse(result)
        else:
            return JsonResponse(result, status=500)

    except ValueError as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)

    except Exception as e:
        logger.error(f"Error generating AI recommendation: {e}")
        return JsonResponse({
            "success": False,
            "error": "Failed to generate recommendation"
        }, status=500)


@require_http_methods(["GET"])
def health_check(request):
    try:
        MongoDB.get_client().admin.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return JsonResponse({
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status
    })


@require_http_methods(["GET"])
def history_by_day(request):
    """
    Get hourly sensor data for a specific day.
    
    Query parameters:
    - year: Year (e.g., 2026)
    - month: Month (1-12)
    - day: Day (1-31)
    
    Returns hourly averages for temperature, humidity, gas_level,
    and majority vote for fan_status and peltier_status.
    """
    try:
        # Get query parameters
        year = request.GET.get("year")
        month = request.GET.get("month")
        day = request.GET.get("day")
        
        # Validate required parameters
        if not year or not month or not day:
            return JsonResponse({
                "success": False,
                "error": "Missing required parameters: year, month, day"
            }, status=400)
        
        # Convert to integers
        try:
            year = int(year)
            month = int(month)
            day = int(day)
        except ValueError:
            return JsonResponse({
                "success": False,
                "error": "Invalid parameter values: year, month, day must be integers"
            }, status=400)
        
        # Validate ranges
        if month < 1 or month > 12:
            return JsonResponse({
                "success": False,
                "error": "Invalid month: must be between 1 and 12"
            }, status=400)
        
        if day < 1 or day > 31:
            return JsonResponse({
                "success": False,
                "error": "Invalid day: must be between 1 and 31"
            }, status=400)
        
        # Get data from database
        result = MongoDB.get_history_by_day(year, month, day)
        
        return JsonResponse(result)
    
    except Exception as e:
        logger.error(f"Error fetching history by day: {e}")
        return JsonResponse({
            "success": False,
            "error": "Failed to fetch history data"
        }, status=500)
