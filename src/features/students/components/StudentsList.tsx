import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Search, UserPlus, Users, Pencil, Mail, Phone, BookOpen, Eye, CalendarDays } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Modal, DataTable, Badge } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui/DataTable';
import { getErrorPresentation } from '@/utils/errorPresentation';
import { studentsApi, type Student, type StudentInput, type StudentStatus } from '../api/studentsApi';

const emptyForm: StudentInput = { name: '', email: '', phone: '', course: '', status: 'Active' };
type FormErrors = Partial<Record<keyof StudentInput, string>>;

export default function StudentsList() {
  const { orgId = 'demo' } = useParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const canManage = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isDemo = Boolean(user?.demo);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentInput>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setStudents(await studentsApi.list(orgId, isDemo));
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
        const data = await studentsApi.list(orgId, isDemo);
        if (!ignore) {
          setStudents(data);
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
    return students.filter((student) => {
      const matchesQuery = `${student.name} ${student.email} ${student.phone} ${student.course}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      return matchesQuery && (statusFilter === 'All' || student.status === statusFilter);
    });
  }, [students, query, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setSaveError('');
    setModalOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setForm({
      name: student.name,
      email: student.email,
      phone: student.phone ?? '',
      course: student.course ?? '',
      status: student.status,
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
    if (students.some((student) => student.email.toLowerCase() === email && student.id !== editing?.id)) {
      next.email = t('A student with this email already exists.');
    }

    setErrors(next);
    setSaveError('');
    if (Object.keys(next).length) return;

    const input = { ...form, name, email, phone: form.phone.trim(), course: form.course.trim() };
    setSaving(true);
    try {
      const saved = editing
        ? await studentsApi.update(orgId, editing.id, input, isDemo)
        : await studentsApi.create(orgId, input, isDemo);
      setStudents((current) => (editing ? current.map((student) => (student.id === saved.id ? saved : student)) : [saved, ...current]));
      setModalOpen(false);
    } catch (error) {
      const presentation = getErrorPresentation(error);
      setSaveError(t(presentation.title === 'Access denied' ? 'You do not have permission to save student changes.' : presentation.description));
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<Student>[] = [
    {
      key: 'name',
      header: t('Student'),
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
              onClick={() => setSelectedStudent(row)}
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
      key: 'course',
      header: t('Course'),
      sortValue: (row) => row.course,
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <BookOpen className="size-3" />
          {row.course || '—'}
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
            onClick={() => setSelectedStudent(row)}
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
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{t('Students')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t('View and manage students enrolled at your training center.')}
          </p>
        </div>
        {canManage && (
          <Button type="button" onClick={openCreate} leadingIcon={<UserPlus className="size-4" />}>
            {t('Add student')}
          </Button>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border bg-card/70">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{t('Total students')}</p>
              <p className="text-xl font-semibold text-foreground">{students.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('Active')}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {students.filter((student) => student.status === 'Active').length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('Pending')}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {students.filter((student) => student.status === 'Pending').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/70">
        <CardHeader className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm">{t('Student directory')}</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <label className="relative sm:w-64">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label={t('Search students')}
                placeholder={t('Search by name, email, phone, or course')}
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
              {(['Active', 'Pending', 'Inactive'] as StudentStatus[]).map((status) => (
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
            caption={t('Students')}
            loading={loading}
            error={loadError || undefined}
            pageSize={8}
            emptyTitle={query || statusFilter !== 'All' ? t('No students match your search') : t('No students yet')}
            emptyDescription={
              query || statusFilter !== 'All'
                ? t('Try changing your search or status filter.')
                : canManage
                  ? t('Add your first student to start building your directory.')
                  : t('Students will appear here when they are added to your center.')
            }
          />
        </CardContent>
        {loadError && (
          <div className="flex justify-end border-t border-border p-3">
            <Button variant="outline" size="sm" onClick={() => void loadStudents()}>
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
        title={t(editing ? 'Edit student' : 'Add student')}
        description={t(editing ? 'Update the student profile details.' : 'Add a student to your training center.')}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              {t('Cancel')}
            </Button>
            <Button type="submit" form="student-form" loading={saving} loadingLabel={t('Saving...')}>
              {t(editing ? 'Save changes' : 'Add student')}
            </Button>
          </>
        }
      >
        <form id="student-form" onSubmit={submit} className="space-y-4" noValidate>
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
            label={t('Course (optional)')}
            maxLength={120}
            value={form.course}
            onChange={(event) => setForm({ ...form, course: event.target.value })}
          />
          <label className="block space-y-1.5 text-xs font-medium text-foreground">
            {t('Status')}
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as StudentStatus })}
              className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm text-foreground"
            >
              {(['Active', 'Pending', 'Inactive'] as StudentStatus[]).map((status) => (
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
        open={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title={t('Student details')}
        description={t('View the student profile and enrollment information.')}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSelectedStudent(null)}>
              {t('Close')}
            </Button>
            {canManage && selectedStudent && (
              <Button
                type="button"
                onClick={() => {
                  const student = selectedStudent;
                  setSelectedStudent(null);
                  openEdit(student);
                }}
                leadingIcon={<Pencil className="size-4" />}
              >
                {t('Edit student')}
              </Button>
            )}
          </>
        }
      >
        {selectedStudent && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {selectedStudent.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')
                  .toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-foreground">{selectedStudent.name}</h2>
                <Badge
                  variant={
                    selectedStudent.status === 'Active'
                      ? 'success'
                      : selectedStudent.status === 'Pending'
                        ? 'warning'
                        : 'secondary'
                  }
                >
                  {t(selectedStudent.status)}
                </Badge>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                { label: t('Email address'), value: selectedStudent.email, icon: Mail },
                { label: t('Phone'), value: selectedStudent.phone || t('Not provided'), icon: Phone },
                { label: t('Course'), value: selectedStudent.course || t('Not assigned'), icon: BookOpen },
                {
                  label: t('Joined'),
                  value:
                    selectedStudent.createdAt && !Number.isNaN(new Date(selectedStudent.createdAt).getTime())
                      ? new Date(selectedStudent.createdAt).toLocaleDateString(
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
