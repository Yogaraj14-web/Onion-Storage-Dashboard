'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  unit?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}

const colorClasses = {
  blue: 'border-blue-500/50 bg-blue-500/10',
  green: 'border-green-500/50 bg-green-500/10',
  red: 'border-red-500/50 bg-red-500/10',
  yellow: 'border-yellow-500/50 bg-yellow-500/10',
  gray: 'border-gray-500/50 bg-gray-500/10',
};

const iconColorClasses = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  red: 'text-red-400',
  yellow: 'text-yellow-400',
  gray: 'text-gray-400',
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  unit,
  color = 'blue',
}: MetricCardProps) {
  return (
    <Card className={`border-2 ${colorClasses[color]}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${iconColorClasses[color]}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
