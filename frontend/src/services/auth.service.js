// Mock implementation — replace calls with axios/api when backend is ready
export async function loginApi({ email, password }) {
  // simple mock: any email/password logs in; role detected by email prefix
  await new Promise((r) => setTimeout(r, 900));
  const role = email.startsWith('admin') ? 'admin' :
               email.startsWith('teacher') ? 'teacher' :
               email.startsWith('student') ? 'student' : 'student';
  return {
    user: { id: Date.now(), name: email.split('@')[0], role },
    token: 'MOCK.JWT.TOKEN',
  };
}

export async function sendOtpApi({ email }) {
  await new Promise((r) => setTimeout(r, 700));
  // store OTP in-memory (not persisted) — return success
  return { ok: true, message: 'OTP sent' };
}

export async function verifyOtpApi({ email, otp }) {
  await new Promise((r) => setTimeout(r, 700));
  // accept any OTP of length >= 3 in mock
  if (!otp || otp.length < 3) throw new Error('Invalid OTP');
  return { ok: true };
}

export async function resetPasswordApi({ email, password }) {
  await new Promise((r) => setTimeout(r, 700));
  return { ok: true };
}

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
