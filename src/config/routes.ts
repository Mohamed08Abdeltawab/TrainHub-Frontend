export const ROUTES = {
  HOME: '/',
  LOGIN: '/',
  REGISTER: '/register',
  SUPER_ADMIN_DASHBOARD: '/platform',
  ADMIN_DASHBOARD: '/admin/organizations/:orgId',
  INSTRUCTOR_DASHBOARD: '/instructor',
  STUDENT_DASHBOARD: '/student',
  NOT_FOUND: '*',
} as const;

export const buildAdminDashboardPath = (orgId: string = 'demo') =>
  `/admin/organizations/${orgId}`;
