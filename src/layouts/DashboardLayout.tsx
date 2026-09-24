import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dashboardContent } from '../config/dashboard';
import { roleNavigation } from '../config/navigation';
import { demoUsers } from '../config/demoUsers';
import type { DashboardRole } from '../types/nav';
import AppHeader from '../components/layout/AppHeader';
import AppSidebar from '../components/layout/AppSidebar';
import LayoutIcon from '../components/layout/LayoutIcon';
import MobileNav from '../components/layout/MobileNav';
import DashboardSkeleton from '../components/ui/DashboardSkeleton';
import PageLoading from '../components/ui/PageLoading';
import ErrorState from '../components/errors/ErrorState';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  EmptyState,
  type DataTableColumn,
} from '@/components/ui';
import { ArrowRight, Check, Plus } from 'lucide-react';

type DashboardRow = { title: string; detail: string; status: string };

export type { DashboardRole } from '../types/nav';

const toViewKey = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function DashboardLayout({
  initialRole = 'ORG_ADMIN',
  children,
  loading = false,
  error,
  onRetry,
}: {
  initialRole?: DashboardRole;
  children?: ReactNode;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}) {
  const routerNavigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [role, setRole] = useState<DashboardRole>(initialRole);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const content = dashboardContent[role];
  const navigation = roleNavigation[role];
  const requestedView = searchParams.get('view');
  const activeItem =
    navigation.find((item) => toViewKey(item.label) === requestedView) ??
    navigation.find((item) => item.label === 'Overview') ??
    navigation[0];
  const active = activeItem?.label ?? 'Overview';

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  const navigate = (label: string) => {
    setSearchParams({ view: toViewKey(label) });
    setMobileOpen(false);
  };

  useEffect(() => {
    if (requestedView !== null && !navigation.some((item) => toViewKey(item.label) === requestedView)) {
      setSearchParams({ view: toViewKey(active) }, { replace: true });
    }
  }, [active, navigation, requestedView, setSearchParams]);

  const changeRole = (nextRole: DashboardRole) => {
    setRole(nextRole);
    const targetUser = demoUsers[nextRole];
    if (targetUser?.path) {
      routerNavigate(`${targetUser.path}?view=overview`);
    } else {
      setSearchParams({ view: 'overview' });
    }
  };

  const openPrimarySection = () => {
    const item =
      navigation.find((entry) => /courses|organizations/i.test(entry.label)) ??
      navigation[0];
    if (item) navigate(item.label);
  };

  const tableColumns: DataTableColumn<DashboardRow>[] = [
    {
      key: 'title',
      header: 'Course or organization',
      sortValue: (row) => row.title,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{row.title}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{row.detail}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      cell: (row) => (
        <Badge
          variant={
            /upcoming|review/i.test(row.status)
              ? 'warning'
              : /complete/i.test(row.status)
              ? 'default'
              : 'success'
          }
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex h-screen min-h-[600px] overflow-hidden bg-background font-sans text-foreground selection:bg-primary/25">
      <aside
        className={`hidden shrink-0 flex-col border-r border-border bg-card/40 transition-[width] duration-300 md:flex ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <AppSidebar
          role={role}
          section={content.section}
          items={navigation}
          active={active}
          collapsed={collapsed}
          onCollapse={() => setCollapsed((value) => !value)}
          onNavigate={navigate}
        />
      </aside>

      <MobileNav
        open={mobileOpen}
        role={role}
        section={content.section}
        items={navigation}
        active={active}
        onClose={() => setMobileOpen(false)}
        onNavigate={navigate}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background/50">
        <AppHeader
          role={role}
          tenant={content.tenant}
          plan={content.plan}
          section={content.section}
          page={active}
          items={navigation}
          onNavigate={navigate}
          onOpenMobileNav={() => setMobileOpen(true)}
          onSelectRole={changeRole}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Badge variant="default" className="mb-2 px-2.5 py-0.5 text-[10px]">
                  {content.section} workspace
                </Badge>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {active === 'Overview' ? content.title : active}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {active === 'Overview'
                    ? content.description
                    : `Manage ${active.toLowerCase()} in your ${content.tenant} workspace.`}
                </p>
              </div>
              {active === 'Overview' && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={openPrimarySection}
                  leadingIcon={<Plus className="size-4" />}
                >
                  {content.action}
                </Button>
              )}
            </div>

            {error ? (
              <ErrorState error={error} onRetry={onRetry} />
            ) : loading ? (
              active === 'Overview' ? (
                <DashboardSkeleton />
              ) : (
                <PageLoading label={`Loading ${active.toLowerCase()}...`} />
              )
            ) : active === 'Overview' ? (
              <>
                <section
                  aria-label="Key metrics"
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
                >
                  {content.metrics.map((metric, index) => (
                    <Card
                      key={metric.label}
                      className="flex flex-col justify-between border-border bg-card/60 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {metric.label}
                        </span>
                        <span
                          className={`grid size-8 place-items-center rounded-lg ${
                            [
                              'bg-primary/15 text-primary',
                              'bg-sky-500/15 text-sky-400',
                              'bg-emerald-500/15 text-emerald-400',
                              'bg-amber-500/15 text-amber-400',
                            ][index]
                          }`}
                        >
                          <LayoutIcon
                            icon={
                              ['overview', 'courses', 'reports', 'assignments'][
                                index
                              ] as 'overview' | 'courses' | 'reports' | 'assignments'
                            }
                          />
                        </span>
                      </div>
                      <div className="mt-3">
                        <p className="text-2xl font-bold tracking-tight text-foreground">
                          {metric.value}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{metric.note}</p>
                      </div>
                    </Card>
                  ))}
                </section>

                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
                  <Card className="border-border bg-card/60 p-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between px-5 pt-5 pb-3">
                      <div>
                        <CardTitle className="text-sm font-semibold text-foreground">
                          {content.tableTitle}
                        </CardTitle>
                        <CardDescription className="mt-0.5 text-xs text-muted-foreground">
                          {content.subtitle}
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={openPrimarySection}>
                        View all <ArrowRight className="size-3.5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <DataTable
                        columns={tableColumns}
                        rows={content.rows}
                        rowKey={(row) => row.title}
                        caption={content.tableTitle}
                        pageSize={5}
                        emptyTitle="No activity yet"
                        emptyDescription="New activity will appear here."
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card/60 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-foreground">Your workspace</h2>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-primary">{content.scope}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Your access and tools are organized around your role.
                    </p>
                    <ul className="mt-4 space-y-3">
                      {content.capabilities.map((capability) => (
                        <li key={capability} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                          <span className="text-foreground/90">{capability}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </>
            ) : (
              <Card aria-live="polite" className="border-border bg-card/60 p-6 sm:p-8">
                <EmptyState
                  icon={
                    <LayoutIcon
                      icon={activeItem?.icon ?? 'overview'}
                      className="size-5 text-primary"
                    />
                  }
                  title={active}
                  description={`You are viewing the ${active.toLowerCase()} section for the ${content.section.toLowerCase()} workspace.`}
                  action={
                    <Button variant="outline" size="sm" onClick={() => navigate('Overview')}>
                      Back to overview
                    </Button>
                  }
                />
              </Card>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
