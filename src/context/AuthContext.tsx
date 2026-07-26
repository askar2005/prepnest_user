import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
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
  const loginInFlightRef = useRef(false);

  const fetchUser = async () => {
    const token = window.localStorage.getItem('prepnest_token');
    if (!token) { console.log('[AUTH-CTX] no token found, setting loading=false'); setLoading(false); return; }
    console.log('[AUTH-CTX] fetchUser: token found, calling /auth/me');
    try {
      const { data } = await apiClient.get('/auth/me');
      console.log('[AUTH-CTX] fetchUser SUCCESS:', data.user?.email || data?.email);
      setUser(data.user ?? data);
    } catch (err) {
      console.log('[AUTH-CTX] fetchUser FAILED, clearing token');
      window.localStorage.removeItem('prepnest_token');
      window.localStorage.removeItem('prepnest_user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { console.log('[AUTH-CTX] mounting, calling fetchUser'); fetchUser(); }, []);

  const login = async (email: string, password: string) => {
    if (loginInFlightRef.current) {
      console.log('[AUTH-CTX] DUPLICATE LOGIN BLOCKED');
      return;
    }
    loginInFlightRef.current = true;
    console.log('[AUTH-CTX] login called — email:', email);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      console.log('[AUTH-CTX] === LOGIN SUCCESS === token stored, user:', data.user?.email);
      window.localStorage.setItem('prepnest_token', data.token);
      window.localStorage.setItem('prepnest_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (err: any) {
      console.log('[AUTH-CTX] === LOGIN FAILED ===', err?.response?.status, err?.response?.data?.message);
      throw err;
    } finally {
      loginInFlightRef.current = false;
    }
  };

  const logout = () => {
    console.log('[AUTH-CTX] logout called');
    window.localStorage.removeItem('prepnest_token');
    window.localStorage.removeItem('prepnest_user');
    setUser(null);
    console.log('[AUTH-CTX] === LOGOUT COMPLETE === token removed, redirecting to /login');
    window.location.href = '/login';
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, refresh: fetchUser }}>
      {children}
    </AuthCtx.Provider>
  );
}