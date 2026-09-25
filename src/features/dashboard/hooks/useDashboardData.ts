import { useQuery } from '@tanstack/react-query';
import type { DashboardContent, DashboardRole } from '@/types/nav';
import { dashboardContent } from '@/config/dashboard';
import { dashboardApi } from '@/api/dashboard';

export function useDashboardData(role: DashboardRole) {
  return useQuery<DashboardContent>({
    queryKey: ['dashboard', role],
    queryFn: async () => {
      try {
        return await dashboardApi.getDashboardContent(role);
      } catch {
        // Fallback to local configuration mock when remote API is unreachable
        return dashboardContent[role];
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}
