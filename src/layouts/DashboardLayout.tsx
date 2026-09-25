import type { ReactNode } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { dashboardContent } from '@/config/dashboard';
import type { DashboardContent, DashboardRole, NavItem } from '@/types/nav';
import DashboardShell from '@/components/layout/DashboardShell';
import { useDashboardNav } from '@/features/dashboard/hooks/useDashboardNav';

export type { DashboardRole } from '@/types/nav';

/** Context passed from DashboardLayout to child route components via <Outlet>. */
export type DashboardOutletContext = {
  content: DashboardContent;
  role: DashboardRole;
  active: string;
  activeItem: NavItem | undefined;
  navigate: (label: string) => void;
  openPrimarySection: () => void;
};

/** Convenience hook for child route components to consume the dashboard context. */
export function useDashboardContext() {
  return useOutletContext<DashboardOutletContext>();
}

export default function DashboardLayout({
  initialRole = 'ORG_ADMIN',
  basePath,
  children,
}: {
  initialRole?: DashboardRole;
  basePath: string;
  children?: ReactNode;
}) {
  const {
    role,
    collapsed,
    setCollapsed,
    mobileOpen,
    setMobileOpen,
    navigation,
    active,
    activeItem,
    navigate,
    changeRole,
    openPrimarySection,
  } = useDashboardNav(initialRole, basePath);

  const content = dashboardContent[role];

  const outletContext: DashboardOutletContext = {
    content,
    role,
    active,
    activeItem,
    navigate,
    openPrimarySection,
  };

  return (
    <DashboardShell
      role={role}
      content={content}
      navigation={navigation}
      active={active}
      collapsed={collapsed}
      mobileOpen={mobileOpen}
      onCollapse={() => setCollapsed((value) => !value)}
      onOpenMobileNav={() => setMobileOpen(true)}
      onCloseMobileNav={() => setMobileOpen(false)}
      onNavigate={navigate}
      onSelectRole={changeRole}
      onPrimaryAction={openPrimarySection}
    >
      <Outlet context={outletContext} />
      {children}
    </DashboardShell>
  );
}
