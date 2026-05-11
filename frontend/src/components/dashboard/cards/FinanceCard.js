'use client';

import Skeleton from '@/components/ui/Skeleton';

export function FinanceCard({ title, data, loading }) {
  if (loading) {
    return (
      <div className="card p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const percentage = data?.percentage || 0;
  const items = [
    { label: 'Generated', value: `Rs. ${data?.generated?.toLocaleString() || 0}` },
    { label: 'Received', value: `Rs. ${data?.received?.toLocaleString() || 0}` },
    { label: 'Pending', value: `Rs. ${data?.pending?.toLocaleString() || 0}` }
  ];

  return (
    <div className="card p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.label} className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
            <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Collection Rate</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: 'var(--color-secondary)'
            }}
          />
        </div>
      </div>
    </div>
  );
}
