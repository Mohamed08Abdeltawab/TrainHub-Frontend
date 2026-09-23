import { useEffect, useRef, useState } from 'react';
import type { DashboardRole, NavItem } from '../../types/nav';
import HeaderSearch from './HeaderSearch';
import NotificationMenu from './NotificationMenu';
import OrgBadge from './OrgBadge';
import UserNav from './UserNav';

type OpenMenu = 'role' | 'profile' | 'notifications' | null;

type Props = {
  role: DashboardRole;
  tenant: string;
  plan: string;
  section: string;
  page: string;
  items: NavItem[];
  onNavigate: (label: string) => void;
  onOpenMobileNav: () => void;
  onSelectRole: (role: DashboardRole) => void;
};

export default function AppHeader({ role, tenant, plan, section, page, items, onNavigate, onOpenMobileNav, onSelectRole }: Props) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setOpenMenu(null);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  const toggleMenu = (menu: Exclude<OpenMenu, null>) => setOpenMenu((current) => current === menu ? null : menu);
  const chooseRole = (nextRole: DashboardRole) => {
    setOpenMenu(null);
    onSelectRole(nextRole);
  };
  const openSection = (label: string) => {
    setOpenMenu(null);
    onNavigate(label);
  };

  return <header ref={headerRef} className="sticky top-0 z-20 flex h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-950/90 px-3 backdrop-blur-md sm:px-4 md:px-6">
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <button type="button" onClick={onOpenMobileNav} aria-label="Open navigation menu" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white md:hidden"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
      <OrgBadge tenant={tenant} plan={plan} />
      <nav aria-label="Breadcrumb" className="hidden items-center gap-2 border-l border-zinc-800 pl-3 text-xs text-zinc-500 lg:flex"><span>TrainHub</span><span>/</span><span>{section}</span><span>/</span><span className="font-medium text-zinc-100">{page}</span></nav>
    </div>
    <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
      <HeaderSearch items={items} onNavigate={openSection} />
      <NotificationMenu open={openMenu === 'notifications'} onToggle={() => toggleMenu('notifications')} items={items} onNavigate={openSection} />
      <UserNav role={role} roleMenuOpen={openMenu === 'role'} profileMenuOpen={openMenu === 'profile'} onToggleRoleMenu={() => toggleMenu('role')} onToggleProfileMenu={() => toggleMenu('profile')} onSelectRole={chooseRole} />
    </div>
  </header>;
}
