'use client';

import { useEffect, useState } from 'react';
import { fetchHistoryData, getSensorHistory } from '@/lib/api';
import { HistoryPoint } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const [hourlyData, setHourlyData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load daily averages
        const dailyData = await fetchHistoryData('daily');
        setData(dailyData);
        
        // Load hourly averages for historical view
        const hourly = await getSensorHistory(24, 'hourly');
        setHourlyData(hourly);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history data');
        console.error('Error loading history data:', err);
      } finally {
        setLoading(false)
      }
    };
    loadData();
    
    // Refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  if (loading || data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" disabled>Loading...</Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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
    <div className="space-y-4">
      {/* Toggle Button */}
      <div className="flex justify-end">
        <Button 
          variant={showHistory ? "default" : "outline"}
          onClick={toggleHistory}
          className="gap-2"
        >
          {showHistory ? "📊 Show Daily Chart" : "📋 Show Historical Data"}
        </Button>
      </div>

      {showHistory ? (
        /* Historical Data View - Hourly */
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Temperature Historical Data */}
          <Card className="border-2 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Temperature History (Hourly)</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {hourlyData.map((item, index) => (
                  <div key={index} className={`flex justify-between items-center p-2 bg-secondary rounded text-sm ${item.has_data === false ? 'opacity-50' : ''}`}>
                    <span className="font-medium text-foreground">
                      {item.hour_label ? item.hour_label.split(' - ')[1] : item.time}
                    </span>
                    <span className={`font-bold ${item.has_data === false ? 'text-gray-400' : 'text-blue-500'}`}>
                      {item.has_data === false ? 'No Data' : (item.temperature !== null ? `${item.temperature}°C` : 'N/A')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Humidity Historical Data */}
          <Card className="border-2 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Humidity History (Hourly)</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {hourlyData.map((item, index) => (
                  <div key={index} className={`flex justify-between items-center p-2 bg-secondary rounded text-sm ${item.has_data === false ? 'opacity-50' : ''}`}>
                    <span className="font-medium text-foreground">
                      {item.hour_label ? item.hour_label.split(' - ')[1] : item.time}
                    </span>
                    <span className={`font-bold ${item.has_data === false ? 'text-gray-400' : 'text-pink-500'}`}>
                      {item.has_data === false ? 'No Data' : (item.humidity !== null ? `${item.humidity}%` : 'N/A')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gas Level Historical Data */}
          <Card className="border-2 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Gas Level History (Hourly)</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {hourlyData.map((item, index) => (
                  <div key={index} className={`flex justify-between items-center p-2 bg-secondary rounded text-sm ${item.has_data === false ? 'opacity-50' : ''}`}>
                    <span className="font-medium text-foreground">
                      {item.hour_label ? item.hour_label.split(' - ')[1] : item.time}
                    </span>
                    <span className={`font-bold ${item.has_data === false ? 'text-gray-400' : 'text-purple-500'}`}>
                      {item.has_data === false ? 'No Data' : (item.gas_level !== null ? `${item.gas_level} ppm` : 'N/A')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Daily Chart View */
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Temperature Chart */}
          <Card className="border-2 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Temperature Trend (Daily Avg)</CardTitle>
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
              <CardTitle className="text-lg">Humidity Trend (Daily Avg)</CardTitle>
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
              <CardTitle className="text-lg">Gas Level Trend (Daily Avg)</CardTitle>
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
      )}
    </div>
  );
}
