'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Skeleton from '@/components/ui/Skeleton';

export function CollectionsChart({ data, loading, title = 'Daily Collections' }) {
  if (loading) {
    return (
      <div className="card p-6 h-80">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card p-6 h-80 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--input-border)" />
          <XAxis dataKey="day" stroke="var(--color-text)" />
          <YAxis stroke="var(--color-text)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card-bg)',
              border: `1px solid var(--input-border)`,
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="collections"
            stroke="var(--color-secondary)"
            strokeWidth={2}
            dot={false}
            name="Collections"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
