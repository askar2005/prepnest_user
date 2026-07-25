import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient } from '../api/client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const AuthCtx = createContext<{
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthCtx);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = window.localStorage.getItem('prepnest_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await apiClient.get('/auth/me');
      setUser(data.user ?? data);
    } catch {
      window.localStorage.removeItem('prepnest_token');
      window.localStorage.removeItem('prepnest_user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const login = async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    window.localStorage.setItem('prepnest_token', data.token);
    window.localStorage.setItem('prepnest_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    window.localStorage.removeItem('prepnest_token');
    window.localStorage.removeItem('prepnest_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, refresh: fetchUser }}>
      {children}
    </AuthCtx.Provider>
  );
}