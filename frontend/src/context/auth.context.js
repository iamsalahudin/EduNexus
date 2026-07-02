'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (payload) => {
    const data = await authService.login(payload);
    setUser(data.user);
    setRole(data.user.role);
    router.push(`/${data.user.role}`);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setRole(null);
    router.push('/login');
  };

  const fetchMe = async () => {
    try {
      const data = await authService.me();
      setUser(data.user);
      setRole(data.user.role);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, role, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
