"""
MongoDB database connection module for Onion Storage Monitoring System.
Uses pymongo for direct MongoDB operations.
"""

import os
from datetime import datetime
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
    def get_sensor_history(cls, limit: int = 50) -> list:
        """
        Get sensor data history.
        
        Args:
            limit: Maximum number of records to retrieve (default: 50)
            
        Returns:
            List of sensor data records sorted by timestamp descending
        """
        collection = cls.get_sensor_collection()
        results = list(collection.find(
            sort=[('timestamp', -1)]
        ).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for result in results:
            result['_id'] = str(result['_id'])
        
        return results
    
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
