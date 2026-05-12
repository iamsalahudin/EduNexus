'use client';

import { useDashboard } from '@/hooks/useDashboard';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

const priorityConfig = {
  high: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-l-red-500', icon: AlertCircle, text: 'text-red-700 dark:text-red-400' },
  medium: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-l-yellow-500', icon: Clock, text: 'text-yellow-700 dark:text-yellow-400' },
  low: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-l-blue-500', icon: CheckCircle, text: 'text-blue-700 dark:text-blue-400' }
};

export function NotificationsPanel({ notifications: providedNotifications, loading: loadingOverride, maxNotifications = 5, standalone = false }) {
  const shouldFetchNotifications = providedNotifications == null;
  const { notifications: fetchedNotifications, loading: fetchedLoading } = useDashboard({
    fetchSummary: false,
    fetchAttendance: false,
    fetchFinance: false,
    fetchClasses: false,
    fetchActivities: false,
    fetchNotifications: shouldFetchNotifications,
    autoRefreshInterval: shouldFetchNotifications ? 60000 : false
  });

  const notifications = providedNotifications ?? fetchedNotifications;
  const loading = typeof loadingOverride === 'boolean' ? loadingOverride : fetchedLoading;
  const displayedNotifications = notifications?.slice(0, maxNotifications) || [];

  const content = (
    <div className="space-y-2">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Notifications</h3>
      {loading ? (
        [...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))
      ) : displayedNotifications.length > 0 ? (
        displayedNotifications.map(notif => {
          const config = priorityConfig[notif.priority] || priorityConfig.low;
          const Icon = config.icon;
          return (
            <div
              key={notif.id}
              className={`${config.bg} border-l-4 ${config.border} rounded-r-lg p-4 flex gap-3`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.text}`} />
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-semibold ${config.text}`}>{notif.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{notif.message}</p>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No notifications</p>
        </div>
      )}
    </div>
  );

  if (standalone) {
    return <Card className="p-6">{content}</Card>;
  }

  return <div className="card p-6">{content}</div>;
}
