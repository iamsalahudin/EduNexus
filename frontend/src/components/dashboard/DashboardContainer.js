'use client';

import { RefreshCw } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { StatCard } from '@/components/dashboard/cards/StatCard';
import { AttendanceCard } from '@/components/dashboard/cards/AttendanceCard';
import { FinanceCard } from '@/components/dashboard/cards/FinanceCard';
import { FinanceChart } from '@/components/dashboard/charts/FinanceChart';
import { ClassStrengthTable } from '@/components/dashboard/sections/ClassStrengthTable';
import { NotificationsPanel } from '@/components/dashboard/sections/NotificationsPanel';
import { ActivitiesPanel } from '@/components/dashboard/sections/ActivitiesPanel';

// Add to your global CSS:
// @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-2.5">
      <Skeleton className="h-3.5 w-3/5" />
      <Skeleton className="h-7 w-2/5 [animation-delay:100ms]" />
      <Skeleton className="h-3 w-4/5 [animation-delay:200ms]" />
    </div>
  );
}

function AttendanceCardSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-3.5">
      <Skeleton className="h-3.5 w-1/3" />
      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-1/2" style={{ animationDelay: `${i * 100}ms` }} />
            <Skeleton className="h-5 w-1/3" style={{ animationDelay: `${i * 100 + 50}ms` }} />
            <Skeleton className="h-2 w-full rounded-full" style={{ animationDelay: `${i * 100 + 100}ms` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FinanceCardSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-3.5">
      <Skeleton className="h-3.5 w-2/5" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-3/4" style={{ animationDelay: `${i * 100}ms` }} />
            <Skeleton className="h-5 w-1/2" style={{ animationDelay: `${i * 100 + 50}ms` }} />
          </div>
        ))}
      </div>
      <Skeleton className="h-2 w-full rounded-full [animation-delay:200ms]" />
      <Skeleton className="h-3 w-1/2 [animation-delay:250ms]" />
    </div>
  );
}

function FinanceChartSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-3.5">
      <Skeleton className="h-3.5 w-2/5" />
      <Skeleton className="h-48 w-full [animation-delay:100ms]" />
    </div>
  );
}

function PanelSkeleton({ rows = 5 }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <Skeleton className="h-3.5 w-1/2" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <Skeleton
            className="h-8 w-8 rounded-full shrink-0"
            style={{ animationDelay: `${i * 50}ms` }}
          />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-3 w-full" style={{ animationDelay: `${i * 50 + 50}ms` }} />
            <Skeleton className="h-3 w-2/3" style={{ animationDelay: `${i * 50 + 100}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 10 }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-3" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex flex-col gap-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((j) => (
              <Skeleton
                key={j}
                className="h-3"
                style={{ animationDelay: `${(i + j) * 50}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardContainer() {
  const {
    summary,
    attendance,
    finance,
    classes,
    activities,
    notifications,
    loading,
    refreshing,
    refetch
  } = useDashboard();

  // Show skeletons ONLY on first load before any data arrives.
  // Once data exists, never replace it with skeletons — even if loading flickers.
  const hasData = summary !== null;
  const initialLoading = loading && !hasData;

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header — always visible */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Welcome back to your school management system</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {initialLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Total Students"
                value={summary?.students?.total ?? 0}
                color="primary"
                loading={false}
                subtitle={`Active: ${summary?.students?.active ?? 0} | Inactive: ${summary?.students?.inactive ?? 0}`}
              />
              <StatCard
                title="Total Teachers"
                value={summary?.teachers?.total ?? 0}
                color="secondary"
                loading={false}
                subtitle={`Active: ${summary?.teachers?.active ?? 0} | Inactive: ${summary?.teachers?.inactive ?? 0}`}
              />
              <StatCard
                title="Total Parents"
                value={summary?.parents?.total ?? 0}
                color="primary"
                loading={false}
                subtitle={`Active: ${summary?.parents?.active ?? 0} | Inactive: ${summary?.parents?.inactive ?? 0}`}
              />
              <StatCard
                title="Total Classes"
                value={summary?.classes?.total ?? 0}
                color="secondary"
                loading={false}
                subtitle={`Active: ${summary?.classes?.active ?? 0} | Inactive: ${summary?.classes?.inactive ?? 0}`}
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {initialLoading ? (
              <>
                <AttendanceCardSkeleton />
                <FinanceCardSkeleton />
                <FinanceChartSkeleton />
              </>
            ) : (
              <>
                <AttendanceCard
                  title="Today's Attendance"
                  students={attendance?.students}
                  teachers={attendance?.teachers}
                  loading={false}
                />
                <FinanceCard
                  title="Monthly Fees Collection"
                  data={{
                    generated: summary?.fees?.monthlyData?.generated || 0,
                    received: summary?.fees?.monthlyData?.received || 0,
                    pending: summary?.fees?.monthlyData?.pending || 0,
                    percentage: summary?.fees?.collectionPercentage || 0
                  }}
                  loading={false}
                />
                <FinanceChart
                  data={finance?.graphData}
                  loading={false}
                  title="Collections vs Expenses"
                />
              </>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {initialLoading ? (
              <>
                <PanelSkeleton rows={8} />
                <PanelSkeleton rows={5} />
              </>
            ) : (
              <>
                <NotificationsPanel notifications={notifications} loading={false} maxNotifications={8} />
                <ActivitiesPanel activities={activities} loading={false} maxActivities={5} />
              </>
            )}
          </div>
        </div>

        {/* Class Strength Table */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Class Strength</h2>
          {initialLoading ? (
            <TableSkeleton rows={10} />
          ) : (
            <ClassStrengthTable classes={classes} loading={false} maxRows={10} />
          )}
        </div>

      </div>
    </div>
  );
}