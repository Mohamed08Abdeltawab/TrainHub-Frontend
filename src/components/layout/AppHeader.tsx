import { useCallback, useState } from 'react';
import type { DashboardRole, NavItem } from '../../types/nav';
import HeaderSearch from './HeaderSearch';
import NotificationMenu from './NotificationMenu';
import OrgBadge from './OrgBadge';
import UserNav from './UserNav';
import { Button, Separator } from '@/components/ui';
import { ChevronRight, Menu } from 'lucide-react';

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

export default function AppHeader({
  role,
  tenant,
  plan,
  section,
  page,
  items,
  onNavigate,
  onOpenMobileNav,
  onSelectRole,
}: Props) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  const toggleMenu = useCallback((menu: Exclude<OpenMenu, null>) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  }, []);

  const chooseRole = useCallback(
    (nextRole: DashboardRole) => {
      setOpenMenu(null);
      onSelectRole(nextRole);
    },
    [onSelectRole]
  );

  const openSection = useCallback(
    (label: string) => {
      setOpenMenu(null);
      onNavigate(label);
    },
    [onNavigate]
  );

  return (
    <header
      role="banner"
      className="sticky top-0 z-20 flex h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:px-4 md:px-6"
    >
      {/* Left side: Mobile trigger, OrgBadge, and Breadcrumb */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="size-9 text-muted-foreground hover:text-foreground md:hidden"
        >
          <Menu className="size-5" />
        </Button>

        <OrgBadge tenant={tenant} plan={plan} />

        <Separator orientation="vertical" className="hidden h-4 bg-border lg:block" />

        <nav
          aria-label="Breadcrumb"
          className="hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex"
        >
          <span className="transition-colors hover:text-foreground">TrainHub</span>
          <ChevronRight className="size-3 text-muted-foreground/60" aria-hidden="true" />
          <span className="transition-colors hover:text-foreground">{section}</span>
          <ChevronRight className="size-3 text-muted-foreground/60" aria-hidden="true" />
          <span className="font-semibold text-foreground" aria-current="page">
            {page}
          </span>
        </nav>
      </div>

      {/* Right side: Search, Notifications, Role & User Navigation */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <HeaderSearch items={items} onNavigate={openSection} />

        <NotificationMenu
          open={openMenu === 'notifications'}
          onToggle={() => toggleMenu('notifications')}
          items={items}
          onNavigate={openSection}
        />

        <UserNav
          role={role}
          roleMenuOpen={openMenu === 'role'}
          profileMenuOpen={openMenu === 'profile'}
          onToggleRoleMenu={(open) => setOpenMenu(open ? 'role' : null)}
          onToggleProfileMenu={(open) => setOpenMenu(open ? 'profile' : null)}
          onSelectRole={chooseRole}
        />
      </div>
    </header>
  );
}
