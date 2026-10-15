import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Search,
  FilterX,
  Pencil,
  Trash2,
  Calendar,
  Award,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Textarea,
} from '@/components/ui';
import apiClient from '@/api/apiClient';
import { getErrorPresentation, getFieldErrors } from '@/utils/errorPresentation';
import {
  assignmentsApi,
  type AssignmentDto,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
} from '../api/assignmentsApi';

interface CohortOption {
  id: string;
  name: string;
  courseId?: string;
  courseName?: string;
}

interface BackendCohortDto {
  id: string;
  name: string;
  courseId?: string;
  courseName?: string;
}

export default function AssignmentsList() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDemo = Boolean(user?.demo);

  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Draft' | 'Closed'>('All');
  const [cohortFilter, setCohortFilter] = useState<string>('All');

  // Cohort options for creation and filtering
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [cohortsLoading, setCohortsLoading] = useState(false);

  // Modal States
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentDto | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<AssignmentDto | null>(null);

  // Form State
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [status, setStatus] = useState<number>(1);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchCohorts = useCallback(async () => {
    setCohortsLoading(true);
    try {
      if (user?.role === 'INSTRUCTOR' && !isDemo) {
        const { data } = await apiClient.get<BackendCohortDto[]>('/instructors/me/cohorts');
        setCohorts(data || []);
      } else {
        const { data } = await apiClient.get<any>('/coursegroups');
        const items: BackendCohortDto[] = Array.isArray(data) ? data : data?.items || [];
        setCohorts(items);
      }
    } catch {
      // In demo or fallback mode, provide mock cohorts if empty
      setCohorts([
        { id: 'demo-group-1', name: 'Cohort A', courseName: 'Fullstack Web Development' },
        { id: 'demo-group-2', name: 'Cohort B', courseName: 'JavaScript Essentials' },
      ]);
    } finally {
      setCohortsLoading(false);
    }
  }, [user?.role, isDemo]);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await assignmentsApi.list({}, isDemo);
      setAssignments(res.items || []);
    } catch (err) {
      setError(getErrorPresentation(err).description || t('Failed to load assignments.'));
    } finally {
      setLoading(false);
    }
  }, [isDemo, t]);

  useEffect(() => {
    void fetchCohorts();
    void fetchAssignments();
  }, [fetchCohorts, fetchAssignments]);

  // Check ?action=create in search params
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      openCreateModal();
    }
  }, [searchParams]);

  const openCreateModal = () => {
    setEditingAssignment(null);
    setSelectedCohortId(cohorts[0]?.id || '');
    setTitle('');
    setDescription('');
    // Default to 7 days from now formatted for datetime-local
    const inAWeek = new Date(Date.now() + 7 * 86400000);
    setDueDate(inAWeek.toISOString().slice(0, 16));
    setMaxScore(100);
    setStatus(1);
    setFormError(null);
    setFieldErrors({});
    setCreateOpen(true);
  };

  const openEditModal = (assignment: AssignmentDto) => {
    setEditingAssignment(assignment);
    setSelectedCohortId(assignment.courseGroupId);
    setTitle(assignment.title);
    setDescription(assignment.description || '');
    try {
      setDueDate(new Date(assignment.dueDate).toISOString().slice(0, 16));
    } catch {
      setDueDate('');
    }
    setMaxScore(assignment.maxScore);
    setStatus(assignment.status);
    setFormError(null);
    setFieldErrors({});
    setCreateOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setCreateOpen(false);
    setEditingAssignment(null);
    setFormError(null);
    setFieldErrors({});
    if (searchParams.get('action') === 'create') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    const trimmedTitle = title.trim();

    if (!trimmedTitle || trimmedTitle.length < 2) {
      errors.title = t('Title must be at least 2 characters.');
    } else if (trimmedTitle.length > 200) {
      errors.title = t('Title cannot exceed 200 characters.');
    }

    if (!editingAssignment && !selectedCohortId) {
      errors.courseGroupId = t('Please select a course group.');
    }

    if (!dueDate) {
      errors.dueDate = t('Due date is required.');
    }

    if (!maxScore || maxScore < 1 || maxScore > 1000) {
      errors.maxScore = t('Max score must be between 1 and 1000.');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const parsedDueDate = new Date(dueDate).toISOString();

      if (editingAssignment) {
        const updatePayload: UpdateAssignmentInput = {
          title: trimmedTitle,
          description: description.trim() || null,
          dueDate: parsedDueDate,
          maxScore: Number(maxScore),
          status,
        };
        await assignmentsApi.update(editingAssignment.id, updatePayload, isDemo);
        setSuccessMessage(t('Assignment updated successfully.'));
      } else {
        const selectedCohort = cohorts.find((c) => c.id === selectedCohortId);
        const createPayload: CreateAssignmentInput = {
          courseGroupId: selectedCohortId,
          title: trimmedTitle,
          description: description.trim() || null,
          dueDate: parsedDueDate,
          maxScore: Number(maxScore),
          status,
        };
        await assignmentsApi.create(createPayload, isDemo, selectedCohort?.name, selectedCohort?.courseName);
        setSuccessMessage(t('Assignment created successfully.'));
      }

      closeModal();
      await fetchAssignments();
    } catch (err) {
      const pres = getErrorPresentation(err);
      const extractedFieldErrors = getFieldErrors(err);
      setFieldErrors(extractedFieldErrors);
      setFormError(pres.description || pres.title || t('Failed to save assignment.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAssignment) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await assignmentsApi.delete(deletingAssignment.id, isDemo);
      setSuccessMessage(t('Assignment deleted successfully.'));
      setDeletingAssignment(null);
      await fetchAssignments();
    } catch (err) {
      const pres = getErrorPresentation(err);
      setDeleteError(pres.description || pres.title || t('Failed to delete assignment.'));
    } finally {
      setDeleting(false);
    }
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchQuery =
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(query.toLowerCase())) ||
        a.courseGroupName.toLowerCase().includes(query.toLowerCase()) ||
        a.courseName.toLowerCase().includes(query.toLowerCase());

      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && a.status === 1) ||
        (statusFilter === 'Draft' && a.status === 0) ||
        (statusFilter === 'Closed' && a.status === 2);

      const matchCohort =
        cohortFilter === 'All' || a.courseGroupId === cohortFilter;

      return matchQuery && matchStatus && matchCohort;
    });
  }, [assignments, query, statusFilter, cohortFilter]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {t('Teaching')}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {t('Assignments')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('Create, manage, and monitor coursework and deliverables for your cohorts.')}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={openCreateModal}
          leadingIcon={<Plus className="size-4" />}
        >
          {t('Add assignment')}
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

      {/* Filter Toolbar */}
      <Card className="border-border bg-card/60 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('Search assignments, courses, cohorts...')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="ps-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {cohorts.length > 0 && (
              <Select value={cohortFilter} onValueChange={(val) => setCohortFilter(val ?? 'All')}>
                <SelectTrigger className="w-[180px] text-xs">
                  <SelectValue placeholder={t('Filter by cohort')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{t('All cohorts')}</SelectItem>
                  {cohorts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(['All', 'Active', 'Draft', 'Closed'] as const).map((filter) => (
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

            {(query || statusFilter !== 'All' || cohortFilter !== 'All') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('All');
                  setCohortFilter('All');
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

      {/* Assignments Content */}
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
            onClick={() => void fetchAssignments()}
            className="mt-3 gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            <span>{t('Try again')}</span>
          </Button>
        </Card>
      ) : filteredAssignments.length === 0 ? (
        <Card className="border-border bg-card/60">
          <EmptyState
            icon={<ClipboardList className="size-6 text-primary" />}
            title={t('No assignments found')}
            description={
              query || statusFilter !== 'All' || cohortFilter !== 'All'
                ? t('No assignments match the specified filters.')
                : t('No assignments have been assigned yet. Click "Add assignment" to create one.')
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden border-border bg-card/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start">{t('Assignment Title')}</th>
                  <th className="px-4 py-3 text-start">{t('Course / Cohort')}</th>
                  <th className="px-4 py-3 text-start">{t('Due Date')}</th>
                  <th className="px-4 py-3 text-start">{t('Max Score')}</th>
                  <th className="px-4 py-3 text-start">{t('Status')}</th>
                  <th className="px-4 py-3 text-end">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      <div className="font-semibold text-foreground">{assignment.title}</div>
                      {assignment.description && (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                          {assignment.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-foreground">{assignment.courseGroupName}</div>
                      {assignment.courseName && (
                        <div className="text-[11px] text-muted-foreground">{assignment.courseName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        {new Date(assignment.dueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Award className="size-3.5 text-amber-400" />
                        {assignment.maxScore} {t('pts')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          assignment.status === 1
                            ? 'success'
                            : assignment.status === 0
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {t(assignment.statusName)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(assignment)}
                          className="size-8 p-0"
                          title={t('Edit')}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingAssignment(assignment)}
                          className="size-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title={t('Delete')}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={createOpen}
        onClose={closeModal}
        title={editingAssignment ? t('Edit Assignment') : t('Create Assignment')}
        description={
          editingAssignment
            ? t('Update coursework instructions and deadline.')
            : t('Add a new assignment for an authorized cohort.')
        }
        size="md"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" type="button" disabled={saving} onClick={closeModal}>
              {t('Cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="assignment-form"
              disabled={saving}
              leadingIcon={saving ? <Spinner className="size-4" /> : <Plus className="size-4" />}
            >
              {saving
                ? t('Saving...')
                : editingAssignment
                ? t('Save Changes')
                : t('Create Assignment')}
            </Button>
          </div>
        }
      >
        <form id="assignment-form" onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <p className="text-xs">{formError}</p>
            </Alert>
          )}

          {!editingAssignment && (
            <div>
              <Label htmlFor="asg-cohort" className="text-xs font-medium">
                {t('Cohort (Course Group)')} <span className="text-destructive">*</span>
              </Label>
              {cohortsLoading ? (
                <p className="mt-1 text-xs text-muted-foreground">{t('Loading cohorts...')}</p>
              ) : (
                <Select value={selectedCohortId} onValueChange={(val) => setSelectedCohortId(val ?? '')} disabled={saving}>
                  <SelectTrigger id="asg-cohort" className="mt-1">
                    <SelectValue placeholder={t('Select cohort')} />
                  </SelectTrigger>
                  <SelectContent>
                    {cohorts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.courseName ? `(${c.courseName})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {fieldErrors.courseGroupId && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.courseGroupId}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="asg-title" className="text-xs font-medium">
              {t('Assignment Title')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="asg-title"
              type="text"
              required
              disabled={saving}
              placeholder={t('e.g. Project Milestone 1')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.title}</p>
            )}
          </div>

          <div>
            <Label htmlFor="asg-desc" className="text-xs font-medium">
              {t('Description & Instructions')}
            </Label>
            <Textarea
              id="asg-desc"
              rows={3}
              disabled={saving}
              placeholder={t('Provide detailed submission requirements and instructions...')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 text-xs"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="asg-duedate" className="text-xs font-medium">
                {t('Due Date')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="asg-duedate"
                type="datetime-local"
                required
                disabled={saving}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
              {fieldErrors.dueDate && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.dueDate}</p>
              )}
            </div>

            <div>
              <Label htmlFor="asg-maxscore" className="text-xs font-medium">
                {t('Max Score (Points)')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="asg-maxscore"
                type="number"
                min={1}
                max={1000}
                required
                disabled={saving}
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="mt-1"
              />
              {fieldErrors.maxScore && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.maxScore}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="asg-status" className="text-xs font-medium">
              {t('Status')}
            </Label>
            <Select
              value={String(status)}
              onValueChange={(val) => setStatus(Number(val))}
              disabled={saving}
            >
              <SelectTrigger id="asg-status" className="mt-1">
                <SelectValue placeholder={t('Select status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('Active')}</SelectItem>
                <SelectItem value="0">{t('Draft')}</SelectItem>
                <SelectItem value="2">{t('Closed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deletingAssignment)}
        onClose={() => {
          if (!deleting) setDeletingAssignment(null);
        }}
        title={t('Delete Assignment')}
        description={t('Are you sure you want to delete this assignment?')}
        size="sm"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={deleting}
              onClick={() => setDeletingAssignment(null)}
            >
              {t('Cancel')}
            </Button>
            <Button
              variant="destructive"
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              leadingIcon={deleting ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
            >
              {deleting ? t('Deleting...') : t('Delete Assignment')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {deleteError && (
            <Alert variant="destructive">
              <p className="text-xs">{deleteError}</p>
            </Alert>
          )}
          <p className="text-xs text-muted-foreground">
            {t('You are about to delete:')} <span className="font-semibold text-foreground">{deletingAssignment?.title}</span>.
          </p>
          <p className="text-xs text-destructive font-medium">
            {t('This action cannot be undone.')}
          </p>
        </div>
      </Modal>
    </div>
  );
}
