'use client';

import Skeleton from '@/components/ui/Skeleton';

export function StatCard({ title, value, icon: Icon, color = 'primary', subtitle, loading, trend }) {
  if (loading) {
    return (
      <div className="card p-6">
        <Skeleton className="h-5 w-24 mb-2" />
        <Skeleton className="h-10 w-32 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        {Icon && <Icon className="w-5 h-5" style={{ color: `var(--color-${color})` }} />}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {trend && (
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
}
