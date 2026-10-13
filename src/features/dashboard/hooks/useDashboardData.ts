import { useQuery } from '@tanstack/react-query';
import type { DashboardContent, DashboardRole } from '@/types/nav';
import { dashboardApi } from '@/api/dashboard';
import { useAuth } from '@/auth/AuthContext';

export function useDashboardData(role: DashboardRole, enabled = true) {
  const { user } = useAuth();
  return useQuery<DashboardContent>({
    queryKey: ['dashboard', role, user?.organizationId ?? null, user?.email ?? null],
    enabled,
    queryFn: async () => {
      return await dashboardApi.getDashboardContent(role);
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
