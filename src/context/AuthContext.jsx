import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true); // true until first refresh attempt resolves

  // On mount: try to silently restore the session from the refresh cookie.
  // We piggyback on the axios 401-refresh by calling /auth/refresh directly
  // through the interceptor-free path below.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { api, setAccessToken } = await import('../services/api.js');
        const { data } = await api.post('/auth/refresh');
        if (!cancelled && data?.data?.user) {
          setAccessToken(data.data.accessToken);
          setUser(data.data.user);
        }
      } catch {
        /* No valid session — stay logged out. */
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: u } = await authService.login(email, password);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = { user, booting, login, logout, isManager: ['Admin', 'Manager'].includes(user?.role) };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
