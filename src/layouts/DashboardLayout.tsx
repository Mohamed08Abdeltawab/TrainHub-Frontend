import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dashboardContent } from '../config/dashboard';
import { roleNavigation } from '../config/navigation';
import type { DashboardRole } from '../types/nav';
import AppHeader from '../components/layout/AppHeader';
import AppSidebar from '../components/layout/AppSidebar';
import LayoutIcon from '../components/layout/LayoutIcon';
import MobileNav from '../components/layout/MobileNav';
import DashboardSkeleton from '../components/ui/DashboardSkeleton';
import PageLoading from '../components/ui/PageLoading';
import { Badge, Button, Card, EmptyState } from '../components/ui';
import ErrorState from '../components/errors/ErrorState';

export type { DashboardRole } from '../types/nav';

const toViewKey = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function DashboardLayout({ initialRole = 'ORG_ADMIN', children, loading = false, error, onRetry }: { initialRole?: DashboardRole; children?: ReactNode; loading?: boolean; error?: unknown; onRetry?: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [role, setRole] = useState<DashboardRole>(initialRole);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const content = dashboardContent[role];
  const navigation = roleNavigation[role];
  const requestedView = searchParams.get('view');
  const activeItem = navigation.find((item) => toViewKey(item.label) === requestedView)
    ?? navigation.find((item) => item.label === 'Overview')
    ?? navigation[0];
  const active = activeItem?.label ?? 'Overview';

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
    setSearchParams({ view: 'overview' });
  };

  const openPrimarySection = () => {
    const item = navigation.find((entry) => /courses|organizations/i.test(entry.label)) ?? navigation[0];
    if (item) navigate(item.label);
  };

  return <div className="flex h-screen min-h-[600px] overflow-hidden bg-zinc-950 font-sans text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-100">
    <aside className={`hidden shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950 transition-[width] duration-300 md:flex ${collapsed ? 'w-16' : 'w-64'}`}>
      <AppSidebar role={role} section={content.section} items={navigation} active={active} collapsed={collapsed} onCollapse={() => setCollapsed((value) => !value)} onNavigate={navigate} />
    </aside>
    <MobileNav open={mobileOpen} role={role} section={content.section} items={navigation} active={active} onClose={() => setMobileOpen(false)} onNavigate={navigate} />

    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-900/20">
      <AppHeader role={role} tenant={content.tenant} plan={content.plan} section={content.section} page={active} items={navigation} onNavigate={navigate} onOpenMobileNav={() => setMobileOpen(true)} onSelectRole={changeRole} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge className="mb-2 rounded-full px-2.5 py-1 text-[10px]">{content.section} workspace</Badge>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{active === 'Overview' ? content.title : active}</h1>
              <p className="mt-1.5 text-sm text-zinc-400">{active === 'Overview' ? content.description : `Manage ${active.toLowerCase()} in your ${content.tenant} workspace.`}</p>
            </div>
            {active === 'Overview' && <Button size="lg" onClick={openPrimarySection}>+ {content.action}</Button>}
          </div>

          {error ? <ErrorState error={error} onRetry={onRetry} /> : loading ? active === 'Overview' ? <DashboardSkeleton /> : <PageLoading label={`Loading ${active.toLowerCase()}...`} /> : active === 'Overview' ? <>
            <section aria-label="Key metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {content.metrics.map((metric, index) => <Card key={metric.label} className="flex flex-col justify-between border-zinc-800/90 bg-zinc-900/60 p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-medium text-zinc-400">{metric.label}</span><span className={`grid h-8 w-8 place-items-center rounded-lg ${['bg-indigo-500/10 text-indigo-300', 'bg-sky-500/10 text-sky-300', 'bg-emerald-500/10 text-emerald-300', 'bg-amber-500/10 text-amber-300'][index]}`}><LayoutIcon icon={['overview', 'courses', 'reports', 'assignments'][index] as 'overview' | 'courses' | 'reports' | 'assignments'} /></span></div><div className="mt-3"><p className="text-2xl font-bold tracking-tight text-white">{metric.value}</p><p className="mt-1 text-[11px] text-zinc-500">{metric.note}</p></div></Card>)}
            </section>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
              <Card className="p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-white">{content.tableTitle}</h2><p className="mt-1 text-xs text-zinc-500">{content.subtitle}</p></div><Button variant="ghost" size="sm" onClick={openPrimarySection}>View all <span aria-hidden="true">→</span></Button></div>
                <div className="space-y-2">{content.rows.map((row) => <Card key={row.title} interactive className="flex items-center justify-between gap-3 border-zinc-800/80 bg-zinc-950/60 p-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-300"><LayoutIcon icon="courses" /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-zinc-200">{row.title}</p><p className="mt-1 truncate text-[11px] text-zinc-500">{row.detail}</p></div></div><Badge className="shrink-0">{row.status}</Badge></Card>)}</div>
              </Card>
              <Card className="p-4 sm:p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Your workspace</h2><Badge variant="success">Active</Badge></div><p className="mt-3 text-xs font-semibold text-indigo-200">{content.scope}</p><p className="mt-1 text-xs leading-5 text-zinc-400">Your access and tools are organized around your role.</p><ul className="mt-4 space-y-3">{content.capabilities.map((capability) => <li key={capability} className="flex items-start gap-2 text-xs text-zinc-300"><span className="mt-0.5 text-emerald-400">✓</span>{capability}</li>)}</ul></Card>
            </div>
          </> : <Card aria-live="polite" className="p-6 sm:p-8"><EmptyState icon={<LayoutIcon icon={activeItem?.icon ?? 'overview'} className="h-5 w-5" />} title={active} description={`You are viewing the ${active.toLowerCase()} section for the ${content.section.toLowerCase()} workspace.`} action={<Button variant="outline" size="sm" onClick={() => navigate('Overview')}>Back to overview</Button>} /></Card>}
          {children}
        </div>
      </main>
    </div>
  </div>;
}
