import type { DashboardRole, NavItem } from '../types/nav';

export const roleLabels: Record<DashboardRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Org Admin',
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Student',
};

export const roleNavigation: Record<DashboardRole, NavItem[]> = {
  SUPER_ADMIN: [
    { label: 'Overview', icon: 'overview', group: 'Workspace' },
    { label: 'Organizations', icon: 'organization', group: 'Platform' },
    { label: 'Platform users', icon: 'learners', group: 'Platform' },
    { label: 'User profile', icon: 'learners', group: 'Account' },
  ],
  ORG_ADMIN: [
    { label: 'Overview', icon: 'overview', group: 'Workspace' },
    { label: 'Courses', icon: 'courses', group: 'Training' },
    { label: 'Cohorts', icon: 'calendar', group: 'Training' },
    { label: 'Sessions', icon: 'calendar', group: 'Training' },
    { label: 'Attendance', icon: 'calendar', group: 'Training' },
    { label: 'Schedule', icon: 'calendar', group: 'Training' },
    { label: 'Learners', icon: 'learners', group: 'People' },
    { label: 'Instructors', icon: 'learners', group: 'People' },
    { label: 'Organization profile', icon: 'organization', group: 'Organization' },
    { label: 'Organization settings', icon: 'settings', group: 'Organization' },
    { label: 'User profile', icon: 'learners', group: 'Account' },
  ],
  INSTRUCTOR: [
    { label: 'Overview', icon: 'overview', group: 'Workspace' },
    { label: 'My courses', icon: 'courses', group: 'Teaching' },
    { label: 'My cohorts', icon: 'calendar', group: 'Teaching' },
    { label: 'Assignments', icon: 'assignments', group: 'Teaching' },
    { label: 'Sessions', icon: 'calendar', group: 'Teaching' },
    { label: 'Attendance', icon: 'calendar', group: 'Teaching' },
    { label: 'Schedule', icon: 'calendar', group: 'Teaching' },
    { label: 'Learners', icon: 'learners', group: 'People' },
    { label: 'User profile', icon: 'learners', group: 'Account' },
  ],
  STUDENT: [
    { label: 'Overview', icon: 'overview', group: 'Workspace' },
    { label: 'My courses', icon: 'courses', group: 'Learning' },
    { label: 'My schedule', icon: 'calendar', group: 'Learning' },
    { label: 'Attendance', icon: 'calendar', group: 'Learning' },
    { label: 'User profile', icon: 'learners', group: 'Account' },
  ],
};
