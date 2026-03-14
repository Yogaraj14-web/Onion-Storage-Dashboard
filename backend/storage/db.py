"""
MongoDB database connection module for Onion Storage Monitoring System.
Uses pymongo for direct MongoDB operations.
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection


class MongoDB:
    """Singleton class for MongoDB connection management."""
    
    _client: Optional[MongoClient] = None
    _db: Optional[Database] = None
    
    @classmethod
    def get_client(cls) -> MongoClient:
        """Get or create MongoDB client."""
        if cls._client is None:
            mongo_uri = os.getenv('MONGO_URI')
            if not mongo_uri:
                raise ValueError("MONGO_URI environment variable is not set")
            cls._client = MongoClient(mongo_uri)
        return cls._client
    
    @classmethod
    def get_database(cls) -> Database:
        """Get the onion_storage database."""
        if cls._db is None:
            client = cls.get_client()
            cls._db = client['onion_storage']
        return cls._db
    
    @classmethod
    def get_sensor_collection(cls) -> Collection:
        """Get the sensor_data collection."""
        return cls.get_database()['sensor_data']
    
    @classmethod
    def get_sensor_history_collection(cls) -> Collection:
        """Get the sensor_data collection for history queries."""
        return cls.get_sensor_collection()
    
    @classmethod
    def insert_sensor_data(cls, data: dict) -> str:
        """
        Insert sensor data into MongoDB.
        
        Args:
            data: Dictionary containing temperature, humidity, fan_status, 
                  peltier_status, and timestamp
            
        Returns:
            Inserted document ID
        """
        collection = cls.get_sensor_collection()
        
        # Ensure timestamp is set
        if 'timestamp' not in data:
            data['timestamp'] = datetime.utcnow()
        
        result = collection.insert_one(data)
        return str(result.inserted_id)
    
    @classmethod
    def get_latest_sensor_data(cls) -> Optional[dict]:
        """Get the most recent sensor data record."""
        collection = cls.get_sensor_collection()
        result = collection.find_one(sort=[('timestamp', -1)])
        if result:
            result['_id'] = str(result['_id'])
        return result
    
    @classmethod
    def get_sensor_history(cls, limit: int = 50, interval_minutes: int = None) -> list:
        """
        Get sensor data history.
        
        Args:
            limit: Maximum number of records to retrieve (default: 50)
            interval_minutes: If provided, return data at specified minute intervals
                           (e.g., 10 returns data every 10 minutes, 1440 for daily)
                           Special value "daily" returns daily averages
                           Special value "hourly" returns hourly averages
        
        Returns:
            List of sensor data records sorted by timestamp descending
        """
        collection = cls.get_sensor_history_collection()
        
        # Handle daily averages specially
        if interval_minutes == 'daily':
            return cls._get_daily_averages(limit)
        
        # Handle hourly averages
        if interval_minutes == 'hourly':
            return cls._get_hourly_averages(limit)
        
        # Handle numeric interval (10, 30, 60 minutes, etc.)
        if interval_minutes and isinstance(interval_minutes, int):
            # Get enough data for filtering
            fetch_limit = limit * 20
            results = list(collection.find(
                sort=[('timestamp', -1)]
            ).limit(fetch_limit))
            
            # Filter to get one reading per interval using Python
            filtered = []
            last_interval_start = None
            
            for doc in results:
                ts = doc.get('timestamp')
                if not ts:
                    continue
                    
                # Convert timestamp to datetime if it's a string
                if isinstance(ts, str):
                    try:
                        ts = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                    except:
                        continue
                
                # Calculate the interval start time (round down to nearest interval)
                minute = (ts.minute // interval_minutes) * interval_minutes
                interval_start = ts.replace(minute=minute, second=0, microsecond=0)
                
                # Only keep the first document in each interval
                if last_interval_start is None or interval_start != last_interval_start:
                    filtered.append(doc)
                    last_interval_start = interval_start
                    
                    if len(filtered) >= limit:
                        break
            
            results = filtered
        else:
            # Default: return raw data
            results = list(collection.find(
                sort=[('timestamp', -1)]
            ).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for result in results:
            result['_id'] = str(result['_id'])
        
        return results
    
    @classmethod
    def _get_hourly_averages(cls, limit: int = 24) -> list:
        """
        Get hourly average sensor values.
        
        Args:
            limit: Maximum number of hours to retrieve (default: 24)
        
        Returns:
            List of hourly average sensor data records with date and time
            Includes all hours in the range, even if no data exists
        """
        collection = cls.get_sensor_history_collection()
        
        # Get enough data for calculating averages (assuming ~1 reading per minute)
        fetch_limit = limit * 60 * 2  # Get 2x data to ensure we have enough
        results = list(collection.find(
            sort=[('timestamp', -1)]
        ).limit(fetch_limit))
        
        # Get the latest timestamp from data to determine the time range
        now = datetime.utcnow()
        if results:
            # Find the most recent timestamp
            latest_ts = None
            for doc in results:
                ts = doc.get('timestamp')
                if ts:
                    if isinstance(ts, str):
                        try:
                            ts = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                        except:
                            continue
                    if latest_ts is None or ts > latest_ts:
                        latest_ts = ts
            if latest_ts:
                now = latest_ts
        
        # Generate all hours in the range (from now-limit hours to now)
        hourly_data = {}
        for i in range(limit):
            hour_dt = now - timedelta(hours=i)
            hour_key = hour_dt.strftime('%Y-%m-%d %H:00')
            hourly_data[hour_key] = {
                'temperature': [],
                'humidity': [],
                'gas_level': [],
                'count': 0,
                'date_str': hour_dt.strftime('%d/%m/%Y'),
                'time_str': hour_dt.strftime('%I:%M %p'),
                'has_data': False
            }
        
        # Group actual data by hour and calculate averages
        for doc in results:
            ts = doc.get('timestamp')
            if not ts:
                continue
                
            # Convert timestamp to datetime if it's a string
            if isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                except:
                    continue
            
            # Get the hour key (YYYY-MM-DD HH:00)
            hour_key = ts.strftime('%Y-%m-%d %H:00')
            
            # Skip if this hour is not in our range
            if hour_key not in hourly_data:
                continue
            
            hourly_data[hour_key]['has_data'] = True
            
            # Add values to calculate average
            if doc.get('temperature') is not None:
                hourly_data[hour_key]['temperature'].append(doc['temperature'])
            if doc.get('humidity') is not None:
                hourly_data[hour_key]['humidity'].append(doc['humidity'])
            if doc.get('gas_level') is not None:
                hourly_data[hour_key]['gas_level'].append(doc['gas_level'])
            hourly_data[hour_key]['count'] += 1
        
        # Calculate averages and format results
        hourly_results = []
        for hour_key in sorted(hourly_data.keys(), reverse=True):
            data = hourly_data[hour_key]
            
            if data['has_data'] and data['count'] > 0:
                # Calculate averages for hours with data
                avg_temp = sum(data['temperature']) / len(data['temperature']) if data['temperature'] else None
                avg_humidity = sum(data['humidity']) / len(data['humidity']) if data['humidity'] else None
                avg_gas = sum(data['gas_level']) / len(data['gas_level']) if data['gas_level'] else None
                
                hourly_results.append({
                    'temperature': round(avg_temp, 2) if avg_temp else None,
                    'humidity': round(avg_humidity, 2) if avg_humidity else None,
                    'gas_level': round(avg_gas, 2) if avg_gas else None,
                    'timestamp': hour_key + ':00Z',
                    'is_hourly_average': True,
                    'date_display': data['date_str'],
                    'time_display': data['time_str'],
                    'hour_label': data['date_str'] + ' - ' + data['time_str'],
                    'has_data': True
                })
            else:
                # Hours with no data
                hourly_results.append({
                    'temperature': None,
                    'humidity': None,
                    'gas_level': None,
                    'timestamp': hour_key + ':00Z',
                    'is_hourly_average': True,
                    'date_display': data['date_str'],
                    'time_display': data['time_str'],
                    'hour_label': data['date_str'] + ' - ' + data['time_str'],
                    'has_data': False
                })
        
        return hourly_results[:limit]
    
    @classmethod
    def _get_daily_averages(cls, limit: int = 30) -> list:
        """
        Get daily average sensor values.
        
        Args:
            limit: Maximum number of days to retrieve (default: 30)
        
        Returns:
            List of daily average sensor data records
        """
        collection = cls.get_sensor_history_collection()
        
        # Get enough data for calculating averages
        fetch_limit = limit * 24 * 60  # Assuming ~1 reading per minute, get enough for many days
        results = list(collection.find(
            sort=[('timestamp', -1)]
        ).limit(fetch_limit))
        
        if not results:
            return []
        
        # Group data by date and calculate averages
        daily_data = {}
        
        for doc in results:
            ts = doc.get('timestamp')
            if not ts:
                continue
                
            # Convert timestamp to datetime if it's a string
            if isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                except:
                    continue
            
            # Get the date string (YYYY-MM-DD)
            date_key = ts.strftime('%Y-%m-%d')
            
            if date_key not in daily_data:
                daily_data[date_key] = {
                    'temperature': [],
                    'humidity': [],
                    'gas_level': [],
                    'count': 0,
                    'date_display': ts.strftime('%d/%m/%Y')
                }
            
            # Add values to calculate average
            if doc.get('temperature') is not None:
                daily_data[date_key]['temperature'].append(doc['temperature'])
            if doc.get('humidity') is not None:
                daily_data[date_key]['humidity'].append(doc['humidity'])
            if doc.get('gas_level') is not None:
                daily_data[date_key]['gas_level'].append(doc['gas_level'])
            daily_data[date_key]['count'] += 1
        
        # Calculate averages and format results
        daily_results = []
        for date_key in sorted(daily_data.keys(), reverse=True)[:limit]:
            data = daily_data[date_key]
            
            avg_temp = sum(data['temperature']) / len(data['temperature']) if data['temperature'] else None
            avg_humidity = sum(data['humidity']) / len(data['humidity']) if data['humidity'] else None
            avg_gas = sum(data['gas_level']) / len(data['gas_level']) if data['gas_level'] else None
            
            daily_results.append({
                'temperature': round(avg_temp, 2) if avg_temp else None,
                'humidity': round(avg_humidity, 2) if avg_humidity else None,
                'gas_level': round(avg_gas, 2) if avg_gas else None,
                'timestamp': date_key + 'T00:00:00Z',
                'is_daily_average': True,
                'date_display': data['date_display'],
                'hour_label': data['date_display']
            })
        
        return daily_results
    
    @classmethod
    def get_history_by_day(cls, year: int, month: int, day: int) -> dict:
        """
        Get hourly sensor data for a specific day.
        
        Args:
            year: Year (e.g., 2026)
            month: Month (1-12)
            day: Day (1-31)
        
        Returns:
            Dictionary with date and hourly data
        """
        from datetime import datetime
        
        collection = cls.get_sensor_history_collection()
        
        # Create datetime range for the requested day
        start_date = datetime(year, month, day, 0, 0, 0)
        end_date = datetime(year, month, day, 23, 59, 59)
        
        # Query for documents within the date range
        query = {
            'timestamp': {
                '$gte': start_date,
                '$lte': end_date
            }
        }
        
        results = list(collection.find(query).sort('timestamp', 1))
        
        # Initialize 24 hours with no data
        hours_data = {}
        for hour in range(24):
            hours_data[hour] = {
                'hour': hour,
                'temperature': None,
                'humidity': None,
                'gas_level': None,
                'fan_status': None,
                'peltier_status': None,
                'status': 'NO_DATA'
            }
        
        # Group results by hour
        hourly_readings = {hour: [] for hour in range(24)}
        
        for doc in results:
            ts = doc.get('timestamp')
            if not ts:
                continue
            
            # Convert timestamp to datetime if it's a string
            if isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                except:
                    continue
            
            hour = ts.hour
            hourly_readings[hour].append(doc)
        
        # Calculate averages for each hour
        for hour, readings in hourly_readings.items():
            if not readings:
                continue
            
            temperatures = []
            humidities = []
            gas_levels = []
            fan_statuses = []
            peltier_statuses = []
            
            for reading in readings:
                if reading.get('temperature') is not None:
                    temperatures.append(reading['temperature'])
                if reading.get('humidity') is not None:
                    humidities.append(reading['humidity'])
                if reading.get('gas_level') is not None:
                    gas_levels.append(reading['gas_level'])
                if 'fan_status' in reading:
                    fan_statuses.append(reading['fan_status'])
                if 'peltier_status' in reading:
                    peltier_statuses.append(reading['peltier_status'])
            
            # Calculate averages
            avg_temp = sum(temperatures) / len(temperatures) if temperatures else None
            avg_humidity = sum(humidities) / len(humidities) if humidities else None
            avg_gas = sum(gas_levels) / len(gas_levels) if gas_levels else None
            
            # Majority vote for boolean values
            fan_on = sum(fan_statuses) > len(fan_statuses) / 2 if fan_statuses else None
            peltier_on = sum(peltier_statuses) > len(peltier_statuses) / 2 if peltier_statuses else None
            
            hours_data[hour] = {
                'hour': hour,
                'temperature': round(avg_temp, 2) if avg_temp is not None else None,
                'humidity': round(avg_humidity, 2) if avg_humidity is not None else None,
                'gas_level': round(avg_gas, 2) if avg_gas is not None else None,
                'fan_status': fan_on,
                'peltier_status': peltier_on,
                'status': 'OK' if avg_temp is not None else 'NO_DATA'
            }
        
        # Format date string
        date_str = f"{year}-{month:02d}-{day:02d}"
        
        return {
            'success': True,
            'date': date_str,
            'hours': [hours_data[h] for h in range(24)]
        }
    
    @classmethod
    def close_connection(cls) -> None:
        """Close the MongoDB connection."""
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None


# Convenience function for easy imports
def get_db() -> Collection:
    """Get the sensor_data collection."""
    return MongoDB.get_sensor_collection()
