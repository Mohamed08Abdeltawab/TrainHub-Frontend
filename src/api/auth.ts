import apiClient from './apiClient';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
} from './types';

import type { DashboardRole } from '@/types/nav';

function mapRole(backendRoles?: string[]): DashboardRole {
  if (!backendRoles || !Array.isArray(backendRoles)) return 'ORG_ADMIN';
  if (backendRoles.includes('SuperAdmin')) return 'SUPER_ADMIN';
  if (backendRoles.includes('OrgAdmin')) return 'ORG_ADMIN';
  if (backendRoles.includes('Instructor')) return 'INSTRUCTOR';
  if (backendRoles.includes('Student')) return 'STUDENT';
  return 'ORG_ADMIN';
}

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<any>('/auth/login', payload);

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

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    const { data } = await apiClient.post<RegisterResponse>('/auth/register', payload);
    return data;
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
