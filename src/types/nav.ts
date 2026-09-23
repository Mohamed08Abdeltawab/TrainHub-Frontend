export type DashboardRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export type NavItem = {
  label: string;
  icon: 'overview' | 'courses' | 'learners' | 'settings' | 'calendar' | 'reports' | 'organization' | 'assignments';
};

export type DashboardMetric = { label: string; value: string; note: string };
export type DashboardRow = { title: string; detail: string; status: string };

export type DashboardContent = {
  tenant: string;
  plan: string;
  section: string;
  title: string;
  description: string;
  action: string;
  metrics: DashboardMetric[];
  tableTitle: string;
  subtitle: string;
  rows: DashboardRow[];
  scope: string;
  capabilities: string[];
};
