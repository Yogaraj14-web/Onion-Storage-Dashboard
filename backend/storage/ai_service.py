"""
AI service module for GROQ API integration.
Provides intelligent recommendations for onion storage optimization.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import requests

logger = logging.getLogger(__name__)


class AIService:
    """Service class for GROQ API interactions."""
    
    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
    
    @classmethod
    def get_api_key(cls) -> str:
        """Get GROQ API key from environment variables."""
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        return api_key
    
    @classmethod
    def build_prompt(cls, sensor_data: Dict[str, Any]) -> str:
        """
        Build a structured prompt for the AI model.
        
        Args:
            sensor_data: Dictionary containing temperature, humidity, 
                        fan_status, peltier_status
            
        Returns:
            Formatted prompt string
        """
        return f"""Context: Onion storage for shelf life improvement

Current Sensor Data:
- Temperature: {sensor_data.get('temperature', 'N/A')}°C
- Humidity: {sensor_data.get('humidity', 'N/A')}%
- Fan Status: {'ON' if sensor_data.get('fan_status') else 'OFF'}
- Peltier Status: {'ON' if sensor_data.get('peltier_status') else 'OFF'}
- Gas Level: {sensor_data.get('gas_level', 'N/A')} ppm

Please provide a structured analysis with the following sections:

1. Environmental Analysis:
   - Assess current storage conditions
   - Identify any concerns

2. Shelf Life Impact:
   - How current conditions affect onion shelf life
   - Potential issues or improvements

3. Corrective Action:
   - Specific recommendations to optimize storage
   - Any changes needed to current settings

4. Energy Optimization Suggestion:
   - Ways to reduce energy consumption while maintaining quality
   - Efficient operation recommendations

Provide your response in JSON format:
{{
    "environmental_analysis": "your analysis here",
    "shelf_life_impact": "your assessment here", 
    "corrective_action": "your recommendations here",
    "energy_optimization": "your suggestions here"
}}"""
    
    @classmethod
    def get_recommendation(cls, sensor_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get AI recommendation from GROQ API.
        
        Args:
            sensor_data: Dictionary containing sensor readings
            
        Returns:
            Dictionary with AI recommendations
            
        Raises:
            ValueError: If API key is not configured
            requests.exceptions.RequestException: If API call fails
        """
        api_key = cls.get_api_key()
        prompt = cls.build_prompt(sensor_data)
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 1024,
            "response_format": {"type": "json_object"}
        }
        
        try:
            response = requests.post(
                cls.GROQ_API_URL,
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            content = result['choices'][0]['message']['content']
            
            # Parse JSON response
            recommendation = json.loads(content)
            
            # Build recommendation string from all sections, ensuring string type
            rec_parts = []
            for key in ["environmental_analysis", "shelf_life_impact", "corrective_action", "energy_optimization"]:
                value = recommendation.get(key, "")
                if value is None:
                    value = ""
                # Convert to string and clean up any curly braces or brackets
                value_str = str(value)
                value_str = value_str.replace('{', '').replace('}', '').replace('[', '').replace(']', '')
                rec_parts.append(value_str)
            
            # If all parts are empty or just whitespace, use the whole response
            combined = "\n\n".join(rec_parts)
            if not combined.strip():
                combined = content
            
            logger.info(f"AI recommendation parsed: {recommendation}")
            
            return {
                "success": True,
                "recommendation": combined,
                "data": recommendation,
                "sensor_data": sensor_data,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"GROQ API request failed: {e}")
            return {
                "success": False,
                "error": f"API request failed: {str(e)}",
                "sensor_data": sensor_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse GROQ response: {e}")
            return {
                "success": False,
                "error": "Failed to parse AI response",
                "sensor_data": sensor_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Unexpected error in AI service: {e}")
            return {
                "success": False,
                "error": str(e),
                "sensor_data": sensor_data,
                "timestamp": datetime.utcnow().isoformat()
            }


def get_ai_recommendation(sensor_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convenience function to get AI recommendation.
    
    Args:
        sensor_data: Dictionary containing sensor readings
        
    Returns:
        Dictionary with AI recommendations
    """
    return AIService.get_recommendation(sensor_data)
