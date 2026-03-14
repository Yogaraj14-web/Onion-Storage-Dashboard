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
 * GET /api/history/?limit=50&interval=10
 * For daily averages: GET /api/history/?limit=30&interval=daily
 * For hourly averages: GET /api/history/?limit=24&interval=hourly
 */
export async function getSensorHistory(limit: number = 50, intervalMinutes: number | string = 'daily'): Promise<HistoryPoint[]> {
  const intervalParam = typeof intervalMinutes === 'string' ? intervalMinutes : intervalMinutes;
  const url = intervalParam 
    ? `${BASE_URL}/api/history/?limit=${limit}&interval=${intervalParam}`
    : `${BASE_URL}/api/history/?limit=${limit}`;
  
  const response = await fetch(url, {
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
      // Check if it's a daily or hourly average
      if (item.is_daily_average || item.is_hourly_average) {
        timeStr = item.hour_label || date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      } else {
        timeStr = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true
        });
      }
    }
    return {
      time: timeStr,
      temperature: item.temperature,
      humidity: item.humidity,
      gas_level: item.gas_level,
      timestamp: item.timestamp,
      is_daily_average: item.is_daily_average,
      is_hourly_average: item.is_hourly_average,
      hour_label: item.hour_label,
      has_data: item.has_data,
      date_display: item.date_display,
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

export async function fetchHistoryData(intervalMinutes: number | string = 'daily'): Promise<HistoryPoint[]> {
  return getSensorHistory(50, intervalMinutes);
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

// Types for history-by-day API
export interface HourlyData {
  hour: number;
  temperature: number | null;
  humidity: number | null;
  gas_level: number | null;
  fan_status: boolean | null;
  peltier_status: boolean | null;
  status: string;
}

export interface HistoryByDayResponse {
  success: boolean;
  date: string;
  hours: HourlyData[];
}

/**
 * Fetch hourly sensor data for a specific day
 * GET /api/history-by-day/?year=YYYY&month=MM&day=DD
 */
export async function getHistoryByDay(year: number, month: number, day: number): Promise<HistoryByDayResponse> {
  const response = await fetch(
    `${BASE_URL}/api/history-by-day/?year=${year}&month=${month}&day=${day}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const result: HistoryByDayResponse = await response.json();

  if (!result.success) {
    throw new Error('Failed to fetch history by day');
  }

  return result;
}
