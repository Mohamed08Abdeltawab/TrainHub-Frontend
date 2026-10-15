import apiClient from './apiClient';

export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  isActive?: boolean;
}

export interface UpdateOrganizationProfileInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
}

export const organizationsApi = {
  async getAll(): Promise<OrganizationDto[]> {
    const { data } = await apiClient.get<OrganizationDto[]>('/organizations');
    return data || [];
  },

  async getCurrent(): Promise<OrganizationDto> {
    const { data } = await apiClient.get<OrganizationDto>('/organizations/current');
    return data;
  },

  async updateCurrent(input: UpdateOrganizationProfileInput): Promise<OrganizationDto> {
    const { data } = await apiClient.put<OrganizationDto>('/organizations/current', input);
    return data;
  },

  async getById(id: string): Promise<OrganizationDto> {
    const { data } = await apiClient.get<OrganizationDto>(`/organizations/${encodeURIComponent(id)}`);
    return data;
  },

  async create(input: CreateOrganizationInput): Promise<OrganizationDto> {
    const { data } = await apiClient.post<OrganizationDto>('/organizations', input);
    return data;
  },

  async update(id: string, input: UpdateOrganizationProfileInput): Promise<OrganizationDto> {
    const { data } = await apiClient.put<OrganizationDto>(`/organizations/${encodeURIComponent(id)}`, input);
    return data;
  },
};
