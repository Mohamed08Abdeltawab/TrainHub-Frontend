import apiClient from './apiClient';
import type { DashboardContent, DashboardRole } from '@/types/nav';

export const dashboardApi = {
  async getDashboardContent(role: DashboardRole): Promise<DashboardContent> {
    const { data } = await apiClient.get<DashboardContent>(`/dashboard/${role.toLowerCase()}`);
    return data;
  },
};
