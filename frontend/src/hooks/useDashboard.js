'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { dashboardService } from '@/services/dashboardService';
import notificationsService from '@/services/notificationsService';

const notificationPriorityMap = {
  critical: 'high',
  warning: 'high',
  pending: 'medium',
  reminder: 'medium',
  normal: 'low',
  info: 'low',
  success: 'low',
  system: 'low'
};

function getNotificationPriority(category, kind) {
  if (category && notificationPriorityMap[category]) return notificationPriorityMap[category];
  if (kind === 'request') return 'medium';
  return 'low';
}

function getNotificationTimestamp(item) {
  const raw = item?.updatedAt || item?.createdAt || item?.timestamp || 0;
  const value = new Date(raw).getTime();
  return Number.isFinite(value) ? value : 0;
}

function normalizeInboxNotifications(payload) {
  const notifications = Array.isArray(payload?.notifications) ? payload.notifications : [];
  const requests = Array.isArray(payload?.requests) ? payload.requests : [];
  const merged = [
    ...notifications.map((item) => ({ ...item, kind: item.kind || 'broadcast' })),
    ...requests.map((item) => ({ ...item, kind: item.kind || 'request' }))
  ];

  return merged.map((item) => ({
    id: item._id || item.id,
    title: item.title || 'Notification',
    message: item.body || item.thread?.[0]?.message || 'No message provided.',
    priority: getNotificationPriority(item.category, item.kind),
    timestamp: getNotificationTimestamp(item),
    isRead: Boolean(item.isRead)
  }));
}

function combineNotifications(dashboardNotifications, inboxPayload, limit = 20) {
  const dashboardList = Array.isArray(dashboardNotifications) ? dashboardNotifications : [];
  const normalizedInbox = normalizeInboxNotifications(inboxPayload);
  const normalizedDashboard = dashboardList.map((item) => ({
    ...item,
    timestamp: getNotificationTimestamp(item),
    isRead: Boolean(item.isRead)
  }));

  return [...normalizedInbox, ...normalizedDashboard]
    .filter((item) => !item.isRead)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, limit);
}

export function useDashboard(options = {}) {
  const {
    fetchSummary = true,
    fetchAttendance = true,
    fetchFinance = true,
    fetchClasses = true,
    fetchActivities = true,
    fetchNotifications = true,
    autoRefreshInterval = 60000,
  } = options;
  const shouldFetchAny = fetchSummary || fetchAttendance || fetchFinance || fetchClasses || fetchActivities || fetchNotifications;

  const [data, setData] = useState({
    summary: null,
    attendance: null,
    finance: null,
    classes: [],
    activities: [],
    notifications: []
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const hasDataRef = useRef(false);
  const isFetchingRef = useRef(false); // guard against concurrent calls

  const fetchAllData = useCallback(async () => {
    if (!shouldFetchAny) {
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
      hasDataRef.current = true;
      return;
    }

    // Prevent overlapping fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (!hasDataRef.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const results = await Promise.all([
        fetchSummary ? dashboardService.getSummary() : null,
        fetchAttendance ? dashboardService.getAttendanceToday() : null,
        fetchFinance ? dashboardService.getFinanceOverview() : null,
        fetchClasses ? dashboardService.getClassStrength() : null,
        fetchActivities ? dashboardService.getRecentActivities() : null,
        fetchNotifications ? dashboardService.getNotifications() : null,
        fetchNotifications ? notificationsService.inbox({ limit: 25 }) : null
      ]);

      setData(prev => {
        const newData = { ...prev };
        const [
          summaryResult,
          attendanceResult,
          financeResult,
          classesResult,
          activitiesResult,
          dashboardNotificationsResult,
          inboxResult
        ] = results;

        if (fetchSummary && summaryResult) newData.summary = summaryResult;
        if (fetchAttendance && attendanceResult) newData.attendance = attendanceResult;
        if (fetchFinance && financeResult) newData.finance = financeResult;
        if (fetchClasses && Array.isArray(classesResult)) newData.classes = classesResult;
        if (fetchActivities && Array.isArray(activitiesResult)) newData.activities = activitiesResult;
        if (fetchNotifications) {
          newData.notifications = combineNotifications(
            dashboardNotificationsResult,
            inboxResult,
            20
          );
        }

        return newData;
      });

      hasDataRef.current = true;
    } catch (err) {
      console.error('[useDashboard] fetch failed', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [shouldFetchAny, fetchSummary, fetchAttendance, fetchFinance, fetchClasses, fetchActivities, fetchNotifications]);

  useEffect(() => {
    if (!shouldFetchAny) {
      setLoading(false);
      return;
    }

    fetchAllData();
  }, [fetchAllData]); // initial load only

  useEffect(() => {
    if (!autoRefreshInterval || !shouldFetchAny) return;
    const interval = setInterval(fetchAllData, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [fetchAllData, autoRefreshInterval, shouldFetchAny]); // interval separately

  return {
    ...data,
    loading,
    refreshing,
    error,
    refetch: fetchAllData
  };
}