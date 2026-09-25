import { useDashboardContext } from '@/layouts/DashboardLayout';
import DashboardOverview from './DashboardOverview';
import DashboardEmptySection from './DashboardEmptySection';

/**
 * Route-aware section component rendered inside the DashboardLayout via <Outlet>.
 * Reads the active section from the outlet context (which derives it from the URL path)
 * and renders either the full overview or a placeholder for sections not yet built.
 */
export default function DashboardSection() {
  const { content, active, activeItem, navigate, openPrimarySection } =
    useDashboardContext();

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
