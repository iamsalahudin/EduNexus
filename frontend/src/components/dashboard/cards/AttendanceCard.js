'use client';

import Skeleton from '@/components/ui/Skeleton';

export function AttendanceCard({ title, students, teachers, loading }) {
  if (loading) {
    return (
      <div className="card p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    );
  }

  const studentMetrics = [
    { label: 'Present', value: students?.present || 0, bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' },
    { label: 'Absent', value: students?.absent || 0, bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' },
    { label: 'Late', value: students?.late || 0, bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400' },
    { label: 'Excused', value: students?.excused || 0, bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' }
  ];

  return (
    <div className="card p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Students</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {studentMetrics.map(m => (
              <div key={m.label} className={`${m.bg} rounded-lg p-3 text-center`}>
                <p className={`text-2xl font-bold ${m.text}`}>{m.value}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {teachers && (
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 mt-4">Teachers</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Present', value: teachers?.present || 0, bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' },
                { label: 'Absent', value: teachers?.absent || 0, bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' },
                { label: 'Late', value: teachers?.late || 0, bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400' }
              ].map(m => (
                <div key={m.label} className={`${m.bg} rounded-lg p-3 text-center`}>
                  <p className={`text-xl font-bold ${m.text}`}>{m.value}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
