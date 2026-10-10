import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ExternalLink, FilterX, Search, ShieldCheck, Users, DollarSign } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge, Button, Card, EmptyState, Input } from '@/components/ui';

export type TenantOrganization = {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  plan: 'Growth' | 'Pro' | 'Starter' | 'Enterprise';
  learnersCount: number;
  coursesCount: number;
  status: 'Active' | 'Review' | 'Inactive';
  createdAt: string;
};

const defaultOrganizations: TenantOrganization[] = [
  {
    id: 'demo',
    name: 'Al-Amal Training Center',
    ownerName: 'Alex Morgan',
    ownerEmail: 'alex.morgan@trainhub.io',
    plan: 'Growth',
    learnersCount: 1248,
    coursesCount: 24,
    status: 'Active',
    createdAt: '2026-01-15',
  },
  {
    id: 'nile-skills',
    name: 'Nile Skills Academy',
    ownerName: 'Hassan Mahmoud',
    ownerEmail: 'hassan@nileskills.edu',
    plan: 'Pro',
    learnersCount: 860,
    coursesCount: 18,
    status: 'Active',
    createdAt: '2026-03-10',
  },
  {
    id: 'future-makers',
    name: 'Future Makers Center',
    ownerName: 'Laila Youssef',
    ownerEmail: 'laila@futuremakers.org',
    plan: 'Starter',
    learnersCount: 315,
    coursesCount: 8,
    status: 'Review',
    createdAt: '2026-05-22',
  },
  {
    id: 'delta-tech',
    name: 'Delta Tech Institute',
    ownerName: 'Karim Zidan',
    ownerEmail: 'karim@deltatech.io',
    plan: 'Enterprise',
    learnersCount: 3420,
    coursesCount: 52,
    status: 'Active',
    createdAt: '2026-02-01',
  },
  {
    id: 'horizon-learning',
    name: 'Horizon Professional Academy',
    ownerName: 'Nour El-Din',
    ownerEmail: 'nour@horizonacademy.com',
    plan: 'Growth',
    learnersCount: 940,
    coursesCount: 15,
    status: 'Active',
    createdAt: '2026-04-18',
  },
];

export default function PlatformOrganizations() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredOrgs = useMemo(() => {
    return defaultOrganizations.filter((org) => {
      const matchQuery =
        org.name.toLowerCase().includes(query.toLowerCase()) ||
        org.ownerName.toLowerCase().includes(query.toLowerCase()) ||
        org.ownerEmail.toLowerCase().includes(query.toLowerCase()) ||
        org.id.toLowerCase().includes(query.toLowerCase());
      const matchPlan = planFilter === 'All' || org.plan === planFilter;
      const matchStatus = statusFilter === 'All' || org.status === statusFilter;
      return matchQuery && matchPlan && matchStatus;
    });
  }, [query, planFilter, statusFilter]);

  const totalLearners = useMemo(
    () => defaultOrganizations.reduce((sum, org) => sum + org.learnersCount, 0),
    []
  );

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {t('Platform')}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {t('Platform Organizations')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('Manage and monitor all tenant training centers across TrainHub.')}
        </p>
      </header>

      {/* Metric Highlights */}
      <section aria-label="Organizations metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border bg-card/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t('Total organizations')}</span>
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <Building2 className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {defaultOrganizations.length}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">+12 {t('this month')}</p>
        </Card>

        <Card className="border-border bg-card/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t('Active training centers')}</span>
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <ShieldCheck className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {defaultOrganizations.filter((o) => o.status === 'Active').length}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{t('Active and verified')}</p>
        </Card>

        <Card className="border-border bg-card/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t('Active learners')}</span>
            <span className="grid size-8 place-items-center rounded-lg bg-sky-500/15 text-sky-400">
              <Users className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {totalLearners.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">+8.4% {t('this month')}</p>
        </Card>

        <Card className="border-border bg-card/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t('Monthly revenue')}</span>
            <span className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-400">
              <DollarSign className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">$48,250</p>
          <p className="mt-1 text-[11px] text-muted-foreground">+6.2% {t('this month')}</p>
        </Card>
      </section>

      {/* Filter Toolbar */}
      <Card className="border-border bg-card/60 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Search organizations...')}
              className="ps-9"
            />
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              aria-label={t('All plans')}
              className="h-10 rounded-lg border border-border bg-input/40 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="All">{t('All plans')}</option>
              <option value="Growth">Growth</option>
              <option value="Pro">Pro</option>
              <option value="Starter">Starter</option>
              <option value="Enterprise">Enterprise</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label={t('All statuses')}
              className="h-10 rounded-lg border border-border bg-input/40 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="All">{t('All statuses')}</option>
              <option value="Active">{t('Active')}</option>
              <option value="Review">{t('Review')}</option>
              <option value="Inactive">{t('Inactive')}</option>
            </select>

            {(query || planFilter !== 'All' || statusFilter !== 'All') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setPlanFilter('All');
                  setStatusFilter('All');
                }}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <FilterX className="size-3.5" />
                {t('Reset')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Organizations Table */}
      {filteredOrgs.length === 0 ? (
        <Card className="border-border bg-card/60 p-8 text-center">
          <EmptyState
            icon={<Building2 className="size-6 text-muted-foreground" />}
            title={t('No organizations found')}
            description={t('Try adjusting your search or filters.')}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setPlanFilter('All');
                  setStatusFilter('All');
                }}
              >
                {t('Reset filters')}
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="border-border bg-card/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-start text-xs">
              <thead className="border-b border-border bg-muted/30 text-muted-foreground font-medium">
                <tr>
                  <th className="px-4 py-3 text-start">{t('Organization')}</th>
                  <th className="px-4 py-3 text-start">{t('Owner / Admin')}</th>
                  <th className="px-4 py-3 text-start">{t('Plan')}</th>
                  <th className="px-4 py-3 text-start">{t('Learners')}</th>
                  <th className="px-4 py-3 text-start">{t('Courses')}</th>
                  <th className="px-4 py-3 text-start">{t('Status')}</th>
                  <th className="px-4 py-3 text-end">{t('Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrgs.map((org) => (
                  <tr key={org.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground">{org.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">id: {org.id}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-foreground">{org.ownerName}</div>
                      <div className="text-[10px] text-muted-foreground">{org.ownerEmail}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="secondary">{org.plan}</Badge>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      {org.learnersCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      {org.coursesCount}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          org.status === 'Active'
                            ? 'success'
                            : org.status === 'Review'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {t(org.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/organizations/${org.id}/overview`)}
                        className="gap-1.5 text-xs"
                      >
                        <span>{t('Open workspace')}</span>
                        <ExternalLink className="size-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
