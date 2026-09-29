import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Search, UserPlus, Users, Pencil, Mail, Phone, BookOpen, Eye, CalendarDays } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Modal, DataTable, Badge } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui/DataTable';
import { getErrorPresentation } from '@/utils/errorPresentation';
import { instructorsApi, type Instructor, type InstructorInput, type InstructorStatus } from '../api/instructorsApi';

const emptyForm: InstructorInput = { name: '', email: '', phone: '', expertise: '', status: 'Active' };
type FormErrors = Partial<Record<keyof InstructorInput, string>>;

export default function InstructorsList() {
  const { orgId = 'demo' } = useParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const canManage = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isDemo = Boolean(user?.demo);

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Instructor | null>(null);
  const [editing, setEditing] = useState<Instructor | null>(null);
  const [form, setForm] = useState<InstructorInput>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadInstructors = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setInstructors(await instructorsApi.list(orgId, isDemo));
    } catch (error) {
      setLoadError(t(getErrorPresentation(error).description));
    } finally {
      setLoading(false);
    }
  }, [orgId, isDemo, t]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await instructorsApi.list(orgId, isDemo);
        if (!ignore) {
          setInstructors(data);
          setLoadError('');
        }
      } catch (error) {
        if (!ignore) {
          setLoadError(t(getErrorPresentation(error).description));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    void init();
    return () => {
      ignore = true;
    };
  }, [orgId, isDemo, t]);

  const filtered = useMemo(() => {
    return instructors.filter((instructor) => {
      const matchesQuery = `${instructor.name} ${instructor.email} ${instructor.phone} ${instructor.expertise}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      return matchesQuery && (statusFilter === 'All' || instructor.status === statusFilter);
    });
  }, [instructors, query, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setSaveError('');
    setModalOpen(true);
  };

  const openEdit = (instructor: Instructor) => {
    setEditing(instructor);
    setForm({
      name: instructor.name,
      email: instructor.email,
      phone: instructor.phone ?? '',
      expertise: instructor.expertise ?? '',
      status: instructor.status,
    });
    setErrors({});
    setSaveError('');
    setModalOpen(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: FormErrors = {};
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (name.length < 2) next.name = t('Enter a name with at least 2 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t('Enter a valid email address.');
    if (form.phone.trim() && !/^[+\d().\s-]{7,20}$/.test(form.phone.trim())) next.phone = t('Enter a valid phone number.');
    if (instructors.some((instructor) => instructor.email.toLowerCase() === email && instructor.id !== editing?.id)) {
      next.email = t('An instructor with this email already exists.');
    }

    setErrors(next);
    setSaveError('');
    if (Object.keys(next).length) return;

    const input = { ...form, name, email, phone: form.phone.trim(), expertise: form.expertise.trim() };
    setSaving(true);
    try {
      const saved = editing
        ? await instructorsApi.update(orgId, editing.id, input, isDemo)
        : await instructorsApi.create(orgId, input, isDemo);
      setInstructors((current) =>
        editing ? current.map((instructor) => (instructor.id === saved.id ? saved : instructor)) : [saved, ...current]
      );
      setModalOpen(false);
    } catch (error) {
      const presentation = getErrorPresentation(error);
      setSaveError(
        t(
          presentation.title === 'Access denied'
            ? 'You do not have permission to save instructor changes.'
            : presentation.description
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<Instructor>[] = [
    {
      key: 'name',
      header: t('Instructor'),
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="flex min-w-44 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {row.name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join('')
              .toUpperCase()}
          </span>
          <span className="min-w-0">
            <button
              type="button"
              onClick={() => setSelected(row)}
              className="block max-w-full truncate text-start text-sm font-medium text-foreground hover:text-primary hover:underline"
            >
              {row.name}
            </button>
            <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="size-3" />
              {row.email}
            </span>
          </span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: t('Phone'),
      sortValue: (row) => row.phone,
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Phone className="size-3" />
          {row.phone || '—'}
        </span>
      ),
    },
    {
      key: 'expertise',
      header: t('Expertise'),
      sortValue: (row) => row.expertise,
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <BookOpen className="size-3" />
          {row.expertise || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      sortValue: (row) => row.status,
      cell: (row) => (
        <Badge variant={row.status === 'Active' ? 'success' : row.status === 'Pending' ? 'warning' : 'secondary'}>
          {t(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      className: 'w-36 text-end',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelected(row)}
            aria-label={`${t('View details')} ${row.name}`}
            leadingIcon={<Eye className="size-3.5" />}
          >
            {t('View')}
          </Button>
          {canManage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => openEdit(row)}
              aria-label={`${t('Edit')} ${row.name}`}
              leadingIcon={<Pencil className="size-3.5" />}
            >
              {t('Edit')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t('People')}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{t('Instructors')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t('View and manage instructors at your training center.')}
          </p>
        </div>
        {canManage && (
          <Button type="button" onClick={openCreate} leadingIcon={<UserPlus className="size-4" />}>
            {t('Add instructor')}
          </Button>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border bg-card/70">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{t('Total instructors')}</p>
              <p className="text-xl font-semibold text-foreground">{instructors.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('Active')}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {instructors.filter((instructor) => instructor.status === 'Active').length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('Pending')}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {instructors.filter((instructor) => instructor.status === 'Pending').length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('Inactive instructors')}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {instructors.filter((instructor) => instructor.status === 'Inactive').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/70">
        <CardHeader className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm">{t('Instructor directory')}</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <label className="relative sm:w-64">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label={t('Search instructors')}
                placeholder={t('Search by name, email, phone, or expertise')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="ps-9"
              />
            </label>
            <select
              aria-label={t('Filter by status')}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-lg border border-border bg-input/40 px-3 text-sm text-foreground"
            >
              <option value="All">{t('All statuses')}</option>
              {(['Active', 'Pending', 'Inactive'] as InstructorStatus[]).map((status) => (
                <option key={status} value={status}>
                  {t(status)}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(row) => row.id}
            caption={t('Instructors')}
            loading={loading}
            error={loadError || undefined}
            pageSize={8}
            emptyTitle={
              query || statusFilter !== 'All' ? t('No instructors match your search') : t('No instructors yet')
            }
            emptyDescription={
              query || statusFilter !== 'All'
                ? t('Try changing your search or status filter.')
                : canManage
                  ? t('Add your first instructor to start building your directory.')
                  : t('Instructors will appear here when they are added to your center.')
            }
          />
        </CardContent>
        {loadError && (
          <div className="flex justify-end border-t border-border p-3">
            <Button variant="outline" size="sm" onClick={() => void loadInstructors()}>
              {t('Try again')}
            </Button>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        title={t(editing ? 'Edit instructor' : 'Add instructor')}
        description={t(
          editing ? 'Update the instructor profile details.' : 'Add an instructor to your training center.'
        )}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              {t('Cancel')}
            </Button>
            <Button type="submit" form="instructor-form" loading={saving} loadingLabel={t('Saving...')}>
              {t(editing ? 'Save changes' : 'Add instructor')}
            </Button>
          </>
        }
      >
        <form id="instructor-form" onSubmit={submit} className="space-y-4" noValidate>
          <Input
            label={t('Full name')}
            autoComplete="name"
            required
            maxLength={100}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            error={errors.name}
          />
          <Input
            label={t('Email address')}
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            error={errors.email}
          />
          <Input
            label={t('Phone (optional)')}
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            error={errors.phone}
          />
          <Input
            label={t('Expertise (optional)')}
            maxLength={120}
            value={form.expertise}
            onChange={(event) => setForm({ ...form, expertise: event.target.value })}
          />
          <label className="block space-y-1.5 text-xs font-medium text-foreground">
            {t('Status')}
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as InstructorStatus })}
              className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm text-foreground"
            >
              {(['Active', 'Pending', 'Inactive'] as InstructorStatus[]).map((status) => (
                <option key={status} value={status}>
                  {t(status)}
                </option>
              ))}
            </select>
          </label>
          {saveError && (
            <p role="alert" className="text-xs text-destructive">
              {saveError}
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={t('Instructor profile')}
        description={t('View the instructor profile and expertise.')}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSelected(null)}>
              {t('Close')}
            </Button>
            {canManage && selected && (
              <Button
                type="button"
                onClick={() => {
                  const instructor = selected;
                  setSelected(null);
                  openEdit(instructor);
                }}
                leadingIcon={<Pencil className="size-4" />}
              >
                {t('Edit instructor')}
              </Button>
            )}
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {selected.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')
                  .toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-foreground">{selected.name}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t('Status')}</span>
                  <Badge
                    variant={
                      selected.status === 'Active'
                        ? 'success'
                        : selected.status === 'Pending'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {t(selected.status)}
                  </Badge>
                </div>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                { label: t('Email address'), value: selected.email, icon: Mail },
                { label: t('Phone'), value: selected.phone || t('Not provided'), icon: Phone },
                { label: t('Expertise'), value: selected.expertise || t('Not provided'), icon: BookOpen },
                {
                  label: t('Joined'),
                  value:
                    selected.createdAt && !Number.isNaN(new Date(selected.createdAt).getTime())
                      ? new Date(selected.createdAt).toLocaleDateString(
                          language === 'ar' ? 'ar-EG' : 'en-US',
                          { dateStyle: 'medium' }
                        )
                      : t('Not available'),
                  icon: CalendarDays,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-border p-3">
                    <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="size-3.5" />
                      {item.label}
                    </dt>
                    <dd className="mt-2 break-words text-sm font-medium text-foreground">{item.value}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
}
