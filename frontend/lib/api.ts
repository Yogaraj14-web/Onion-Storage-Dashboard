import { SensorData, HistoryPoint, AIRecommendation, ApiResponse } from './types';

// Base URL for API - defaults to localhost:8000
// In production, set NEXT_PUBLIC_API_URL in your environment
const BASE_URL = 'http://127.0.0.1:8000';

/**
 * Fetch latest sensor data from Django backend
 * GET /api/latest/
 */
export async function getLatestSensorData(): Promise<SensorData> {
  const response = await fetch(`${BASE_URL}/api/latest/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result: ApiResponse<SensorData> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch sensor data');
  }

  return result.data;
}

/**
 * Fetch sensor history from Django backend
 * GET /api/history/?limit=50
 */
export async function getSensorHistory(limit: number = 50): Promise<HistoryPoint[]> {
  const response = await fetch(`${BASE_URL}/api/history/?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result: ApiResponse<HistoryPoint[]> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch history data');
  }

  // Transform data to include time field for charts (local time)
  return result.data.map((item) => {
    let timeStr = '';
    if (item.timestamp) {
      const date = new Date(item.timestamp);
      timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true
      });
    }
    return {
      time: timeStr,
      temperature: item.temperature,
      humidity: item.humidity,
      gas_level: item.gas_level,
      timestamp: item.timestamp,
    };
  });
}

/**
 * Get AI recommendation based on current sensor data
 * POST /api/ai-recommendation/
 */
export async function getAIRecommendation(sensorData: {
  temperature: number;
  humidity: number;
  fan_status: boolean;
  peltier_status: boolean;
  gas_level?: number;
}): Promise<AIRecommendation> {
  const response = await fetch(`${BASE_URL}/api/ai-recommendation/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      temperature: sensorData.temperature,
      humidity: sensorData.humidity,
      fan_status: sensorData.fan_status,
      peltier_status: sensorData.peltier_status,
      gas_level: sensorData.gas_level,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to get AI recommendation');
  }

  return {
    recommendation: result.recommendation || result.message,
    message: result.recommendation || result.message,
    timestamp: result.timestamp || new Date().toISOString(),
    success: result.success,
  };
}

// Legacy functions for compatibility (now use real API)
export async function fetchLatestData(): Promise<SensorData> {
  return getLatestSensorData();
}

export async function fetchHistoryData(): Promise<HistoryPoint[]> {
  return getSensorHistory(50);
}

export async function fetchAIRecommendation(): Promise<AIRecommendation> {
  // First get latest sensor data
  const sensorData = await getLatestSensorData();
  return getAIRecommendation({
    temperature: sensorData.temperature,
    humidity: sensorData.humidity,
    fan_status: sensorData.fan_status,
    peltier_status: sensorData.peltier_status,
    gas_level: sensorData.gas_level,
  });
}
