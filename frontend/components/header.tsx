'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Wifi, WifiOff } from 'lucide-react';
import { getLatestSensorData } from '@/lib/api';
import { isSensorOnline } from '@/lib/utils';

export function Header() {
  const [isOnline, setIsOnline] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [minutesAgo, setMinutesAgo] = useState<number | null>(null);

  // Calculate minutes since last update
  const getMinutesSinceUpdate = (timestamp: string | undefined | null): number | null => {
    if (!timestamp) return null;
    try {
      const lastUpdate = new Date(timestamp).getTime();
      const now = Date.now();
      return Math.floor((now - lastUpdate) / 60000); // Convert to minutes
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkSensorStatus = async () => {
      try {
        const sensorData = await getLatestSensorData();
        const online = isSensorOnline(sensorData.timestamp);
        setIsOnline(online);
        setMinutesAgo(getMinutesSinceUpdate(sensorData.timestamp));
      } catch (error) {
        // If we can't get sensor data, show offline
        setIsOnline(false);
        setMinutesAgo(null);
      }
    };

    checkSensorStatus();
    
    // Check sensor status every 10 seconds
    const interval = setInterval(checkSensorStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-border bg-card px-6 py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Smart Onion Storage Monitoring System
          </h1>
          <p className="text-lg text-muted-foreground">
            Real-Time Environmental Control & AI Advisory
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5" />
            <span className="text-2xl font-mono font-bold">{currentTime}</span>
          </div>
          <span className="text-sm text-muted-foreground">{currentDate}</span>
          <Badge
            className={`px-4 py-2 text-base font-medium ${
              isOnline
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isOnline ? (
              <span className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Online ({minutesAgo !== null ? `${minutesAgo} min ago` : 'just now'})
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <WifiOff className="h-4 w-4" />
                Offline
              </span>
            )}
          </Badge>
        </div>
      </div>
    </header>
  );
}
