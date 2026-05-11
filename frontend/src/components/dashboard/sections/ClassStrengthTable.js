'use client';

import { useDashboard } from '@/hooks/useDashboard';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';

export function ClassStrengthTable({ classes: providedClasses, loading: loadingOverride, maxRows = 8, standalone = false }) {
  const { classes: fetchedClasses, loading: fetchedLoading } = useDashboard({
    fetchSummary: false,
    fetchAttendance: false,
    fetchFinance: false,
    fetchClasses: true,
    fetchActivities: false,
    fetchNotifications: false
  });

  const classes = providedClasses ?? fetchedClasses;
  const loading = typeof loadingOverride === 'boolean' ? loadingOverride : fetchedLoading;
  const displayedClasses = classes?.slice(0, maxRows) || [];

  const content = (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Class Name</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Sections</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Strength</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                <td className="py-3 px-4"><Skeleton className="h-4 w-36" /></td>
                <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
              </tr>
            ))
          ) : displayedClasses.length > 0 ? (
            displayedClasses.map(cls => (
              <tr key={cls._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="py-3 px-4 text-gray-900 dark:text-white">{cls.name}</td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                  <div className="flex flex-wrap gap-2">
                    {(cls.sections || []).map((section) => (
                      <span
                        key={section.section}
                        className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        {section.section}: {section.strength}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-medium">{cls.totalStrength ?? 0}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="py-4 px-4 text-center text-gray-500 dark:text-gray-400">No classes found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  if (standalone) {
    return <Card className="p-6">{content}</Card>;
  }

  return <div className="card p-6">{content}</div>;
}
