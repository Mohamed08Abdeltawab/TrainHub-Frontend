import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import type { DashboardRole } from '../types/nav';
import { demoUsers } from '../config/demoUsers';
import { authApi } from '../api/auth';

const SESSION_KEY = 'trainhub.session';

export type AuthUser = {
  name: string;
  email: string;
  organization?: string;
  organizationId?: string;
  role: DashboardRole;
  demo?: boolean;
  jobTitle?: string;
  phone?: string;
  timezone?: string;
  bio?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<DashboardRole | 'invalid' | 'unavailable'>;
  enterDemo: (role: DashboardRole) => void;
  signOut: () => void;
  updateProfile: (updates: Pick<AuthUser, 'name' | 'email' | 'jobTitle' | 'phone' | 'timezone' | 'bio'>) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): AuthUser | null {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as AuthUser | null;
    if (value && typeof value.email === 'string' && typeof value.name === 'string' &&
      ['SUPER_ADMIN', 'ORG_ADMIN', 'INSTRUCTOR', 'STUDENT'].includes(value.role)) return value;
  } catch { /* Ignore invalid or unavailable browser storage. */ }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readSession);

  const saveSession = (nextUser: AuthUser | null, token?: string) => {
    try {
      if (nextUser) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
        if (token) localStorage.setItem('token', token);
        else if (nextUser.demo) localStorage.removeItem('token');
      } else {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('token');
      }
      setUser(nextUser);
      return true;
    } catch {
      try {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('token');
      } catch { /* Keep the in-memory state signed out when storage is unavailable. */ }
      setUser(null);
      return false;
    }
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    async signIn(email, password) {
      try {
        const response = await authApi.login({ email: email.trim(), password });
        const validRoles: DashboardRole[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'INSTRUCTOR', 'STUDENT'];
        if (!response.token || !response.user?.email || !response.user.name || !validRoles.includes(response.user.role)) return 'unavailable';
        return saveSession({
          name: response.user.name,
          email: response.user.email,
          organization: response.user.organization,
          organizationId: response.user.organizationId,
          role: response.user.role,
        }, response.token) ? response.user.role : 'unavailable';
      } catch (error) {
        // Authentication failures are expected input errors; other failures indicate
        // the API could not complete the request.
        if (axios.isAxiosError(error) && [400, 401, 403, 422].includes(error.response?.status ?? 0)) return 'invalid';
        return 'unavailable';
      }
    },
    enterDemo(role) {
      const demo = demoUsers[role];
      saveSession({ name: demo.name, email: demo.email, role, demo: true });
    },
    signOut() {
      if (user && !user.demo) void authApi.logout().catch(() => undefined);
      saveSession(null);
    },
    updateProfile(updates) {
      if (!user) return false;
      const nextUser = { ...user, ...updates };
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
        return true;
      } catch { return false; }
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}
