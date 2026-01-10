import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}

const variantStyles = {
  default: 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50',
  primary: 'bg-teal-500/10 border-teal-500/30 hover:border-teal-500/50',
  success: 'bg-green-500/10 border-green-500/30 hover:border-green-500/50',
  warning: 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50',
  destructive: 'bg-red-500/10 border-red-500/30 hover:border-red-500/50',
};

const iconVariantStyles = {
  default: 'bg-gray-700/50 text-gray-400',
  primary: 'bg-teal-500/20 text-teal-400',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  destructive: 'bg-red-500/20 text-red-400',
};

const valueVariantStyles = {
  default: 'text-white',
  primary: 'text-teal-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  destructive: 'text-red-400',
};

export function StatCard({ title, value, icon, trend, className, variant = 'default' }: StatCardProps) {
  return (
    <Card className={cn(
      'p-6 border-2 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-[1.02] group',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm text-gray-400 font-medium">{title}</p>
          <p className={cn('text-3xl font-bold', valueVariantStyles[variant])}>{value}</p>
          {trend && (
            <div className="flex items-center gap-2">
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                trend.isPositive
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl transition-all duration-300 group-hover:scale-110',
          iconVariantStyles[variant]
        )}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
