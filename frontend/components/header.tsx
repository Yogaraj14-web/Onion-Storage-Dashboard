'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

export function Header() {
  const isOnline = true;
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

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
            {isOnline ? '● Online' : '● Offline'}
          </Badge>
        </div>
      </div>
    </header>
  );
}
