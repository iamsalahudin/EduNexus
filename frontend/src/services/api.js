// src/services/api.js
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// attach access token from localStorage if available
api.interceptors.request.use((config) => {
  try {
    const token = typeof window !== 'undefined' && localStorage.getItem('accessToken');
    if (token && config && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// handle 401 by attempting refresh once
api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        if (data?.accessToken) {
          try { localStorage.setItem('accessToken', data.accessToken); } catch (e) {}
          api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        // refresh failed, forward original error
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

