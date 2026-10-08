import axios from 'axios';
import apiClient from './apiClient';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
} from './types';
import { demoUsers } from '@/config/demoUsers';
import type { DashboardRole } from '@/types/nav';

function mapRole(backendRoles?: string[]): DashboardRole {
  if (!backendRoles || !Array.isArray(backendRoles)) return 'ORG_ADMIN';
  if (backendRoles.includes('SuperAdmin')) return 'SUPER_ADMIN';
  if (backendRoles.includes('OrgAdmin')) return 'ORG_ADMIN';
  if (backendRoles.includes('Instructor')) return 'INSTRUCTOR';
  if (backendRoles.includes('Student')) return 'STUDENT';
  return 'ORG_ADMIN';
}

interface BackendAuthResponse {
  accessToken?: string;
  token?: string;
  roles?: string[];
  userId?: string;
  email?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  organizationName?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: DashboardRole;
    organization?: string;
    organizationId?: string;
  };
}

function saveLocalRegisteredUser(user: { id?: string; name: string; email: string; password?: string; organization: string; organizationId?: string; role?: DashboardRole }) {
  try {
    const raw = localStorage.getItem('trainhub.registered_users');
    const list = raw ? JSON.parse(raw) : [];
    const normalized = user.email.toLowerCase();
    const existingIdx = list.findIndex((u: { email?: string }) => u?.email?.toLowerCase() === normalized);
    const entry = {
      id: user.id || `user-${Date.now()}`,
      name: user.name,
      email: user.email,
      password: user.password,
      organization: user.organization,
      organizationId: user.organizationId || `org-${Date.now()}`,
      role: user.role || ('ORG_ADMIN' as DashboardRole),
    };
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...entry };
    } else {
      list.push(entry);
    }
    localStorage.setItem('trainhub.registered_users', JSON.stringify(list));
  } catch { /* storage unavailable */ }
}

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<BackendAuthResponse>('/auth/login', payload);

    const token = data.accessToken || data.token || '';
    const roles = data.roles || (data.user?.role ? [data.user.role] : []);
    const role: DashboardRole = data.user?.role || mapRole(roles);
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
    const name = data.user?.name || fullName || data.userName || data.email || payload.email;
    const orgId = data.organizationId || data.user?.organizationId;
    const orgName = data.organizationName || data.user?.organization;

    return {
      token,
      user: {
        id: data.userId || data.user?.id || '',
        name,
        email: data.email || data.user?.email || payload.email,
        role,
        organization: orgName,
        organizationId: orgId,
      },
    };
  },

  async register(payload: RegisterRequest & { confirmPassword?: string; organizationId?: string }): Promise<RegisterResponse> {
    const normalizedEmail = payload.email.trim().toLowerCase();

    // 1. Check duplicate against demo users
    const isDemoEmail = Object.values(demoUsers).some((u) => u.email.toLowerCase() === normalizedEmail);
    if (isDemoEmail) {
      const err = new Error('An account with this email already exists. Sign in instead.');
      Object.assign(err, { response: { status: 409, data: { detail: err.message } } });
      throw err;
    }

    // 2. Check duplicate against local registered users
    try {
      const raw = localStorage.getItem('trainhub.registered_users');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.some((u) => typeof u?.email === 'string' && u.email.toLowerCase() === normalizedEmail)) {
          const err = new Error('An account with this email already exists. Sign in instead.');
          Object.assign(err, { response: { status: 409, data: { detail: err.message } } });
          throw err;
        }
      }
    } catch { /* continue */ }

    // 3. Format payload for backend DTO
    const nameParts = payload.name.trim().split(/\s+/);
    const firstName = nameParts[0] || payload.name.trim();
    const lastName = nameParts.slice(1).join(' ') || firstName;

    try {
      const { data } = await apiClient.post<RegisterResponse>('/auth/register', {
        firstName,
        lastName,
        name: payload.name.trim(),
        email: payload.email.trim(),
        password: payload.password,
        confirmPassword: payload.confirmPassword || payload.password,
        organization: payload.organization.trim(),
        organizationId: payload.organizationId,
      });
      saveLocalRegisteredUser({
        name: payload.name.trim(),
        email: payload.email.trim(),
        password: payload.password,
        organization: payload.organization.trim(),
      });
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        throw error;
      }
      if (axios.isAxiosError(error) && error.response?.status === 400 && (error.response.data as { errors?: unknown })?.errors) {
        throw error;
      }

      // Offline or mock standalone MVP fallback
      const localUser = {
        id: `user-${Date.now()}`,
        name: payload.name.trim(),
        email: payload.email.trim(),
        password: payload.password,
        organization: payload.organization.trim(),
        organizationId: `org-${Date.now()}`,
        role: 'ORG_ADMIN' as DashboardRole,
      };
      saveLocalRegisteredUser(localUser);
      return {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
      };
    }
  },

  async forgotPassword(payload: ForgotPasswordRequest): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/auth/forgot-password', payload);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Allow logout to proceed locally even if server revocation is unavailable
    }
  },
};
