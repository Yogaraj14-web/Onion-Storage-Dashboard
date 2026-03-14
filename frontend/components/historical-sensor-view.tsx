'use client';

import { useState, useEffect } from 'react';
import { getHistoryByDay, HourlyData } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Convert 24-hour to 12-hour format
function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
}

export function HistoricalSensorView() {
  const [isOpen, setIsOpen] = useState(false);
  const [year, setYear] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m, 0).getDate();
  };

  const handleDayClick = async (day: number) => {
    if (!year || !month) return;
    
    setSelectedDay(day);
    setLoading(true);
    
    try {
      const data = await getHistoryByDay(parseInt(year), parseInt(month), day);
      setHourlyData(data.hours || []);
    } catch (error) {
      console.error('Error fetching hourly data:', error);
      setHourlyData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderSensorSection = (
    title: string,
    getValue: (hour: HourlyData) => string | null,
    unit: string,
    noDataText: string,
    valueClass: string
  ) => (
    <Card className="border-2 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="max-h-64 overflow-y-auto">
        <div className="space-y-1">
          {Array.from({ length: 24 }, (_, hour) => {
            const hourData = hourlyData.find(h => h.hour === hour);
            const value = hourData ? getValue(hourData) : null;
            const displayValue = value !== null ? `${value}${unit}` : noDataText;
            
            return (
              <div 
                key={hour} 
                className={`flex justify-between items-center p-2 rounded text-sm ${
                  value !== null ? 'bg-secondary' : 'bg-secondary/30 opacity-50'
                }`}
              >
                <span className="font-medium">{formatHour(hour)}</span>
                <span className={`font-bold ${value !== null ? valueClass : 'text-gray-400'}`}>
                  {displayValue}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Button to open Historical Sensor View */}
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          📅 Historical Data
        </Button>
      </div>

      {/* Historical Sensor View Panel */}
      {isOpen && (
        <Card className="border-2 border-primary/50 mb-6">
          <CardHeader>
            <CardTitle>Historical Data - By Day</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Year and Month Selection */}
            <div className="flex gap-4 mb-4">
              <div className="w-40">
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Calendar Grid */}
            {year && month && (
              <div className="mb-6">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: new Date(parseInt(year), parseInt(month) - 1, 1).getDay() }, (_, i) => (
                    <div key={`empty-${i}`} className="p-2" />
                  ))}
                  {Array.from({ length: getDaysInMonth(parseInt(year), parseInt(month)) }, (_, i) => {
                    const day = i + 1;
                    const isSelected = selectedDay === day;
                    
                    return (
                      <Button
                        key={day}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="p-2 h-10"
                        onClick={() => handleDayClick(day)}
                      >
                        {day}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hourly Data Display - LIST FORMAT */}
            {selectedDay && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">
                    {months.find(m => m.value === month)?.label} {selectedDay}, {year}
                  </Badge>
                  {loading && <span className="text-sm text-muted-foreground">Loading...</span>}
                </div>

                {!loading && hourlyData.length > 0 && (
                  <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
                    {/* Temperature */}
                    {renderSensorSection(
                      'Temperature',
                      (h) => h.temperature !== undefined && h.temperature !== null ? h.temperature.toFixed(1) : null,
                      '°C',
                      'NO DATA',
                      'text-blue-500'
                    )}

                    {/* Humidity */}
                    {renderSensorSection(
                      'Humidity',
                      (h) => h.humidity !== undefined && h.humidity !== null ? h.humidity.toFixed(1) : null,
                      '%',
                      'NO DATA',
                      'text-pink-500'
                    )}

                    {/* Gas Level */}
                    {renderSensorSection(
                      'Gas Level',
                      (h) => h.gas_level !== undefined && h.gas_level !== null ? h.gas_level.toFixed(0) : null,
                      ' ppm',
                      'NO DATA',
                      'text-purple-500'
                    )}

                    {/* Fan Status */}
                    {renderSensorSection(
                      'Fan Status',
                      (h) => h.fan_status !== undefined && h.fan_status !== null 
                        ? (h.fan_status ? 'ON' : 'OFF') 
                        : null,
                      '',
                      'NO DATA',
                      ''
                    )}

                    {/* Peltier Heater */}
                    {renderSensorSection(
                      'Peltier Heater',
                      (h) => h.peltier_status !== undefined && h.peltier_status !== null 
                        ? (h.peltier_status ? 'ON' : 'OFF') 
                        : null,
                      '',
                      'NO DATA',
                      ''
                    )}
                  </div>
                )}

                {!loading && hourlyData.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No data available for {months.find(m => m.value === month)?.label} {selectedDay}, {year}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
