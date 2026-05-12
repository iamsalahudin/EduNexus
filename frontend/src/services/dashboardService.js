import { api } from './api';

export const dashboardService = {
  getSummary: async () => {
    const { data } = await api.get('/dashboard/summary');
    return data;
  },

  getAttendanceToday: async () => {
    const { data } = await api.get('/dashboard/attendance-today');
    return data;
  },

  getFinanceOverview: async () => {
    const { data } = await api.get('/dashboard/finance-overview');
    return data;
  },

  getClassStrength: async () => {
    const { data } = await api.get('/dashboard/class-strength');
    return data;
  },

  getRecentActivities: async (limit = 10) => {
    const { data } = await api.get(`/dashboard/recent-activities?limit=${limit}`);
    return data;
  },

  getNotifications: async (limit = 20) => {
    const { data } = await api.get(`/dashboard/notifications?limit=${limit}`);
    return data;
  }
};

export default dashboardService;
