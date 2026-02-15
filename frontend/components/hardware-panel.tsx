'use client';

import { useEffect, useState } from 'react';
import { fetchLatestData } from '@/lib/api';
import { SensorData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wind, Snowflake } from 'lucide-react';

export function HardwarePanel() {
  const [fanOn, setFanOn] = useState(false);
  const [peltierOn, setPeltierOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchLatestData();
        setFanOn(data.fan_status);
        setPeltierOn(data.peltier_status);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hardware status');
        console.error('Error loading hardware status:', err);
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
      <Card className="border-2 border-border/50">
        <CardHeader>
          <CardTitle>Hardware Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-secondary rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-border/50">
        <CardHeader>
          <CardTitle>Hardware Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes rotateFan {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .fan-spin {
          animation: rotateFan 2s linear infinite;
          transform-origin: center;
        }
        .fan-glow {
          filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.6)) drop-shadow(0 0 30px rgba(34, 197, 94, 0.3));
        }
      `}</style>

      {/* Fan - No Container */}
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-32 h-32">
          <svg
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            className={`w-full h-full ${fanOn ? 'fan-spin' : ''}`}
            style={{
              filter: fanOn
                ? 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.6)) drop-shadow(0 0 30px rgba(34, 197, 94, 0.3))'
                : 'opacity(0.7)',
            }}
          >
            <defs>
              <linearGradient id="bladeMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#e8e8e8', stopOpacity: 1 }} />
                <stop offset="25%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#d0d0d0', stopOpacity: 1 }} />
                <stop offset="75%" style={{ stopColor: '#a8a8a8', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#808080', stopOpacity: 1 }} />
              </linearGradient>
              
              <radialGradient id="bladeShadow">
                <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: '#404040', stopOpacity: 0.5 }} />
              </radialGradient>

              <radialGradient id="hubGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" style={{ stopColor: '#c0c0c0', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#808080', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#404040', stopOpacity: 1 }} />
              </radialGradient>
            </defs>

            {/* Outer ring */}
            <circle cx="100" cy="100" r="95" fill="none" stroke="#606060" strokeWidth="2" opacity="0.6"/>

            {/* Blade 1 */}
            <ellipse cx="100" cy="40" rx="18" ry="45" fill="url(#bladeMetal)" opacity="0.95" />
            <ellipse cx="100" cy="40" rx="15" ry="42" fill="url(#bladeShadow)" opacity="0.4"/>

            {/* Blade 2 (120 degrees) */}
            <g transform="rotate(120 100 100)">
              <ellipse cx="100" cy="40" rx="18" ry="45" fill="url(#bladeMetal)" opacity="0.95"/>
              <ellipse cx="100" cy="40" rx="15" ry="42" fill="url(#bladeShadow)" opacity="0.4"/>
            </g>

            {/* Blade 3 (240 degrees) */}
            <g transform="rotate(240 100 100)">
              <ellipse cx="100" cy="40" rx="18" ry="45" fill="url(#bladeMetal)" opacity="0.95"/>
              <ellipse cx="100" cy="40" rx="15" ry="42" fill="url(#bladeShadow)" opacity="0.4"/>
            </g>

            {/* Center hub - main part */}
            <circle cx="100" cy="100" r="16" fill="url(#hubGradient)"/>

            {/* Center hub - inner highlight */}
            <circle cx="100" cy="100" r="12" fill="none" stroke="#e0e0e0" strokeWidth="1" opacity="0.6"/>

            {/* Center hub - darker center */}
            <circle cx="100" cy="100" r="6" fill="#303030" opacity="0.8"/>

            {/* Center point */}
            <circle cx="100" cy="100" r="3" fill="#101010"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Fan</p>
          <p className={`text-xs font-semibold ${
            fanOn ? 'text-green-400' : 'text-gray-500'
          }`}>
            {fanOn ? 'RUNNING' : 'OFF'}
          </p>
        </div>
      </div>

      {/* Peltier Cooling - No Container */}
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full border-3 flex items-center justify-center transition-all ${
              peltierOn
                ? 'border-cyan-400 shadow-lg'
                : 'border-gray-600'
            }`}
            style={{
              boxShadow: peltierOn
                ? '0 0 20px rgba(34, 211, 238, 0.6), 0 0 30px rgba(34, 211, 238, 0.3)'
                : 'none',
            }}
          >
            <Snowflake
              className={`h-12 w-12 ${
                peltierOn ? 'text-cyan-300' : 'text-gray-500'
              }`}
            />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Peltier Cooler</p>
          <p className={`text-xs font-semibold ${
            peltierOn ? 'text-cyan-400' : 'text-gray-500'
          }`}>
            {peltierOn ? 'COOLING' : 'IDLE'}
          </p>
        </div>
      </div>
    </div>
  );
}
