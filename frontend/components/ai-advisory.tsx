'use client';

import { useState } from 'react';
import { getAIRecommendation, getLatestSensorData } from '@/lib/api';
import { AIRecommendation } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';

export function AIAdvisory() {
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      // First get the latest sensor data
      const sensorData = await getLatestSensorData();
      
      // Then get AI recommendation with the sensor data
      const advice = await getAIRecommendation({
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        fan_status: sensorData.fan_status,
        peltier_status: sensorData.peltier_status,
      });
      
      setRecommendation(advice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI recommendation');
      console.error('Error getting AI recommendation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-primary/30 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>AI Recommendation</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
        <Textarea
          placeholder="Click 'Generate AI Advice' to receive recommendations based on current sensor data..."
          value={recommendation?.message || recommendation?.recommendation || ''}
          readOnly
          className="min-h-24 bg-secondary/50 border-border text-foreground resize-none"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {recommendation && (
            <span>
              Generated:{' '}
              {new Date(recommendation.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
        <Button
          onClick={handleGenerateAdvice}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing sensor data...
            </>
          ) : (
            'Generate AI Advice'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
