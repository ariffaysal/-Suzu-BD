'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Admin } from '@/types';
import {
  clearStoredToken,
  getMe,
  getStoredToken,
  loginAdmin,
  storeToken,
} from '@/services/auth';

interface AuthContextValue {
  /** Current signed-in admin, or null when logged out. */
  admin: Admin | null;
  isAuthenticated: boolean;
  /** True while restoring the session from the stored token on mount. */
  isLoading: boolean;
  /** Logs in an admin. Throws with the server's error message on failure. */
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session from the stored JWT and validate it with the server.
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    getMe(token)
      .then(setAdmin)
      .catch(() => {
        // Invalid or expired token — drop it.
        clearStoredToken();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken } = await loginAdmin(email, password);
    storeToken(accessToken);
    const me = await getMe(accessToken);
    setAdmin(me);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: admin !== null, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
