import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarCheck, CalendarDays, Clock3, FilterX, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useDashboardContext } from '@/layouts/DashboardLayout';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, Modal, Skeleton, TableSkeleton } from '@/components/ui';
import { getErrorPresentation, getFieldErrors } from '@/utils/errorPresentation';
import { groupsApi, type CourseGroup } from '@/features/courses/api/groupsApi';
import { instructorsApi } from '@/features/instructors/api/instructorsApi';
import {
  sessionsApi,
  type TrainingSession,
  type TrainingSessionInput,
  type TrainingSessionStatus,
} from '../api/sessionsApi';

const blank: TrainingSessionInput = {
  title: '',
  groupId: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  meetingUrl: '',
  status: 'Scheduled',
};

type Errors = Partial<Record<'title' | 'groupId' | 'date' | 'startTime' | 'endTime' | 'meetingUrl' | 'location', string>>;

export default function SessionsList() {
  const { orgId = 'demo' } = useParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const dashboardContext = useDashboardContext();

  const canManage = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'INSTRUCTOR';
  const demo = Boolean(user?.demo);

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState('');
  const [statusError, setStatusError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cohortFilter, setCohortFilter] = useState('All');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingSession | null>(null);
  const [form, setForm] = useState<TrainingSessionInput>(blank);
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingSession, setDeletingSession] = useState<TrainingSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [nextSessions, nextGroups] = await Promise.all([
        sessionsApi.list(orgId, demo),
        groupsApi.list(orgId, demo),
      ]);
      setSessions(nextSessions);
      setGroups(nextGroups);

      if (user?.role === 'INSTRUCTOR' && user.email) {
        if (demo) {
          const instructors = await instructorsApi.list(orgId, true);
          setInstructorId(instructors.find((item) => item.email.toLowerCase() === user.email.toLowerCase())?.id ?? null);
        } else {
          try {
            const me = await instructorsApi.getMe();
            setInstructorId(me.id);
          } catch {
            const instructors = await instructorsApi.list(orgId, false);
            setInstructorId(instructors.find((item) => item.email.toLowerCase() === user.email.toLowerCase())?.id ?? null);
          }
        }
      }
    } catch (error) {
      setLoadError(t(getErrorPresentation(error).description));
    } finally {
      setLoading(false);
    }
  }, [orgId, demo, user, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const groupById = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups]);

  const manageableGroups = useMemo(() => {
    if (user?.role === 'INSTRUCTOR') {
      return groups.filter((group) => instructorId && group.instructorIds?.includes(instructorId));
    }
    return groups;
  }, [groups, instructorId, user?.role]);

  const filtered = useMemo(() => {
    return sessions
      .filter((session) => {
        if (user?.role === 'INSTRUCTOR' && !manageableGroups.some((g) => g.id === session.groupId)) {
          return false;
        }
        if (cohortFilter !== 'All' && session.groupId !== cohortFilter) {
          return false;
        }
        if (statusFilter !== 'All' && session.status !== statusFilter) {
          return false;
        }
        const text = `${session.title} ${groupById.get(session.groupId)?.name ?? ''} ${session.location}`.toLowerCase();
        return text.includes(query.trim().toLowerCase());
      })
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  }, [sessions, manageableGroups, cohortFilter, statusFilter, query, groupById, user?.role]);

  const isFiltered = query.trim() !== '' || statusFilter !== 'All' || cohortFilter !== 'All';

  const resetFilters = () => {
    setQuery('');
    setStatusFilter('All');
    setCohortFilter('All');
  };

  const openForm = (session?: TrainingSession) => {
    setEditing(session ?? null);
    setForm(
      session
        ? {
            title: session.title,
            groupId: session.groupId,
            date: session.date,
            startTime: session.startTime,
            endTime: session.endTime,
            location: session.location,
            meetingUrl: session.meetingUrl ?? '',
            status: session.status,
          }
        : {
            ...blank,
            groupId: manageableGroups[0]?.id ?? '',
          }
    );
    setErrors({});
    setSaveError('');
    setOpen(true);
  };

  const changeStatus = async (session: TrainingSession, status: TrainingSessionStatus) => {
    setStatusBusy(session.id);
    setStatusError('');
    try {
      const updated = await sessionsApi.updateStatus(orgId, session.id, status, demo);
      setSessions((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      const presentation = getErrorPresentation(error);
      setStatusError(
        t(
          presentation.title === 'Access denied'
            ? 'You do not have permission to change session status.'
            : presentation.description
        )
      );
    } finally {
      setStatusBusy('');
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    const title = form.title.trim();

    if (title.length < 2) {
      next.title = t('Enter a session title with at least 2 characters.');
    }
    if (!groupById.has(form.groupId)) {
      next.groupId = t('Choose a cohort for this session.');
    }
    if (!form.date) {
      next.date = t('Choose a session date.');
    }
    if (!form.startTime) {
      next.startTime = t('Choose a start time.');
    }
    if (!form.endTime) {
      next.endTime = t('Choose an end time.');
    }
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      next.endTime = t('End time must be after the start time.');
    }
    if (form.location && form.location.trim().length > 50) {
      next.location = t('Location must not exceed 50 characters.');
    }
    if (form.meetingUrl?.trim() && !/^https?:\/\//i.test(form.meetingUrl.trim())) {
      next.meetingUrl = t('Enter a valid meeting link starting with http:// or https://.');
    }
    if (
      sessions.some(
        (session) =>
          session.groupId === form.groupId &&
          session.date === form.date &&
          session.startTime === form.startTime &&
          session.id !== editing?.id
      )
    ) {
      next.startTime = t('A session already exists for this cohort at that time.');
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setSaveError('');
    try {
      const payload: TrainingSessionInput = {
        ...form,
        title,
        location: form.location.trim(),
        meetingUrl: form.meetingUrl?.trim() || undefined,
      };
      const saved = editing
        ? await sessionsApi.update(orgId, editing.id, payload, demo)
        : await sessionsApi.create(orgId, payload, demo);

      setSessions((current) =>
        editing ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved]
      );
      setOpen(false);
    } catch (error) {
      const presentation = getErrorPresentation(error);
      const serverFieldErrors = getFieldErrors(error);
      if (Object.keys(serverFieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...serverFieldErrors }));
      }
      setSaveError(
        t(
          presentation.title === 'Access denied'
            ? 'You do not have permission to save session changes.'
            : presentation.description
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingSession) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await sessionsApi.delete(orgId, deletingSession.id, demo);
      setSessions((current) => current.filter((s) => s.id !== deletingSession.id));
      setDeletingSession(null);
    } catch (error) {
      const presentation = getErrorPresentation(error);
      setDeleteError(t(presentation.description));
    } finally {
      setIsDeleting(false);
    }
  };

  const goToAttendance = (session: TrainingSession) => {
    try {
      localStorage.setItem(`trainhub.organization.${orgId}.attendance.selected-session`, session.id);
    } catch {
      // ignore storage error
    }
    if (dashboardContext?.navigate) {
      dashboardContext.navigate('Attendance');
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{t('Training')}</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{t('Sessions')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('View and manage training sessions across your cohorts.')}
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => openForm()}
            disabled={!manageableGroups.length}
            leadingIcon={<Plus className="size-4" />}
          >
            {t('Create session')}
          </Button>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total sessions', value: filtered.length },
          { label: 'Scheduled sessions', value: filtered.filter((s) => s.status === 'Scheduled').length },
          { label: 'Completed sessions', value: filtered.filter((s) => s.status === 'Completed').length },
        ].map((item) => (
          <Card key={item.label} className="border-border bg-card/70">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t(item.label)}</p>
              {loading ? (
                <Skeleton className="mt-1.5 h-6 w-10 rounded" />
              ) : (
                <p className="mt-1 text-xl font-semibold text-foreground">{item.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card/70">
        <CardHeader className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm">{t('Session list')}</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="relative sm:w-64">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label={t('Search sessions')}
                placeholder={t('Search sessions by title, cohort, or location')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="ps-9"
              />
            </label>
            <select
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              aria-label={t('Filter by cohort')}
              value={cohortFilter}
              onChange={(event) => setCohortFilter(event.target.value)}
              className="h-10 min-w-36 rounded-lg border border-border bg-input/40 px-3 text-start text-sm text-foreground"
            >
              <option value="All">{t('All cohorts')}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <select
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              aria-label={t('Filter by status')}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 min-w-36 rounded-lg border border-border bg-input/40 px-3 text-start text-sm text-foreground"
            >
              <option value="All">{t('All statuses')}</option>
              {(['Scheduled', 'Completed', 'Cancelled'] as TrainingSessionStatus[]).map((status) => (
                <option key={status} value={status}>
                  {t(status)}
                </option>
              ))}
            </select>
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-10 text-muted-foreground hover:text-foreground"
              >
                <FilterX className="me-1.5 size-4" />
                {t('Clear')}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {statusError && <p role="alert" className="p-4 text-sm text-destructive">{statusError}</p>}
          {loading ? (
            <div className="p-4">
              <TableSkeleton columns={6} rows={5} />
            </div>
          ) : loadError ? (
            <div className="py-8 text-center">
              <p role="alert" className="mb-3 text-sm text-destructive">{loadError}</p>
              <Button variant="outline" onClick={() => void load()}>
                {t('Try again')}
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-10 text-muted-foreground" />}
              title={
                isFiltered
                  ? t('No sessions match your search')
                  : manageableGroups.length
                  ? t('No sessions yet')
                  : t('No assigned cohorts')
              }
              description={
                isFiltered
                  ? t('Try changing your search, status, or cohort filter.')
                  : manageableGroups.length
                  ? t('Create your first session to schedule a cohort meeting.')
                  : t('Your schedule will show sessions after cohorts are assigned to your instructor profile.')
              }
              action={
                isFiltered ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    {t('Clear filters')}
                  </Button>
                ) : canManage && manageableGroups.length > 0 ? (
                  <Button size="sm" onClick={() => openForm()} leadingIcon={<Plus className="size-4" />}>
                    {t('Create session')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-start text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-3 py-3 text-start font-medium">{t('Session')}</th>
                    <th className="px-3 py-3 text-start font-medium">{t('Cohort')}</th>
                    <th className="px-3 py-3 text-start font-medium">{t('Date and time')}</th>
                    <th className="px-3 py-3 text-start font-medium">{t('Location')}</th>
                    <th className="px-3 py-3 text-start font-medium">{t('Status')}</th>
                    <th className="px-3 py-3 text-end font-medium">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((session) => (
                    <tr key={session.id} className="border-b border-border/70 last:border-0">
                      <td className="px-3 py-4 font-medium">{session.title}</td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {groupById.get(session.groupId)?.name ?? session.groupName ?? t('Cohort unavailable')}
                      </td>
                      <td className="px-3 py-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3.5" />
                          {session.date}
                        </span>
                        <span className="mt-1 flex items-center gap-1">
                          <Clock3 className="size-3.5" />
                          {session.startTime} – {session.endTime}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {session.meetingUrl ? (
                          <a
                            className="text-primary underline-offset-4 hover:underline"
                            href={session.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {session.location || t('Join online')}
                          </a>
                        ) : (
                          session.location || t('Not provided')
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <Badge
                          variant={
                            session.status === 'Scheduled'
                              ? 'warning'
                              : session.status === 'Completed'
                              ? 'success'
                              : 'secondary'
                          }
                        >
                          {t(session.status)}
                        </Badge>
                        {canManage && (
                          <select
                            className="ms-2 rounded border border-border bg-input/40 px-1 py-1 text-xs"
                            aria-label={t('Change status for {name}', { name: session.title })}
                            value={session.status}
                            disabled={statusBusy === session.id}
                            onChange={(event) =>
                              void changeStatus(session, event.target.value as TrainingSessionStatus)
                            }
                          >
                            {(['Scheduled', 'Completed', 'Cancelled'] as TrainingSessionStatus[]).map((status) => (
                              <option key={status} value={status}>
                                {t(status)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-4 text-end">
                        <div className="flex items-center justify-end gap-1">
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => goToAttendance(session)}
                              title={t('Take attendance')}
                              leadingIcon={<CalendarCheck className="size-3.5 text-primary" />}
                            >
                              <span className="sr-only sm:not-sr-only sm:inline-block">
                                {t('Take attendance')}
                              </span>
                            </Button>
                          )}
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openForm(session)}
                              leadingIcon={<Pencil className="size-3.5" />}
                            >
                              {t('Edit')}
                            </Button>
                          )}
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingSession(session)}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              leadingIcon={<Trash2 className="size-3.5" />}
                            >
                              <span className="sr-only">{t('Delete')}</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={open}
        onClose={() => {
          if (!saving) setOpen(false);
        }}
        title={t(editing ? 'Edit session' : 'Create session')}
        description={t(
          editing ? 'Update the session details.' : 'Schedule a session for a cohort.'
        )}
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" form="session-form" loading={saving} loadingLabel={t('Saving...')}>
              {t(editing ? 'Save changes' : 'Create session')}
            </Button>
          </div>
        }
      >
        <form id="session-form" onSubmit={submit} noValidate className="space-y-4">
          <Input
            label={t('Session title')}
            required
            maxLength={120}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            error={errors.title}
          />
          <label className="block space-y-1.5 text-xs font-medium">
            {t('Cohort')}
            <select
              required
              value={form.groupId}
              onChange={(event) => setForm({ ...form, groupId: event.target.value })}
              aria-invalid={Boolean(errors.groupId)}
              className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm"
            >
              <option value="">{t('Select a cohort')}</option>
              {manageableGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {errors.groupId && (
              <span role="alert" className="block text-destructive">
                {errors.groupId}
              </span>
            )}
          </label>
          <Input
            label={t('Session date')}
            type="date"
            required
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            error={errors.date}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t('Start time')}
              type="time"
              required
              value={form.startTime}
              onChange={(event) => setForm({ ...form, startTime: event.target.value })}
              error={errors.startTime}
            />
            <Input
              label={t('End time')}
              type="time"
              required
              value={form.endTime}
              onChange={(event) => setForm({ ...form, endTime: event.target.value })}
              error={errors.endTime}
            />
          </div>
          <Input
            label={t('Location (optional)')}
            maxLength={50}
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
            error={errors.location}
          />
          <Input
            label={t('Online meeting link (optional)')}
            type="url"
            value={form.meetingUrl}
            onChange={(event) => setForm({ ...form, meetingUrl: event.target.value })}
            error={errors.meetingUrl}
          />
          <label className="block space-y-1.5 text-xs font-medium">
            {t('Status')}
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as TrainingSessionStatus })}
              className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm"
            >
              {(['Scheduled', 'Completed', 'Cancelled'] as TrainingSessionStatus[]).map((status) => (
                <option key={status} value={status}>
                  {t(status)}
                </option>
              ))}
            </select>
          </label>
          {saveError && <p role="alert" className="text-xs text-destructive">{saveError}</p>}
        </form>
      </Modal>

      <Modal
        open={Boolean(deletingSession)}
        onClose={() => {
          if (!isDeleting) setDeletingSession(null);
        }}
        title={t('Delete session')}
        description={t('Are you sure you want to delete this session?')}
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingSession(null)}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={isDeleting}
              loadingLabel={t('Deleting...')}
              onClick={() => void confirmDelete()}
            >
              {t('Delete')}
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-sm">
          <p className="font-medium text-foreground">{deletingSession?.title}</p>
          <p className="text-xs text-muted-foreground">
            {deletingSession?.date} · {deletingSession?.startTime} – {deletingSession?.endTime}
          </p>
          {deleteError && <p role="alert" className="mt-2 text-xs text-destructive">{deleteError}</p>}
        </div>
      </Modal>
    </section>
  );
}
