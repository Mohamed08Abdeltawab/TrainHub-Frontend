import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import type { DashboardRole } from '../types/nav';
import { demoUsers } from '../config/demoUsers';
import { authApi } from '../api/auth';

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
      const trimmedEmail = email.trim();
      const normalizedEmail = trimmedEmail.toLowerCase();
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
        }, response.token) ? response.user.role : 'unavailable';
      } catch (error) {
        // Check if user matches a locally registered account
        try {
          const rawRegistered = localStorage.getItem('trainhub.registered_users');
          if (rawRegistered) {
            const list = JSON.parse(rawRegistered);
            if (Array.isArray(list)) {
              const matchedLocal = list.find((item) => typeof item?.email === 'string' && item.email.toLowerCase() === normalizedEmail);
              if (matchedLocal) {
                if (matchedLocal.password === password) {
                  const role: DashboardRole = matchedLocal.role || 'ORG_ADMIN';
                  return saveSession({
                    id: matchedLocal.id || 'local-user',
                    name: matchedLocal.name || 'Organization Owner',
                    email: matchedLocal.email,
                    organization: matchedLocal.organization || 'My Training Center',
                    organizationId: matchedLocal.organizationId || 'local-org',
                    role,
                  }, 'mock-local-token-' + Date.now()) ? role : 'unavailable';
                }
                return 'invalid';
              }
            }
          }
        } catch { /* storage fallback */ }

        // Check if credentials match a built-in MVP demo user
        const matchedDemo = Object.values(demoUsers).find(
          (item) => item.email.toLowerCase() === normalizedEmail
        );
        if (matchedDemo) {
          if (password.length >= 6) {
            return saveSession({
              id: matchedDemo.id,
              name: matchedDemo.name,
              email: matchedDemo.email,
              role: matchedDemo.role,
              organization: 'Al-Amal Training Center',
              demo: true,
            }) ? matchedDemo.role : 'unavailable';
          }
          return 'invalid';
        }

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
