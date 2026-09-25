import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { DashboardRole } from '../types/nav';
import { demoUsers } from '../config/demoUsers';
import { signInLocalAccount } from '../utils/localAuth';

const SESSION_KEY = 'trainhub.session';

export type AuthUser = {
  name: string;
  email: string;
  organization?: string;
  role: DashboardRole;
  demo?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<'success' | 'invalid' | 'unavailable'>;
  enterDemo: (role: DashboardRole) => void;
  signOut: () => void;
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

  const saveSession = (nextUser: AuthUser | null) => {
    try {
      if (nextUser) localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
      else localStorage.removeItem(SESSION_KEY);
      setUser(nextUser);
      return true;
    } catch {
      setUser(null);
      return false;
    }
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    async signIn(email, password) {
      try {
        const account = await signInLocalAccount(email, password);
        if (!account) return 'invalid';
        return saveSession({ name: account.name, email: account.email, organization: account.organization, role: 'ORG_ADMIN' }) ? 'success' : 'unavailable';
      } catch {
        return 'unavailable';
      }
    },
    enterDemo(role) {
      const demo = demoUsers[role];
      saveSession({ name: demo.name, email: demo.email, role, demo: true });
    },
    signOut() {
      try { localStorage.removeItem('token'); } catch { /* Ignore unavailable storage. */ }
      saveSession(null);
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}
