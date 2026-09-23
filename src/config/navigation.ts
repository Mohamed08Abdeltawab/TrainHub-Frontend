import type { DashboardRole, NavItem } from '../types/nav';

export const roleLabels: Record<DashboardRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Org Admin',
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Student',
};

export const roleNavigation: Record<DashboardRole, NavItem[]> = {
  SUPER_ADMIN: [
    { label: 'Overview', icon: 'overview' }, { label: 'Organizations', icon: 'organization' },
    { label: 'Subscriptions', icon: 'reports' }, { label: 'Platform users', icon: 'learners' },
    { label: 'Reports', icon: 'reports' }, { label: 'Settings', icon: 'settings' },
  ],
  ORG_ADMIN: [
    { label: 'Overview', icon: 'overview' }, { label: 'Courses', icon: 'courses' },
    { label: 'Cohorts', icon: 'calendar' }, { label: 'Learners', icon: 'learners' },
    { label: 'Instructors', icon: 'learners' }, { label: 'Assignments', icon: 'assignments' },
    { label: 'Reports', icon: 'reports' }, { label: 'Settings', icon: 'settings' },
  ],
  INSTRUCTOR: [
    { label: 'Overview', icon: 'overview' }, { label: 'My courses', icon: 'courses' },
    { label: 'My cohorts', icon: 'calendar' }, { label: 'Assignments', icon: 'assignments' },
    { label: 'Learners', icon: 'learners' }, { label: 'Schedule', icon: 'calendar' },
  ],
  STUDENT: [
    { label: 'Overview', icon: 'overview' }, { label: 'My courses', icon: 'courses' },
    { label: 'My schedule', icon: 'calendar' }, { label: 'Assignments', icon: 'assignments' },
    { label: 'Certificates', icon: 'reports' },
  ],
};
