import { api } from './api';

export const authService = {
  login: async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    if (data?.accessToken) {
      try { localStorage.setItem('accessToken', data.accessToken); } catch (e) {}
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
    }
    return data;
  },
  logout: async () => {
    const res = await api.post('/auth/logout');
    try { localStorage.removeItem('accessToken'); } catch (e) {}
    delete api.defaults.headers.common.Authorization;
    return res.data;
  },
  refresh: async () => {
    const { data } = await api.post('/auth/refresh');
    if (data?.accessToken) {
      try { localStorage.setItem('accessToken', data.accessToken); } catch (e) {}
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
    }
    return data;
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  }
};
