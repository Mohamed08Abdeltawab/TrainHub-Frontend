import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import type { DashboardRole } from '../types/nav';
import { demoUsers } from '../config/demoUsers';
import { authApi } from '../api/auth';
import apiClient from '../api/apiClient';

const SESSION_KEY = 'trainhub.session';

export type AuthUser = {
  id?: string;
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
  updateProfile: (updates: Pick<AuthUser, 'name' | 'email' | 'jobTitle' | 'phone' | 'timezone' | 'bio'>) => Promise<boolean> | boolean;
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

  // Validate session on mount against /currentuser
  useEffect(() => {
    let isMounted = true;
    async function validateBoot() {
      const token = localStorage.getItem('token');
      const session = readSession();
      if (session && !session.demo && token) {
        try {
          const { data } = await apiClient.get<{
            id: string;
            email: string;
            firstName?: string;
            lastName?: string;
            organizationName?: string;
            organizationId?: string;
          }>('/currentuser');
          if (isMounted && data) {
            setUser((prev) => (prev ? {
              ...prev,
              id: data.id || prev.id,
              name: [data.firstName, data.lastName].filter(Boolean).join(' ') || prev.name,
              email: data.email || prev.email,
              organization: data.organizationName || prev.organization,
              organizationId: data.organizationId || prev.organizationId,
            } : null));
          }
        } catch {
          // If token verification completely failed and storage cleared
          if (isMounted && !localStorage.getItem('token')) {
            setUser(null);
          }
        }
      }
    }
    void validateBoot();
    return () => { isMounted = false; };
  }, []);

  const saveSession = (nextUser: AuthUser | null, token?: string, refreshToken?: string) => {
    try {
      if (nextUser) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
        if (token) localStorage.setItem('token', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        else if (nextUser.demo) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      } else {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
      setUser(nextUser);
      return true;
    } catch {
      try {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      } catch { /* Keep the in-memory state signed out when storage is unavailable. */ }
      setUser(null);
      return false;
    }
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    async signIn(email, password) {
      const trimmedEmail = email.trim();
      try {
        const response = await authApi.login({ email: trimmedEmail, password });
        const validRoles: DashboardRole[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'INSTRUCTOR', 'STUDENT'];
        if (!response.token || !response.user?.email || !response.user.name || !validRoles.includes(response.user.role)) return 'unavailable';
        return saveSession({
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          organization: response.user.organization,
          organizationId: response.user.organizationId,
          role: response.user.role,
        }, response.token, response.refreshToken) ? response.user.role : 'unavailable';
      } catch (error) {
        // Authentication failures from backend are expected input errors
        if (axios.isAxiosError(error) && [400, 401, 403, 422].includes(error.response?.status ?? 0)) return 'invalid';
        return 'unavailable';
      }
    },
    enterDemo(role) {
      const demo = demoUsers[role];
      saveSession({ id: demo.id, name: demo.name, email: demo.email, role, demo: true });
    },
    signOut() {
      if (user && !user.demo) void authApi.logout().catch(() => undefined);
      saveSession(null);
    },
    async updateProfile(updates) {
      if (!user) return false;
      const nextUser = { ...user, ...updates };
      try {
        if (!user.demo) {
          const parts = updates.name ? updates.name.trim().split(/\s+/) : [];
          const firstName = parts[0] || user.name.split(/\s+/)[0];
          const lastName = parts.slice(1).join(' ') || '';
          await apiClient.put('/currentuser', {
            firstName,
            lastName,
            phoneNumber: updates.phone ?? user.phone,
          });
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
        return true;
      } catch {
        return false;
      }
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}
