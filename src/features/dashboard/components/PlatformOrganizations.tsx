import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ExternalLink, FilterX, Search, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge, Button, Card, EmptyState, Input } from '@/components/ui';
import apiClient from '@/api/apiClient';
import { getErrorPresentation } from '@/utils/errorPresentation';

export interface TenantOrganization {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PlatformOrganizations() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<TenantOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<TenantOrganization[]>('/organizations');
      setOrganizations(response.data || []);
    } catch (err) {
      setError(getErrorPresentation(err).description);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrganizations();
  }, [fetchOrganizations]);

  const filteredOrgs = useMemo(() => {
    return organizations.filter((org) => {
      const matchQuery =
        org.name.toLowerCase().includes(query.toLowerCase()) ||
        org.slug.toLowerCase().includes(query.toLowerCase()) ||
        Boolean(org.email && org.email.toLowerCase().includes(query.toLowerCase())) ||
        Boolean(org.phone && org.phone.toLowerCase().includes(query.toLowerCase())) ||
        org.id.toLowerCase().includes(query.toLowerCase());

      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' ? org.isActive : !org.isActive);

      return matchQuery && matchStatus;
    });
  }, [organizations, query, statusFilter]);

  const activeCount = useMemo(() => organizations.filter((o) => o.isActive).length, [organizations]);
  const inactiveCount = useMemo(() => organizations.filter((o) => !o.isActive).length, [organizations]);

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
      <section aria-label="Organizations metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-border bg-card/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t('Total organizations')}</span>
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <Building2 className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {organizations.length}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{t('Registered tenant centers')}</p>
        </Card>

        <Card className="border-border bg-card/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t('Active training centers')}</span>
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <ShieldCheck className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {activeCount}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{t('Active and operational')}</p>
        </Card>

        <Card className="border-border bg-card/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t('Inactive training centers')}</span>
            <span className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-400">
              <ShieldAlert className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {inactiveCount}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{t('Suspended or pending')}</p>
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
              aria-label={t('All statuses')}
              className="h-10 rounded-lg border border-border bg-input/40 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="All">{t('All statuses')}</option>
              <option value="Active">{t('Active')}</option>
              <option value="Inactive">{t('Inactive')}</option>
            </select>

            {(query || statusFilter !== 'All') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('');
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

      {/* Error state */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchOrganizations()}
            className="mt-4 gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            {t('Retry')}
          </Button>
        </Card>
      )}

      {/* Loading state */}
      {loading && !error && (
        <Card className="border-border bg-card/60 p-12 text-center">
          <div className="inline-block size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 text-xs text-muted-foreground">{t('Loading organizations...')}</p>
        </Card>
      )}

      {/* Organizations Table */}
      {!loading && !error && filteredOrgs.length === 0 && (
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
                  setStatusFilter('All');
                }}
              >
                {t('Reset filters')}
              </Button>
            }
          />
        </Card>
      )}

      {!loading && !error && filteredOrgs.length > 0 && (
        <Card className="border-border bg-card/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-start text-xs">
              <thead className="border-b border-border bg-muted/30 text-muted-foreground font-medium">
                <tr>
                  <th className="px-4 py-3 text-start">{t('Organization')}</th>
                  <th className="px-4 py-3 text-start">{t('Slug / ID')}</th>
                  <th className="px-4 py-3 text-start">{t('Contact')}</th>
                  <th className="px-4 py-3 text-start">{t('Status')}</th>
                  <th className="px-4 py-3 text-start">{t('Created')}</th>
                  <th className="px-4 py-3 text-end">{t('Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrgs.map((org) => (
                  <tr key={org.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground">{org.name}</div>
                      {org.address && <div className="text-[10px] text-muted-foreground">{org.address}</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-xs text-foreground">{org.slug}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">id: {org.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-foreground">{org.email || '—'}</div>
                      {org.phone && <div className="text-[10px] text-muted-foreground">{org.phone}</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={org.isActive ? 'success' : 'secondary'}>
                        {org.isActive ? t('Active') : t('Inactive')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          try {
                            localStorage.setItem('activeOrganizationId', org.id);
                          } catch { /* ignore */ }
                          navigate(`/admin/organizations/${org.slug || org.id}/overview`);
                        }}
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
