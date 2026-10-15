import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, ExternalLink, FilterX, Search, ShieldCheck, ShieldAlert, RefreshCw, Plus, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Alert, Badge, Button, Card, Checkbox, EmptyState, Input, Label, Modal, Spinner } from '@/components/ui';
import apiClient from '@/api/apiClient';
import { organizationsApi, type CreateOrganizationInput } from '@/api/organizationsApi';
import { getErrorPresentation, getFieldErrors } from '@/utils/errorPresentation';

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

const initialFormState: CreateOrganizationInput = {
  name: '',
  slug: '',
  email: '',
  phone: '',
  address: '',
  logoUrl: '',
  isActive: true,
};

export default function PlatformOrganizations() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [organizations, setOrganizations] = useState<TenantOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CreateOrganizationInput>(initialFormState);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Check ?action=create in search params
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setCreateOpen(true);
    }
  }, [searchParams]);

  const handleOpenCreateModal = () => {
    setFormData(initialFormState);
    setSlugManuallyEdited(false);
    setCreateError(null);
    setFieldErrors({});
    setCreateOpen(true);
  };

  const handleCloseCreateModal = () => {
    if (saving) return;
    setCreateOpen(false);
    setCreateError(null);
    setFieldErrors({});
    if (searchParams.get('action') === 'create') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: slugManuallyEdited
        ? prev.slug
        : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));
    if (fieldErrors.name) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  };

  const handleSlugChange = (slug: string) => {
    setSlugManuallyEdited(true);
    setFormData((prev) => ({ ...prev, slug: slug.toLowerCase() }));
    if (fieldErrors.slug) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.slug;
        return next;
      });
    }
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    const trimmedName = formData.name.trim();
    const trimmedSlug = formData.slug.trim();

    if (!trimmedName || trimmedName.length < 2) {
      errors.name = t('Organization name must be at least 2 characters.');
    } else if (trimmedName.length > 200) {
      errors.name = t('Organization name cannot exceed 200 characters.');
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!trimmedSlug || trimmedSlug.length < 2) {
      errors.slug = t('Organization slug must be at least 2 characters.');
    } else if (trimmedSlug.length > 100) {
      errors.slug = t('Organization slug cannot exceed 100 characters.');
    } else if (!slugRegex.test(trimmedSlug)) {
      errors.slug = t('Slug must contain only lowercase letters, numbers, and hyphens.');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const payload: CreateOrganizationInput = {
        name: trimmedName,
        slug: trimmedSlug,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        logoUrl: formData.logoUrl?.trim() || null,
        isActive: formData.isActive ?? true,
      };

      await organizationsApi.create(payload);
      setSuccessMessage(t('Organization created successfully.'));
      handleCloseCreateModal();
      await fetchOrganizations();
    } catch (err) {
      const pres = getErrorPresentation(err);
      const extractedFieldErrors = getFieldErrors(err);
      setFieldErrors(extractedFieldErrors);
      setCreateError(pres.description || pres.title || t('Failed to create organization.'));
    } finally {
      setSaving(false);
    }
  };

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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {t('Platform')}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {t('Platform Organizations')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('Manage and monitor all tenant training centers across TrainHub.')}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          leadingIcon={<Plus className="size-4" />}
        >
          {t('Add organization')}
        </Button>
      </header>

      {successMessage && (
        <Alert variant="default" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="ms-auto text-xs underline hover:no-underline"
          >
            {t('Dismiss')}
          </button>
        </Alert>
      )}

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
              type="search"
              placeholder={t('Search by name, slug, email, phone...')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="ps-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['All', 'Active', 'Inactive'] as const).map((filter) => (
              <Button
                key={filter}
                variant={statusFilter === filter ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(filter)}
                className="text-xs"
              >
                {filter === 'All' ? t('All statuses') : t(filter)}
              </Button>
            ))}

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
                <span>{t('Clear filters')}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Organizations Table */}
      {loading ? (
        <Card className="flex items-center justify-center p-12">
          <Spinner className="size-6 text-primary" />
        </Card>
      ) : error ? (
        <Card className="border-destructive/20 bg-destructive/10 p-6 text-center">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchOrganizations()}
            className="mt-3 gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            <span>{t('Try again')}</span>
          </Button>
        </Card>
      ) : filteredOrgs.length === 0 ? (
        <Card className="border-border bg-card/60">
          <EmptyState
            icon={<Building2 className="size-6 text-primary" />}
            title={t('No organizations found')}
            description={
              query || statusFilter !== 'All'
                ? t('No tenant centers match the specified search or filter criteria.')
                : t('No organizations currently registered on the platform.')
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden border-border bg-card/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-start text-xs">
              <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start">{t('Organization')}</th>
                  <th className="px-4 py-3 text-start">{t('Slug')}</th>
                  <th className="px-4 py-3 text-start">{t('Contact')}</th>
                  <th className="px-4 py-3 text-start">{t('Status')}</th>
                  <th className="px-4 py-3 text-start">{t('Created')}</th>
                  <th className="px-4 py-3 text-end">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredOrgs.map((org) => (
                  <tr key={org.id} className="transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-7 shrink-0 place-items-center rounded bg-primary/10 text-primary font-semibold text-xs">
                          {org.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="font-semibold text-foreground">{org.name}</div>
                          {org.address && (
                            <div className="text-[11px] text-muted-foreground line-clamp-1">{org.address}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">
                      {org.slug}
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

      {/* Add Organization Modal */}
      <Modal
        open={createOpen}
        onClose={handleCloseCreateModal}
        title={t('Add Organization')}
        description={t('Register a new training center organization onto the platform.')}
        size="md"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={saving}
              onClick={handleCloseCreateModal}
            >
              {t('Cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="add-org-form"
              disabled={saving}
              leadingIcon={saving ? <Spinner className="size-4" /> : <Plus className="size-4" />}
            >
              {saving ? t('Creating...') : t('Create Organization')}
            </Button>
          </div>
        }
      >
        <form id="add-org-form" onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <Alert variant="destructive">
              <p className="text-xs">{createError}</p>
            </Alert>
          )}

          <div>
            <Label htmlFor="org-name" className="text-xs font-medium">
              {t('Organization Name')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="org-name"
              type="text"
              required
              disabled={saving}
              placeholder={t('e.g. Al-Amal Training Center')}
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="mt-1"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="org-slug" className="text-xs font-medium">
              {t('URL Slug')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="org-slug"
              type="text"
              required
              disabled={saving}
              placeholder={t('e.g. al-amal')}
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className="mt-1 font-mono text-xs"
            />
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {t('Lowercase letters, numbers, and hyphens only.')}
            </p>
            {fieldErrors.slug && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.slug}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="org-email" className="text-xs font-medium">
                {t('Contact Email')}
              </Label>
              <Input
                id="org-email"
                type="email"
                disabled={saving}
                placeholder="contact@center.com"
                value={formData.email ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="mt-1"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="org-phone" className="text-xs font-medium">
                {t('Contact Phone')}
              </Label>
              <Input
                id="org-phone"
                type="tel"
                disabled={saving}
                placeholder="+1 (555) 000-0000"
                value={formData.phone ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="mt-1"
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="org-address" className="text-xs font-medium">
              {t('Address')}
            </Label>
            <Input
              id="org-address"
              type="text"
              disabled={saving}
              placeholder={t('Street, city, country')}
              value={formData.address ?? ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              className="mt-1"
            />
            {fieldErrors.address && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.address}</p>
            )}
          </div>

          <div>
            <Label htmlFor="org-logo" className="text-xs font-medium">
              {t('Logo URL')}
            </Label>
            <Input
              id="org-logo"
              type="url"
              disabled={saving}
              placeholder="https://example.com/logo.png"
              value={formData.logoUrl ?? ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))}
              className="mt-1"
            />
            {fieldErrors.logoUrl && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.logoUrl}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="org-active"
              checked={formData.isActive ?? true}
              disabled={saving}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: Boolean(checked) }))
              }
            />
            <Label htmlFor="org-active" className="cursor-pointer text-xs font-medium">
              {t('Active training center (operational immediately)')}
            </Label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
