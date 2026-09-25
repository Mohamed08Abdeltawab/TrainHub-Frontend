export const ROUTES = {
  HOME: '/',
  LOGIN: '/',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  ADMIN_DASHBOARD: '/admin/organizations/:orgId',
  INSTRUCTOR_DASHBOARD: '/instructor',
  STUDENT_DASHBOARD: '/student',
  NOT_FOUND: '*',
} as const;

export const buildAdminDashboardPath = (orgId: string = 'demo') =>
  `/admin/organizations/${orgId}`;
