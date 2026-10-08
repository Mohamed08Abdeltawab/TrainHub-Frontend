import { useQuery } from '@tanstack/react-query';
import type { DashboardContent, DashboardRole } from '@/types/nav';
import { dashboardContent } from '@/config/dashboard';
import { dashboardApi } from '@/api/dashboard';
import { useAuth } from '@/auth/AuthContext';

export function useDashboardData(role: DashboardRole, enabled = true) {
  const { user } = useAuth();
  return useQuery<DashboardContent>({
    queryKey: ['dashboard', role, user?.organizationId ?? null, user?.email ?? null, Boolean(user?.demo)],
    enabled,
    queryFn: async () => {
      try {
        return await dashboardApi.getDashboardContent(role);
      } catch (error) {
        if (role === 'STUDENT' || user?.demo) return dashboardContent[role];
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
