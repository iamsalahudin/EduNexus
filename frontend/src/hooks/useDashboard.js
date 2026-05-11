'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { dashboardService } from '@/services/dashboardService';

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

      const promises = [];

      if (fetchSummary) promises.push(dashboardService.getSummary());
      if (fetchAttendance) promises.push(dashboardService.getAttendanceToday());
      if (fetchFinance) promises.push(dashboardService.getFinanceOverview());
      if (fetchClasses) promises.push(dashboardService.getClassStrength());
      if (fetchActivities) promises.push(dashboardService.getRecentActivities());
      if (fetchNotifications) promises.push(dashboardService.getNotifications());

      const results = await Promise.all(promises);

      let index = 0;

      setData(prev => {
        const newData = { ...prev };
        let index = 0;
        if (fetchSummary) {
          const result = results[index++];
          if (result) newData.summary = result;
        }
        if (fetchAttendance) {
          const result = results[index++];
          if (result) newData.attendance = result;
        }
        if (fetchFinance) {
          const result = results[index++];
          if (result) newData.finance = result;
        }
        if (fetchClasses) {
          const result = results[index++];
          if (result && result.length > 0) newData.classes = result;
        }
        if (fetchActivities) {
          const result = results[index++];
          if (result && result.length > 0) newData.activities = result;
        }
        if (fetchNotifications) {
          const result = results[index++];
          if (result && result.length > 0) newData.notifications = result;
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
  }, [fetchSummary, fetchAttendance, fetchFinance, fetchClasses, fetchActivities, fetchNotifications]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]); // initial load only

  useEffect(() => {
    if (!autoRefreshInterval) return;
    const interval = setInterval(fetchAllData, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [fetchAllData, autoRefreshInterval]); // interval separately

  return {
    ...data,
    loading,
    refreshing,
    error,
    refetch: fetchAllData
  };
}