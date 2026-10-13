import type { DashboardRole } from '@/types/nav';

export type ApiResponse<T> = {
  data: T;
  message?: string;
  success: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: DashboardRole;
    organization?: string;
    organizationId?: string;
  };
};

export type RegisterRequest = {
  name: string;
  organization: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  id: string;
  name: string;
  email: string;
};
