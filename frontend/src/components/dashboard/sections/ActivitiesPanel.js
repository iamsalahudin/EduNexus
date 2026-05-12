'use client';

import { useDashboard } from '@/hooks/useDashboard';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';

export function ActivitiesPanel({ activities: providedActivities, loading: loadingOverride, maxActivities = 5, standalone = false }) {
  const shouldFetchActivities = providedActivities == null;
  const { activities: fetchedActivities, loading: fetchedLoading } = useDashboard({
    fetchSummary: false,
    fetchAttendance: false,
    fetchFinance: false,
    fetchClasses: false,
    fetchActivities: shouldFetchActivities,
    fetchNotifications: false,
    autoRefreshInterval: shouldFetchActivities ? 60000 : false
  });

  const activities = providedActivities ?? fetchedActivities;
  const loading = typeof loadingOverride === 'boolean' ? loadingOverride : fetchedLoading;
  const displayedActivities = activities?.slice(0, maxActivities) || [];

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diff = Math.floor((now - activityDate) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const emojiMap = {
    'user-plus': '👤',
    'clock': '⏰',
    'alert-circle': '⚠️',
    'default': '📝'
  };

  const content = (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
      {loading ? (
        [...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))
      ) : displayedActivities.length > 0 ? (
        displayedActivities.map(activity => (
          <div key={activity.id} className="flex gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
            <div className="text-lg flex-shrink-0">
              {emojiMap[activity.icon] || emojiMap.default}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white">{activity.text}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getTimeAgo(activity.timestamp)}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No recent activities</p>
        </div>
      )}
    </div>
  );

  if (standalone) {
    return <Card className="p-6">{content}</Card>;
  }

  return <div className="card p-6">{content}</div>;
}
