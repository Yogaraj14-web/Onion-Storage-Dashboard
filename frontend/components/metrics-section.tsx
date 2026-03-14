'use client';

import { useEffect, useState } from 'react';
import { fetchLatestData } from '@/lib/api';
import { SensorData, RiskLevel } from '@/lib/types';
import { MetricCard } from './metric-card';
import {
  Thermometer,
  Droplets,
  AlertTriangle,
  Wind,
  Flame,
  Gauge,
} from 'lucide-react';

export function MetricsSection() {
  const [data, setData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const sensorData = await fetchLatestData();
        setData(sensorData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sensor data');
        console.error('Error loading sensor data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-card border border-border rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <div className="col-span-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
          Error: {error || 'No data available'}
        </div>
      </div>
    );
  }

  // Calculate risk level based on temperature and humidity
  const calculateRiskLevel = (temp: number, humidity: number): RiskLevel => {
    // Ideal conditions: temp 15-25°C, humidity 65-75%
    if (temp >= 15 && temp <= 25 && humidity >= 65 && humidity <= 75) {
      return 'Low';
    } else if ((temp >= 10 && temp <= 30) && (humidity >= 55 && humidity <= 85)) {
      return 'Medium';
    }
    return 'High';
  };

  const riskLevel = calculateRiskLevel(data.temperature, data.humidity);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High':
        return 'red';
      case 'Medium':
        return 'yellow';
      case 'Low':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      <MetricCard
        title="Temperature"
        value={data.temperature}
        unit="°C"
        icon={Thermometer}
        color="blue"
      />
      <MetricCard
        title="Humidity"
        value={data.humidity}
        unit="%"
        icon={Droplets}
        color="blue"
      />
      <MetricCard
        title="Gas Level"
        value={data.gas_level ?? 0}
        unit="ppm"
        icon={Gauge}
        color="blue"
      />
      <MetricCard
        title="Risk Level"
        value={riskLevel}
        icon={AlertTriangle}
        color={getRiskColor(riskLevel)}
      />
      <MetricCard
        title="Fan Status"
        value={data.fan_status ? 'ON' : 'OFF'}
        icon={Wind}
        color={data.fan_status ? 'green' : 'gray'}
      />
      <MetricCard
        title="Heater Status"
        value={data.peltier_status ? 'ON' : 'OFF'}
        icon={Flame}
        color={data.peltier_status ? 'red' : 'gray'}
      />
    </div>
  );
}
