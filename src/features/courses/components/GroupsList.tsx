import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, Eye, FilterX, GraduationCap, Pencil, Plus, Search, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, ErrorState, Input, Modal, TableSkeleton } from '@/components/ui';
import { getErrorPresentation, getFieldErrors } from '@/utils/errorPresentation';
import { coursesApi, type Course } from '../api/coursesApi';
import { groupsApi, type CourseGroup, type CourseGroupInput, type CourseGroupStatus } from '../api/groupsApi';
import { instructorsApi, type Instructor } from '@/features/instructors/api/instructorsApi';

const blank: CourseGroupInput = { name: '', courseId: '', startDate: '', endDate: '', capacity: 1, instructorIds: [], status: 'Planned' };
type Errors = Partial<Record<'name' | 'courseId' | 'startDate' | 'endDate' | 'capacity', string>>;

export default function GroupsList() {
  const { orgId = 'demo' } = useParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const canManage = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN';
  const demo = Boolean(user?.demo);
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [instructorLoadError, setInstructorLoadError] = useState('');
  const [selected, setSelected] = useState<CourseGroup | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CourseGroup | null>(null);
  const [form, setForm] = useState<CourseGroupInput>(blank);
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [nextGroups, nextCourses] = await Promise.all([
        user?.role === 'INSTRUCTOR' ? groupsApi.listForInstructor(orgId, demo) : groupsApi.list(orgId, demo),
        user?.role === 'INSTRUCTOR' && !demo ? Promise.resolve([]) : coursesApi.list(orgId, demo),
      ]);
      setGroups(nextGroups);
      setCourses(nextCourses);
    } catch (error) {
      setLoadError(t(getErrorPresentation(error).description));
    } finally {
      setLoading(false);
    }
  }, [orgId, demo, t, user?.role]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!canManage) return;
    let active = true;
    instructorsApi.list(orgId, demo).then((items) => {
      if (active) {
        setInstructors(items);
        setInstructorLoadError('');
      }
    }).catch((error) => {
      if (active) setInstructorLoadError(t(getErrorPresentation(error).description));
    });
    return () => { active = false; };
  }, [orgId, demo, t, canManage]);

  const courseById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);
  const getCourseTitle = (group: CourseGroup) => group.courseTitle ?? courseById.get(group.courseId)?.title ?? t('Course unavailable');
  const filtered = useMemo(() => groups.filter((group) =>
    `${group.name} ${group.courseTitle ?? courseById.get(group.courseId)?.title ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (statusFilter === 'All' || group.status === statusFilter)
  ), [groups, courseById, query, statusFilter]);

  const isFiltered = query.trim() !== '' || statusFilter !== 'All';

  const resetFilters = () => {
    setQuery('');
    setStatusFilter('All');
  };

  const openForm = (group?: CourseGroup) => {
    setEditing(group ?? null);
    setForm(group ? {
      name: group.name,
      courseId: group.courseId,
      startDate: group.startDate,
      endDate: group.endDate,
      capacity: group.capacity,
      instructorIds: group.instructorIds ?? [],
      status: group.status,
    } : { ...blank, courseId: courses[0]?.id ?? '' });
    setErrors({});
    setSaveError('');
    setOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    const name = form.name.trim();
    if (name.length < 2) next.name = t('Enter a group name with at least 2 characters.');
    if (!courseById.has(form.courseId)) next.courseId = t('Choose a course for this group.');
    if (!form.startDate) next.startDate = t('Choose a start date.');
    if (!form.endDate) next.endDate = t('Choose an end date.');
    if (form.startDate && form.endDate && form.endDate < form.startDate) next.endDate = t('End date must be on or after the start date.');
    if (!Number.isInteger(form.capacity) || form.capacity < 1 || form.capacity > 10000) next.capacity = t('Capacity must be between 1 and 10000 learners.');
    if (groups.some((group) => group.name.toLocaleLowerCase() === name.toLocaleLowerCase() && group.id !== editing?.id)) next.name = t('A group with this name already exists.');
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setSaveError('');
    try {
      const payload = { ...form, name };
      const saved = editing ? await groupsApi.update(orgId, editing.id, payload, demo) : await groupsApi.create(orgId, payload, demo);
      setGroups((current) => editing ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setOpen(false);
    } catch (error) {
      const presentation = getErrorPresentation(error);
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      setSaveError(
        t(
          presentation.title === 'Access denied'
            ? 'You do not have permission to save group changes.'
            : presentation.description
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{t('Training')}</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{t('Course groups')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('View and manage course groups at your training center.')}</p>
        </div>
        {canManage && (
          <Button
            onClick={() => openForm()}
            disabled={!courses.length}
            className="w-full sm:w-auto"
            leadingIcon={<Plus className="size-4"/>}
          >
            {t('Create group')}
          </Button>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total groups', value: groups.length },
          { label: 'Active groups', value: groups.filter((group) => group.status === 'Active').length },
          { label: 'Planned groups', value: groups.filter((group) => group.status === 'Planned').length },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t(item.label)}</p>
              <p className="mt-1 text-xl font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm">{t('Course groups')}</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="relative w-full sm:w-64">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
              <Input
                aria-label={t('Search groups')}
                placeholder={t('Search groups by name or course')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="ps-9 w-full"
              />
            </label>
            <select
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              aria-label={t('Filter by status')}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 w-full sm:w-auto min-w-36 rounded-lg border border-border bg-input/40 px-3 text-start text-sm"
            >
              <option value="All">{t('All statuses')}</option>
              {(['Planned', 'Active', 'Completed', 'Cancelled'] as CourseGroupStatus[]).map((status) => (
                <option key={status} value={status}>{t(status)}</option>
              ))}
            </select>
            {isFiltered && (
              <Button variant="ghost" size="sm" onClick={resetFilters} leadingIcon={<FilterX className="size-3.5" />}>
                {t('Clear filters')}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {loading ? (
            <TableSkeleton columns={6} rows={5} />
          ) : loadError ? (
            <ErrorState
              title={t('Could not load course groups')}
              description={loadError}
              onRetry={() => void load()}
              className="my-4"
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="size-5" />}
              title={
                isFiltered
                  ? t('No groups match your search')
                  : courses.length || !canManage
                  ? t('No groups yet')
                  : t('Create a course first')
              }
              description={
                isFiltered
                  ? t('Try changing your search or status filter.')
                  : courses.length || !canManage
                  ? canManage
                    ? t('Create your first group to organize a course.')
                    : t('Groups will appear here when they are added to your center.')
                  : t('Groups need an existing course. Add a course before creating a group.')
              }
              action={
                isFiltered ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    {t('Clear filters')}
                  </Button>
                ) : canManage && courses.length > 0 ? (
                  <Button onClick={() => openForm()} leadingIcon={<Plus className="size-4" />}>
                    {t('Create group')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[740px] text-start text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-3 py-3 text-start font-medium">{t('Group')}</th>
                    <th className="px-3 py-3 text-start font-medium">{t('Course')}</th>
                    <th className="px-3 py-3 text-start font-medium">{t('Schedule')}</th>
                    <th className="px-3 py-3 text-start font-medium">{t('Capacity')}</th>
                    <th className="px-3 py-3 text-start font-medium">{t('Status')}</th>
                    <th className="px-3 py-3 text-end font-medium">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((group) => {
                    const assigned = Number.isInteger(group.enrolledCount) ? Math.max(0, group.enrolledCount ?? 0) : null;
                    const fill = assigned === null || !group.capacity ? null : Math.min(100, Math.round((assigned / group.capacity) * 100));
                    return (
                      <tr key={group.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-4 font-medium">{group.name}</td>
                        <td className="px-3 py-4 text-muted-foreground">{getCourseTitle(group)}</td>
                        <td className="px-3 py-4 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="size-3.5"/>{group.startDate} – {group.endDate}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="min-w-28">
                            <p className="inline-flex items-center gap-1 text-muted-foreground">
                              <Users className="size-3.5"/>
                              {assigned === null ? `${group.capacity} ${t('learners')}` : `${assigned} / ${group.capacity} ${t('learners')}`}
                            </p>
                            {fill !== null && (
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={t('Group capacity')} aria-valuemin={0} aria-valuemax={group.capacity} aria-valuenow={assigned ?? 0}>
                                <div className="h-full rounded-full bg-primary" style={{ width: `${fill}%` }}/>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <Badge variant={group.status === 'Active' ? 'success' : group.status === 'Planned' ? 'warning' : 'secondary'}>
                            {t(group.status)}
                          </Badge>
                        </td>
                        <td className="px-3 py-4 text-end">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setSelected(group)} leadingIcon={<Eye className="size-3.5"/>}>
                              {t('View')}
                            </Button>
                            {canManage && (
                              <Button variant="ghost" size="sm" onClick={() => openForm(group)} leadingIcon={<Pencil className="size-3.5"/>}>
                                {t('Edit')}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Details Modal */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={t('Group details')}
        description={t('Review course, instructor, schedule, and capacity details.')}
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSelected(null)}>
              {t('Close')}
            </Button>
            {canManage && selected && (
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  const group = selected;
                  setSelected(null);
                  openForm(group);
                }}
                leadingIcon={<Pencil className="size-4"/>}
              >
                {t('Edit group')}
              </Button>
            )}
          </div>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{getCourseTitle(selected)}</p>
              </div>
              <Badge variant={selected.status === 'Active' ? 'success' : selected.status === 'Planned' ? 'warning' : 'secondary'}>
                {t(selected.status)}
              </Badge>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <dt className="text-xs text-muted-foreground">{t('Schedule')}</dt>
                <dd className="mt-1 text-sm font-medium">{selected.startDate} – {selected.endDate}</dd>
              </div>
              <div className="rounded-lg border border-border p-3">
                <dt className="text-xs text-muted-foreground">{t('Capacity')}</dt>
                <dd className="mt-1 text-sm font-medium">
                  {Number.isInteger(selected.enrolledCount) ? `${selected.enrolledCount} / ${selected.capacity} ${t('learners')}` : `${selected.capacity} ${t('learners')}`}
                </dd>
                {Number.isInteger(selected.enrolledCount) && selected.capacity > 0 && (
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, ((selected.enrolledCount ?? 0) / selected.capacity) * 100)}%` }}/>
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {Number.isInteger(selected.enrolledCount) ? t('Enrollment count provided by your center.') : t('Enrollment count is not available yet.')}
                </p>
              </div>
            </dl>
            <div>
              <h3 className="text-sm font-medium">{t('Assigned instructors')}</h3>
              {(selected.instructorIds ?? []).length ? (
                <ul className="mt-2 space-y-2">
                  {selected.instructorIds?.map((id) => {
                    const instructor = instructors.find((item) => item.id === id);
                    return <li key={id} className="rounded-lg border border-border px-3 py-2 text-sm">{instructor?.name ?? t('Instructor unavailable')}</li>;
                  })}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{t('No instructors assigned yet.')}</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Group Modal */}
      <Modal
        open={open}
        onClose={() => {
          if (!saving) setOpen(false);
        }}
        title={t(editing ? 'Edit group' : 'Create group')}
        description={t(editing ? 'Update the group details.' : 'Add a group to organize a course.')}
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" form="group-form" loading={saving} loadingLabel={t('Saving...')}>
              {t(editing ? 'Save changes' : 'Create group')}
            </Button>
          </div>
        }
      >
        <form id="group-form" onSubmit={submit} noValidate className="space-y-4">
          <Input
            label={t('Group name')}
            required
            maxLength={120}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            error={errors.name}
          />
          <label className="block space-y-1.5 text-xs font-medium">
            {t('Course')}
            <select
              required
              value={form.courseId}
              onChange={(event) => setForm({ ...form, courseId: event.target.value })}
              aria-invalid={Boolean(errors.courseId)}
              className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm"
            >
              <option value="">{t('Select a course')}</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            {errors.courseId && <span role="alert" className="block text-destructive">{errors.courseId}</span>}
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t('Start date')}
              type="date"
              required
              value={form.startDate}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              error={errors.startDate}
            />
            <Input
              label={t('End date')}
              type="date"
              required
              value={form.endDate}
              onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              error={errors.endDate}
            />
          </div>
          <Input
            label={t('Learner capacity')}
            type="number"
            min={1}
            max={10000}
            required
            value={form.capacity}
            onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })}
            description={t('Maximum number of learners allowed in this group.')}
            error={errors.capacity}
          />
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium">{t('Assign instructors')}</legend>
            {instructorLoadError ? (
              <div className="rounded-lg border border-destructive/30 p-3 text-xs text-destructive">
                <p role="alert">{instructorLoadError}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => instructorsApi.list(orgId, demo).then(setInstructors).catch((error) => setInstructorLoadError(t(getErrorPresentation(error).description)))}
                >
                  {t('Try again')}
                </Button>
              </div>
            ) : instructors.filter((instructor) => instructor.status === 'Active').length ? (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {instructors.filter((instructor) => instructor.status === 'Active').map((instructor) => (
                  <label key={instructor.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted/60">
                    <input
                      type="checkbox"
                      checked={form.instructorIds?.includes(instructor.id) ?? false}
                      onChange={(event) => setForm({
                        ...form,
                        instructorIds: event.target.checked
                          ? [...(form.instructorIds ?? []), instructor.id]
                          : (form.instructorIds ?? []).filter((id) => id !== instructor.id)
                      })}
                      className="size-4 accent-primary"
                    />
                    <span>{instructor.name}</span>
                    <span className="ms-auto text-xs text-muted-foreground">{instructor.expertise || instructor.email}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                {t('No active instructors are available. Add an instructor before assigning one.')}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{t('Instructor assignment is optional. You can select more than one.')}</p>
          </fieldset>
          <label className="block space-y-1.5 text-xs font-medium">
            {t('Status')}
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as CourseGroupStatus })}
              className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm"
            >
              {(['Planned', 'Active', 'Completed', 'Cancelled'] as CourseGroupStatus[]).map((status) => (
                <option key={status} value={status}>{t(status)}</option>
              ))}
            </select>
          </label>
          {saveError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
        </form>
      </Modal>
    </section>
  );
}

