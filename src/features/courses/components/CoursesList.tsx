import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, Clock3, Pencil, Plus, Search, Eye, CalendarDays, Users, Trash2, FilterX } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, CourseCardSkeletonGrid, EmptyState, Input, Modal } from '@/components/ui';
import { getErrorPresentation } from '@/utils/errorPresentation';
import { coursesApi, type Course, type CourseInput, type CourseStatus } from '../api/coursesApi';
import CourseStudentsPanel from './CourseStudentsPanel';

const blank: CourseInput = { title: '', description: '', category: '', level: 'Beginner', durationHours: 1, status: 'Draft' };
type Errors = Partial<Record<'title' | 'category' | 'durationHours', string>>;

export default function CoursesList() {
  const { orgId = 'demo' } = useParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const canManage = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN';
  const demo = Boolean(user?.demo);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Course | null>(null);
  const [studentsCourse, setStudentsCourse] = useState<Course | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseInput>(blank);
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setCourses(await coursesApi.list(orgId, demo));
    } catch (error) {
      setLoadError(t(getErrorPresentation(error).description));
    } finally {
      setLoading(false);
    }
  }, [orgId, demo, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => courses.filter((course) =>
    `${course.title} ${course.category} ${course.description} ${course.level}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (statusFilter === 'All' || course.status === statusFilter) &&
    (categoryFilter === 'All' || course.category === categoryFilter)
  ), [courses, query, statusFilter, categoryFilter]);

  const categories = useMemo(() => [...new Set(courses.map((course) => course.category).filter(Boolean))].sort(), [courses]);
  const isFiltered = query.trim() !== '' || statusFilter !== 'All' || categoryFilter !== 'All';

  const resetFilters = () => {
    setQuery('');
    setStatusFilter('All');
    setCategoryFilter('All');
  };

  const openForm = (course?: Course) => {
    setEditing(course ?? null);
    setForm(course ? { title: course.title, description: course.description, category: course.category, level: course.level, durationHours: course.durationHours, status: course.status } : blank);
    setErrors({});
    setSaveError('');
    setOpen(true);
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!window.confirm(t('Are you sure you want to delete this course? This action cannot be undone.'))) return;
    try {
      await coursesApi.delete(orgId, course.id, demo);
      setCourses((current) => current.filter((item) => item.id !== course.id));
      setSelected(null);
    } catch (error) {
      const presentation = getErrorPresentation(error);
      alert(t(presentation.title === 'Access denied' ? 'You do not have permission to delete this course.' : presentation.description));
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    const title = form.title.trim();
    const category = form.category.trim();
    if (title.length < 2) next.title = t('Enter a course title with at least 2 characters.');
    if (!category) next.category = t('Enter a course category.');
    if (!Number.isFinite(form.durationHours) || form.durationHours < 1 || form.durationHours > 10000) next.durationHours = t('Duration must be between 1 and 10000 hours.');
    if (courses.some((course) => course.title.toLocaleLowerCase() === title.toLocaleLowerCase() && course.id !== editing?.id)) next.title = t('A course with this title already exists.');
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setSaveError('');
    try {
      const payload = { ...form, title, category, description: form.description.trim() };
      const saved = editing ? await coursesApi.update(orgId, editing.id, payload, demo) : await coursesApi.create(orgId, payload, demo);
      setCourses((current) => editing ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setOpen(false);
    } catch (error) {
      const presentation = getErrorPresentation(error);
      setSaveError(t(presentation.title === 'Access denied' ? 'You do not have permission to save course changes.' : presentation.description));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{t('Training')}</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{t('Courses')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('View and manage courses at your training center.')}</p>
        </div>
        {canManage && (
          <Button onClick={() => openForm()} className="w-full sm:w-auto" leadingIcon={<Plus className="size-4" />}>
            {t('Create course')}
          </Button>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total courses', value: courses.length },
          { label: 'Active courses', value: courses.filter((c) => c.status === 'Active').length },
          { label: 'Draft courses', value: courses.filter((c) => c.status === 'Draft').length },
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
          <CardTitle className="text-sm">{t('Course catalog')}</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <label className="relative w-full sm:w-64">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label={t('Search courses')}
                placeholder={t('Search courses by title or category')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ps-9 w-full"
              />
            </label>
            <div className="flex w-full gap-2 sm:w-auto">
              <select
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                aria-label={t('Filter by status')}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 flex-1 sm:flex-none sm:min-w-32 rounded-lg border border-border bg-input/40 px-3 text-start text-sm"
              >
                <option value="All">{t('All statuses')}</option>
                {(['Draft', 'Active', 'Archived'] as CourseStatus[]).map((s) => (
                  <option key={s} value={s}>{t(s)}</option>
                ))}
              </select>
              <select
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                aria-label={t('Filter by category')}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 flex-1 sm:flex-none sm:min-w-36 rounded-lg border border-border bg-input/40 px-3 text-start text-sm"
              >
                <option value="All">{t('All categories')}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            {isFiltered && (
              <Button variant="ghost" size="sm" onClick={resetFilters} leadingIcon={<FilterX className="size-3.5" />}>
                {t('Clear filters')}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {loading ? (
            <CourseCardSkeletonGrid count={6} />
          ) : loadError ? (
            <div className="py-8 text-center">
              <p role="alert" className="mb-3 text-sm text-destructive">{loadError}</p>
              <Button variant="outline" onClick={() => void load()}>{t('Try again')}</Button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="size-5" />}
              title={isFiltered ? t('No courses match your search') : t('No courses yet')}
              description={
                isFiltered
                  ? t('Try changing your search or status filter.')
                  : canManage
                  ? t('Create your first course to start building your catalog.')
                  : t('Courses will appear here when they are added to your center.')
              }
              action={
                isFiltered ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    {t('Clear filters')}
                  </Button>
                ) : canManage ? (
                  <Button onClick={() => openForm()} leadingIcon={<Plus className="size-4" />}>
                    {t('Create course')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((course) => (
                <article key={course.id} className="rounded-xl border border-border p-4 transition-colors hover:border-border/80 bg-card">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <BookOpen className="size-5" />
                    </span>
                    <Badge variant={course.status === 'Active' ? 'success' : course.status === 'Draft' ? 'warning' : 'secondary'}>
                      {t(course.status)}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(course)}
                    className="mt-4 text-start font-semibold hover:text-primary hover:underline line-clamp-1"
                  >
                    {course.title}
                  </button>
                  <p className="mt-1 text-xs text-muted-foreground">{course.category} · {t(course.level)}</p>
                  <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                    {course.description || t('No course description.')}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3.5" />
                      {course.durationHours} {t('hours')}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(course)} leadingIcon={<Eye className="size-3.5" />}>
                        {t('View')}
                      </Button>
                      {canManage && (
                        <Button variant="ghost" size="sm" onClick={() => openForm(course)} leadingIcon={<Pencil className="size-3.5" />}>
                          {t('Edit')}
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Details Modal */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={t('Course details')}
        description={t('Review course information and publication status.')}
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-end gap-2 w-full">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSelected(null)}>
              {t('Close')}
            </Button>
            {selected && (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setStudentsCourse(selected);
                  setSelected(null);
                }}
                leadingIcon={<Users className="size-4" />}
              >
                {t('Course students')}
              </Button>
            )}
            {canManage && selected && (
              <Button
                variant="outline"
                className="w-full sm:w-auto text-destructive hover:bg-destructive/10"
                onClick={() => void handleDeleteCourse(selected)}
                leadingIcon={<Trash2 className="size-4" />}
              >
                {t('Delete')}
              </Button>
            )}
            {canManage && selected && (
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  const course = selected;
                  setSelected(null);
                  openForm(course);
                }}
                leadingIcon={<Pencil className="size-4" />}
              >
                {t('Edit course')}
              </Button>
            )}
          </div>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{selected.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selected.category} · {t(selected.level)}</p>
              </div>
              <Badge variant={selected.status === 'Active' ? 'success' : selected.status === 'Draft' ? 'warning' : 'secondary'}>
                {t(selected.status)}
              </Badge>
            </div>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selected.description || t('No course description.')}</p>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <dt className="text-xs text-muted-foreground">{t('Duration')}</dt>
                <dd className="mt-1 text-sm font-medium">{selected.durationHours} {t('hours')}</dd>
              </div>
              <div className="rounded-lg border border-border p-3">
                <dt className="text-xs text-muted-foreground">{t('Status')}</dt>
                <dd className="mt-1 text-sm font-medium">{t(selected.status)}</dd>
              </div>
              <div className="rounded-lg border border-border p-3 sm:col-span-2">
                <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  {t('Created')}
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {selected.createdAt && !Number.isNaN(new Date(selected.createdAt).getTime())
                    ? new Date(selected.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
                    : t('Not available')}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>

      {studentsCourse && (
        <CourseStudentsPanel course={studentsCourse} orgId={orgId} onClose={() => setStudentsCourse(null)} />
      )}

      {/* Create/Edit Course Modal */}
      <Modal
        open={open}
        onClose={() => {
          if (!saving) setOpen(false);
        }}
        title={t(editing ? 'Edit course' : 'Create course')}
        description={t(editing ? 'Update the course details.' : 'Add a course to your training center.')}
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" form="course-form" loading={saving} loadingLabel={t('Saving...')}>
              {t(editing ? 'Save changes' : 'Create course')}
            </Button>
          </div>
        }
      >
        <form id="course-form" onSubmit={submit} noValidate className="space-y-4">
          <Input
            label={t('Course title')}
            required
            maxLength={120}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            error={errors.title}
          />
          <Input
            label={t('Category')}
            required
            maxLength={80}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            error={errors.category}
          />
          <label className="block space-y-1.5 text-xs font-medium">
            {t('Description')}
            <textarea
              maxLength={1000}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-input/40 p-3 text-sm"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-xs font-medium">
              {t('Level')}
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm"
              >
                {['Beginner', 'Intermediate', 'Advanced', 'All levels'].map((v) => (
                  <option key={v} value={v}>{t(v)}</option>
                ))}
              </select>
            </label>
            <Input
              label={t('Duration (hours)')}
              type="number"
              min={1}
              max={10000}
              required
              value={form.durationHours}
              onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })}
              error={errors.durationHours}
            />
          </div>
          <label className="block space-y-1.5 text-xs font-medium">
            {t('Status')}
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as CourseStatus })}
              className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm"
            >
              {(['Draft', 'Active', 'Archived'] as CourseStatus[]).map((v) => (
                <option key={v} value={v}>{t(v)}</option>
              ))}
            </select>
          </label>
          {saveError && <p role="alert" className="text-xs text-destructive">{saveError}</p>}
        </form>
      </Modal>
    </section>
  );
}

