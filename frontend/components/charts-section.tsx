'use client';

import { useEffect, useState } from 'react';
import { fetchHistoryData } from '@/lib/api';
import { HistoryPoint } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function ChartsSection() {
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const historyData = await fetchHistoryData();
        setData(historyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history data');
        console.error('Error loading history data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    // Refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || data.length === 0) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="border-2 border-border/50">
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-secondary rounded-lg animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="col-span-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
          Error loading history: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Temperature Chart */}
      <Card className="border-2 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Temperature Trend (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#3b82f6"
                dot={false}
                strokeWidth={2}
                name="Temperature (°C)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Humidity Chart */}
      <Card className="border-2 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Humidity Trend (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="#ec4899"
                dot={false}
                strokeWidth={2}
                name="Humidity (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gas Level Chart */}
      <Card className="border-2 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Gas Level Trend (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="gas_level"
                stroke="#8b5cf6"
                dot={false}
                strokeWidth={2}
                name="Gas Level (ppm)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
