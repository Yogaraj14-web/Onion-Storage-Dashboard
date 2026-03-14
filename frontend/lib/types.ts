export type RiskLevel = 'Low' | 'Medium' | 'High';

// Types matching Django backend API
export interface SensorData {
  _id?: string;
  temperature: number;
  humidity: number;
  fan_status: boolean;
  peltier_status: boolean;
  gas_level?: number;
  timestamp?: string;
  is_daily_average?: boolean;
}

// Frontend display type (computed from API data)
export interface SensorDisplayData extends SensorData {
  riskLevel: RiskLevel;
  fanStatus: boolean;
  peltierStatus: boolean;
}

export interface HistoryPoint {
  time: string;
  temperature: number;
  humidity: number;
  gas_level?: number;
  timestamp?: string;
  is_daily_average?: boolean;
  is_hourly_average?: boolean;
  hour_label?: string;
  has_data?: boolean;
  date_display?: string;
}

export interface AIRecommendation {
  recommendation?: string;
  message?: string;
  timestamp: string;
  success?: boolean;
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}
