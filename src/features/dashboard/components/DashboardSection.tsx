import { useParams } from 'react-router-dom';
import { useDashboardContext } from '@/layouts/DashboardLayout';
import DashboardOverview from './DashboardOverview';
import DashboardEmptySection from './DashboardEmptySection';
import OrganizationProfile from './OrganizationProfile';
import OrganizationOverview from './OrganizationOverview';
import InstructorOverview from './InstructorOverview';
import StudentOverview from './StudentOverview';
import PlatformOverview from './PlatformOverview';
import OrganizationSettings from './OrganizationSettings';
import UserProfile from './UserProfile';
import PlatformOrganizations from './PlatformOrganizations';
import StudentsList from '@/features/students/components/StudentsList';
import InstructorsList from '@/features/instructors/components/InstructorsList';
import CoursesList from '@/features/courses/components/CoursesList';
import GroupsList from '@/features/courses/components/GroupsList';
import SessionsList from '@/features/sessions/components/SessionsList';
import ScheduleView from '@/features/sessions/components/ScheduleView';
import AttendancePage from '@/features/sessions/components/AttendancePage';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import MyCourses from '@/features/courses/components/MyCourses';
import StudentCourseDetails from '@/features/courses/components/StudentCourseDetails';
import InstructorCourseDetails from '@/features/courses/components/InstructorCourseDetails';
import AssignmentsList from '@/features/assignments/components/AssignmentsList';
import ErrorState from '@/components/errors/ErrorState';
import { useLanguage } from '@/i18n/LanguageContext';
import PlatformUsersView from '@/features/platform/components/PlatformUsersView';

/**
 * Route-aware section component rendered inside the DashboardLayout via <Outlet>.
 * Reads the active section from the outlet context (which derives it from the URL path)
 * and renders either the full overview or a placeholder for sections not yet built.
 */
export default function DashboardSection() {
  const { courseId } = useParams();
  const { content, active, activeItem, navigate, openPrimarySection, role } =
    useDashboardContext();
  const dashboardQuery = useDashboardData(role, active === 'Overview');
  const { t } = useLanguage();

  if (active === 'Overview' && dashboardQuery.isError) {
    return <ErrorState error={dashboardQuery.error} onRetry={() => void dashboardQuery.refetch()} retryLabel={t('Try again')} />;
  }

  if (active === 'Organization profile' && role === 'ORG_ADMIN') {
    return <OrganizationProfile defaultName={content.tenant} />;
  }

  if (active === 'Organization settings' && role === 'ORG_ADMIN') {
    return <OrganizationSettings />;
  }

  if (active === 'User profile') {
    return <UserProfile />;
  }

  if (active === 'Organizations' && role === 'SUPER_ADMIN') {
    return <PlatformOrganizations />;
  }

  if (active === 'Assignments' && (role === 'INSTRUCTOR' || role === 'ORG_ADMIN' || role === 'SUPER_ADMIN')) {
    return <AssignmentsList />;
  }

  if (active === 'Learners' && (role === 'ORG_ADMIN' || role === 'INSTRUCTOR' || role === 'SUPER_ADMIN')) {
    return <StudentsList />;
  }

  if (active === 'My courses' && (role === 'STUDENT' || role === 'INSTRUCTOR')) {
    if (courseId) {
      return role === 'INSTRUCTOR' ? (
        <InstructorCourseDetails courseId={courseId} />
      ) : (
        <StudentCourseDetails courseId={courseId} />
      );
    }
    return <MyCourses />;
  }

  if (active === 'Instructors' && (role === 'ORG_ADMIN' || role === 'SUPER_ADMIN')) {
    return <InstructorsList />;
  }

  if (active === 'Courses' && (role === 'ORG_ADMIN' || role === 'SUPER_ADMIN')) {
    return <CoursesList />;
  }

  if ((active === 'Cohorts' && (role === 'ORG_ADMIN' || role === 'SUPER_ADMIN')) || (active === 'My cohorts' && role === 'INSTRUCTOR')) {
    return <GroupsList />;
  }

  if (active === 'Sessions' && (role === 'ORG_ADMIN' || role === 'INSTRUCTOR' || role === 'SUPER_ADMIN')) {
    return <SessionsList />;
  }

  if (active === 'Attendance' && (role === 'ORG_ADMIN' || role === 'INSTRUCTOR' || role === 'STUDENT' || role === 'SUPER_ADMIN')) {
    return <AttendancePage />;
  }

  if (active === 'Schedule' && role === 'INSTRUCTOR') {
    return <ScheduleView instructorOnly />;
  }

  if (active === 'Schedule' && (role === 'ORG_ADMIN' || role === 'SUPER_ADMIN')) {
    return <ScheduleView />;
  }

  if ((active === 'Schedule' || active === 'My schedule') && role === 'STUDENT') {
    return <ScheduleView studentOnly />;
  }

  if (active === 'Overview') {
    if (dashboardQuery.isPending) return <DashboardSkeleton />;
    if (role === 'ORG_ADMIN') {
      return <OrganizationOverview content={dashboardQuery.data ?? content} onOpenPrimarySection={openPrimarySection} />;
    }
    if (role === 'INSTRUCTOR') {
      return <InstructorOverview content={dashboardQuery.data ?? content} onOpenPrimarySection={openPrimarySection} />;
    }
    if (role === 'STUDENT') {
      return <StudentOverview content={dashboardQuery.data ?? content} onOpenPrimarySection={openPrimarySection} />;
    }
    if (role === 'SUPER_ADMIN') {
      return <PlatformOverview content={dashboardQuery.data ?? content} onOpenPrimarySection={openPrimarySection} />;
    }
    return (
      <DashboardOverview
        content={dashboardQuery.data ?? content}
        onOpenPrimarySection={openPrimarySection}
      />
    );
  }

  if (active === 'Platform users' && role === 'SUPER_ADMIN') {
    return <PlatformUsersView />;
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
