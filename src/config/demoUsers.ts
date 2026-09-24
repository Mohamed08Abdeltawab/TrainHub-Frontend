import type { DashboardRole } from '../types/nav';

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: DashboardRole;
  roleTitle: string;
  description: string;
  path: string;
  avatarColor: string;
};

export const demoUsers: Record<DashboardRole, DemoUser> = {
  ORG_ADMIN: {
    id: 'user-admin',
    name: 'Alex Morgan',
    email: 'alex.morgan@trainhub.io',
    initials: 'AM',
    role: 'ORG_ADMIN',
    roleTitle: 'Organization Admin',
    description: 'Workspace & training center manager',
    path: '/admin/organizations/demo',
    avatarColor: 'bg-indigo-600',
  },
  INSTRUCTOR: {
    id: 'user-instructor',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@trainhub.io',
    initials: 'SJ',
    role: 'INSTRUCTOR',
    roleTitle: 'Lead Instructor',
    description: 'Course creation, grading & cohorts',
    path: '/instructor',
    avatarColor: 'bg-sky-600',
  },
  STUDENT: {
    id: 'user-student',
    name: 'David Kim',
    email: 'david.kim@trainhub.io',
    initials: 'DK',
    role: 'STUDENT',
    roleTitle: 'Enrolled Learner',
    description: 'Enrolled courses, schedule & assignments',
    path: '/student',
    avatarColor: 'bg-emerald-600',
  },
  SUPER_ADMIN: {
    id: 'user-superadmin',
    name: 'Jordan Lee',
    email: 'jordan.lee@trainhub.io',
    initials: 'JL',
    role: 'SUPER_ADMIN',
    roleTitle: 'Platform Super Admin',
    description: 'Full multi-tenant system administrator',
    path: '/admin/organizations/demo',
    avatarColor: 'bg-violet-600',
  },
};
