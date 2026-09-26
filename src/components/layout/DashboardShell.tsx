import type { ReactNode } from 'react';
import type { DashboardContent, DashboardRole, NavItem } from '@/types/nav';
import AppHeader from '@/components/layout/AppHeader';
import AppSidebar from '@/components/layout/AppSidebar';
import MobileNav from '@/components/layout/MobileNav';
import { Badge, Button } from '@/components/ui';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

type DashboardShellProps = {
  role: DashboardRole;
  content: DashboardContent;
  navigation: NavItem[];
  active: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapse: () => void;
  onOpenMobileNav: () => void;
  onCloseMobileNav: () => void;
  onNavigate: (label: string) => void;
  onSelectRole: (role: DashboardRole) => void;
  onPrimaryAction: () => void;
  children: ReactNode;
};

export default function DashboardShell({
  role,
  content,
  navigation,
  active,
  collapsed,
  mobileOpen,
  onCollapse,
  onOpenMobileNav,
  onCloseMobileNav,
  onNavigate,
  onSelectRole,
  onPrimaryAction,
  children,
}: DashboardShellProps) {
  const { t } = useLanguage();

  return (
    <div className="flex h-screen min-h-[600px] overflow-hidden bg-background font-sans text-foreground selection:bg-primary/25">
      <aside
        className={`hidden shrink-0 flex-col border-r border-border bg-card/40 transition-[width] duration-300 md:flex ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <AppSidebar
          role={role}
          section={t(content.section)}
          items={navigation}
          active={active}
          collapsed={collapsed}
          onCollapse={onCollapse}
          onNavigate={onNavigate}
        />
      </aside>

      <MobileNav
        open={mobileOpen}
        role={role}
        section={t(content.section)}
        items={navigation}
        active={active}
        onClose={onCloseMobileNav}
        onNavigate={onNavigate}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background/50">
        <AppHeader
          role={role}
          tenant={content.tenant}
          plan={t(content.plan)}
          section={t(content.section)}
          page={t(active)}
          items={navigation}
          onNavigate={onNavigate}
          onOpenMobileNav={onOpenMobileNav}
          onSelectRole={onSelectRole}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Badge variant="default" className="mb-2 px-2.5 py-0.5 text-[10px]">
                  {t(content.section)} {t('Workspace')}
                </Badge>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {active === 'Overview' ? t(content.title) : t(active)}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {active === 'Overview'
                    ? t(content.description)
                    : `${t('Manage')} ${t(active)} ${t('in your')} ${content.tenant} ${t('Workspace')}.`}
                </p>
              </div>
              {active === 'Overview' && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onPrimaryAction}
                  leadingIcon={<Plus className="size-4" />}
                >
                  {t(content.action)}
                </Button>
              )}
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
