import type { DashboardContent, DashboardRole } from '../types/nav';

export const dashboardContent: Record<DashboardRole, DashboardContent> = {
  SUPER_ADMIN: {
    tenant: 'TrainHub Platform', plan: 'Platform', section: 'Platform', title: 'Platform Overview',
    description: 'Monitor organizations, subscriptions, and platform activity.', action: 'Add organization',
    metrics: [{ label: 'Organizations', value: '128', note: '+12 this month' }, { label: 'Active learners', value: '24,890', note: '+8.4% this month' }, { label: 'Monthly revenue', value: '$48,250', note: '+6.2% this month' }, { label: 'Open support cases', value: '18', note: '6 need attention' }],
    tableTitle: 'Organizations', subtitle: 'Recently active training centers',
    rows: [{ title: 'Al-Amal Training Center', detail: 'Growth plan / 1,240 learners', status: 'Active' }, { title: 'Nile Skills Academy', detail: 'Pro plan / 860 learners', status: 'Active' }, { title: 'Future Makers', detail: 'Starter plan / 315 learners', status: 'Review' }],
    scope: 'Platform access', capabilities: ['Manage training organizations', 'Review plans and billing', 'Monitor platform activity'],
  },
  ORG_ADMIN: {
    tenant: 'Al-Amal Training Center', plan: 'Growth Plan', section: 'Academy', title: 'Overview Dashboard',
    description: 'Here is what is happening across your training center today.', action: 'Create course',
    metrics: [{ label: 'Total learners', value: '1,248', note: '+12.5% from last month' }, { label: 'Active courses', value: '24', note: '3 starting this week' }, { label: 'Completion rate', value: '86.4%', note: '+4.2% from last month' }, { label: 'Pending reviews', value: '18', note: '6 assignments need attention' }],
    tableTitle: 'Recent Courses & Cohorts', subtitle: 'A quick look at activity in your academy',
    rows: [{ title: 'Fullstack Web Development', detail: 'Instructor: Sara Jenkins / Next session: Today, 2:00 PM', status: 'In progress' }, { title: 'Modern UI/UX Design', detail: 'Instructor: Mona Zaki / 32 learners enrolled', status: 'In progress' }, { title: 'Agile & Git Team Workflows', detail: 'Instructor: Omar Hassan / Starts next week', status: 'Upcoming' }],
    scope: 'Organization workspace', capabilities: ['Manage courses, cohorts, and learners', 'Review instructor activity', 'Track center performance'],
  },
  INSTRUCTOR: {
    tenant: 'Al-Amal Training Center', plan: 'Instructor', section: 'Teaching', title: 'Teaching Dashboard',
    description: 'Your classes, learner progress, and upcoming sessions at a glance.', action: 'Create assignment',
    metrics: [{ label: 'My learners', value: '86', note: 'Across 4 active cohorts' }, { label: 'Active courses', value: '4', note: '2 sessions this week' }, { label: 'Average progress', value: '78%', note: '+5% this month' }, { label: 'Pending grading', value: '12', note: 'Assignments to review' }],
    tableTitle: 'My Courses & Cohorts', subtitle: 'Your current teaching schedule',
    rows: [{ title: 'Fullstack Web Development', detail: 'Cohort A / Next session: Today, 2:00 PM', status: 'In progress' }, { title: 'JavaScript Essentials', detail: 'Cohort B / 24 learners enrolled', status: 'In progress' }, { title: 'Frontend Foundations', detail: 'Cohort C / Next session: Thursday', status: 'Upcoming' }],
    scope: 'Instructor workspace', capabilities: ['Host cohort sessions', 'Review submissions and grades', 'Share learning materials'],
  },
  STUDENT: {
    tenant: 'Al-Amal Training Center', plan: 'Learner', section: 'Learning', title: 'My Learning Dashboard',
    description: 'Continue your courses and keep track of your learning progress.', action: 'Explore courses',
    metrics: [{ label: 'Enrolled courses', value: '3', note: '2 active right now' }, { label: 'Completed lessons', value: '28', note: '4 this week' }, { label: 'Learning progress', value: '62%', note: 'Keep up the great work' }, { label: 'Upcoming sessions', value: '2', note: 'Next one today at 2:00 PM' }],
    tableTitle: 'My Enrolled Courses', subtitle: 'Your curriculum and upcoming lessons',
    rows: [{ title: 'Fullstack Web Development', detail: 'Instructor: Sara Jenkins / Next session: Today, 2:00 PM', status: '62% complete' }, { title: 'Modern UI/UX Design', detail: 'Instructor: Mona Zaki / Next session: Saturday', status: '45% complete' }, { title: 'Agile & Git Team Workflows', detail: 'Self-paced / 4 quizzes remaining', status: '80% complete' }],
    scope: 'My learning space', capabilities: ['Attend live cohort sessions', 'Download lesson materials', 'Submit assignments and view feedback'],
  },
};
