import { useDashboardContext } from '@/layouts/DashboardLayout';
import DashboardOverview from './DashboardOverview';
import DashboardEmptySection from './DashboardEmptySection';
import OrganizationProfile from './OrganizationProfile';
import OrganizationOverview from './OrganizationOverview';
import OrganizationSettings from './OrganizationSettings';
import UserProfile from './UserProfile';
import StudentsList from '@/features/students/components/StudentsList';
import InstructorsList from '@/features/instructors/components/InstructorsList';
import CoursesList from '@/features/courses/components/CoursesList';
import GroupsList from '@/features/courses/components/GroupsList';
import SessionsList from '@/features/sessions/components/SessionsList';
import ScheduleView from '@/features/sessions/components/ScheduleView';

/**
 * Route-aware section component rendered inside the DashboardLayout via <Outlet>.
 * Reads the active section from the outlet context (which derives it from the URL path)
 * and renders either the full overview or a placeholder for sections not yet built.
 */
export default function DashboardSection() {
  const { content, active, activeItem, navigate, openPrimarySection, role } =
    useDashboardContext();

  if (active === 'Organization profile' && role === 'ORG_ADMIN') {
    return <OrganizationProfile defaultName={content.tenant} />;
  }

  if (active === 'Organization settings' && role === 'ORG_ADMIN') {
    return <OrganizationSettings />;
  }

  if (active === 'User profile') {
    return <UserProfile />;
  }

  if (active === 'Learners' && (role === 'ORG_ADMIN' || role === 'INSTRUCTOR')) {
    return <StudentsList />;
  }

  if (active === 'Instructors' && role === 'ORG_ADMIN') {
    return <InstructorsList />;
  }

  if (active === 'Courses' && role === 'ORG_ADMIN') {
    return <CoursesList />;
  }

  if ((active === 'Cohorts' && role === 'ORG_ADMIN') || (active === 'My cohorts' && role === 'INSTRUCTOR')) {
    return <GroupsList />;
  }

  if (active === 'Sessions' && (role === 'ORG_ADMIN' || role === 'INSTRUCTOR' || role === 'SUPER_ADMIN')) {
    return <SessionsList />;
  }

  if (active === 'Schedule' && role === 'INSTRUCTOR') {
    return <ScheduleView instructorOnly />;
  }

  if (active === 'Schedule' && role === 'ORG_ADMIN') {
    return <ScheduleView />;
  }

  if (active === 'Overview' && role === 'ORG_ADMIN') {
    return <OrganizationOverview content={content} onOpenPrimarySection={openPrimarySection} />;
  }

  if (active === 'Overview') {
    return (
      <DashboardOverview
        content={content}
        onOpenPrimarySection={openPrimarySection}
      />
    );
  }

  return (
    <DashboardEmptySection
      active={active}
      activeItem={activeItem}
      section={content.section}
      onNavigateOverview={() => navigate('Overview')}
    />
  );
}
