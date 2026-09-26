import { useDashboardContext } from '@/layouts/DashboardLayout';
import DashboardOverview from './DashboardOverview';
import DashboardEmptySection from './DashboardEmptySection';
import OrganizationProfile from './OrganizationProfile';
import OrganizationOverview from './OrganizationOverview';
import OrganizationSettings from './OrganizationSettings';
import UserProfile from './UserProfile';

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
