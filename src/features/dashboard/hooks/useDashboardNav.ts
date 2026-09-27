import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { DashboardRole, NavItem } from '@/types/nav';
import { roleNavigation } from '@/config/navigation';
import { demoUsers } from '@/config/demoUsers';
import { useAuth } from '@/auth/AuthContext';

export const toViewKey = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function useDashboardNav(initialRole: DashboardRole = 'ORG_ADMIN', basePath: string) {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const { enterDemo, user } = useAuth();
  const [role, setRole] = useState<DashboardRole>(initialRole);
  const [prevInitialRole, setPrevInitialRole] = useState(initialRole);

  if (prevInitialRole !== initialRole) {
    setPrevInitialRole(initialRole);
    setRole(initialRole);
  }

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation: NavItem[] = useMemo(() => roleNavigation[role] ?? [], [role]);

  // Derive the active section from the URL path relative to the dashboard base path
  const relativePath = location.pathname.startsWith(basePath)
    ? location.pathname.slice(basePath.length).replace(/^\//, '')
    : '';
  const currentSection = relativePath.split('/')[0] || '';

  const activeItem =
    navigation.find((item) => toViewKey(item.label) === currentSection) ??
    navigation.find((item) => item.label === 'Overview') ??
    navigation[0];
  const active = activeItem?.label ?? 'Overview';

  const navigate = (label: string) => {
    routerNavigate(`${basePath}/${toViewKey(label)}`);
    setMobileOpen(false);
  };

  // Redirect to a valid section when the current URL section does not exist in navigation
  useEffect(() => {
    if (!currentSection) return; // At index route — let <Navigate to="overview" /> handle it
    if (!navigation.some((item) => toViewKey(item.label) === currentSection)) {
      routerNavigate(`${basePath}/overview`, { replace: true });
    }
  }, [basePath, currentSection, navigation, routerNavigate]);

  const changeRole = (nextRole: DashboardRole) => {
    if (user && !user.demo) return;
    enterDemo(nextRole);
    setRole(nextRole);
    const targetUser = demoUsers[nextRole];
    if (targetUser?.path) {
      routerNavigate(`${targetUser.path}/overview`);
    } else {
      routerNavigate(`${basePath}/overview`);
    }
  };

  const openPrimarySection = () => {
    const item =
      navigation.find((entry) => /courses|organizations/i.test(entry.label)) ??
      navigation[0];
    if (item) navigate(item.label);
  };

  return {
    role,
    setRole,
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
  };
}
