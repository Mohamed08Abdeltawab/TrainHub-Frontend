import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarCheck2,
  Check,
  CheckCheck,
  Clock,
  FileText,
  FilterX,
  Percent,
  Save,
  Users,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { getErrorPresentation } from '@/utils/errorPresentation';
import { groupsApi, type CourseGroup } from '@/features/courses/api/groupsApi';
import { enrollmentsApi } from '@/features/courses/api/enrollmentsApi';
import { studentsApi, type Student } from '@/features/students/api/studentsApi';
import { instructorsApi } from '@/features/instructors/api/instructorsApi';
import { sessionsApi, type TrainingSession } from '../api/sessionsApi';
import {
  attendanceApi,
  type AttendanceEntry,
  type AttendanceStatus,
  type BackendAttendancePercentageDto,
} from '../api/attendanceApi';

const statuses: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused'];
const statusTone: Record<AttendanceStatus, 'success' | 'destructive' | 'warning' | 'secondary'> = {
  Present: 'success',
  Absent: 'destructive',
  Late: 'warning',
  Excused: 'secondary',
};

export default function AttendancePage() {
  const { orgId: routeOrgId } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();

  const orgId = routeOrgId ?? user?.organizationId ?? 'demo';
  const demo = Boolean(user?.demo);
  const isStudent = user?.role === 'STUDENT';
  const canMark = user?.role === 'ORG_ADMIN' || user?.role === 'INSTRUCTOR' || user?.role === 'SUPER_ADMIN';

  // Staff State
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [attendanceBySession, setAttendanceBySession] = useState<Record<string, AttendanceEntry[]>>({});
  const [draft, setDraft] = useState<Record<string, AttendanceStatus | ''>>({});
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [editingNotesStudentId, setEditingNotesStudentId] = useState<string | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);

  // Student State
  const [studentRecords, setStudentRecords] = useState<AttendanceEntry[]>([]);
  const [studentPercentage, setStudentPercentage] = useState<BackendAttendancePercentageDto | null>(null);

  // Common Filters
  const [filterGroup, setFilterGroup] = useState('All');
  const [filterSession, setFilterSession] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveNotice, setSaveNotice] = useState(false);

  // Load Data
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      if (isStudent) {
        if (demo) {
          // Demo student mode
          const [allRecords, allSessions, nextGroups] = await Promise.all([
            attendanceApi.listAll(orgId, true),
            sessionsApi.list(orgId, true),
            groupsApi.list(orgId, true),
          ]);
          setSessions(allSessions);
          setGroups(nextGroups);

          // Find records for demo student
          const filtered = allRecords.filter(
            (r) =>
              r.studentId === 'user-student' ||
              (r.studentName && r.studentName.toLowerCase().includes('david kim'))
          );
          setStudentRecords(filtered.length ? filtered : allRecords);

          const pct = await attendanceApi.getPercentage('user-student', undefined, true, orgId);
          setStudentPercentage(pct);
        } else {
          // Real student mode: fetch student-scoped attendance directly
          try {
            const records = await attendanceApi.listAll(orgId, false);
            setStudentRecords(records);

            const studentId = records[0]?.studentId;
            if (studentId) {
              try {
                const pct = await attendanceApi.getPercentage(studentId, undefined, false, orgId);
                setStudentPercentage(pct);
              } catch {
                // percentage calculation fallback below
              }
            }
          } catch {
            // If backend is unreachable, fallback to demo student attendance
            const [allRecords, allSessions, nextGroups] = await Promise.all([
              attendanceApi.listAll(orgId, true),
              sessionsApi.list(orgId, true),
              groupsApi.list(orgId, true),
            ]);
            setSessions(allSessions);
            setGroups(nextGroups);
            setStudentRecords(allRecords);
            const pct = await attendanceApi.getPercentage('user-student', undefined, true, orgId).catch(() => null);
            setStudentPercentage(pct);
          }
        }
      } else {
        // Staff / Admin / Instructor mode
        const [allSessions, nextGroups, nextStudents] = await Promise.all([
          sessionsApi.list(orgId, demo),
          groupsApi.list(orgId, demo),
          studentsApi.list(orgId, demo),
        ]);
        setGroups(nextGroups);
        setStudents(nextStudents);

        let resolvedInstructorId: string | null = null;
        if (user?.role === 'INSTRUCTOR' && user.email) {
          if (demo) {
            const list = await instructorsApi.list(orgId, true);
            resolvedInstructorId = list.find((item) => item.email.toLowerCase() === user.email?.toLowerCase())?.id ?? null;
          } else {
            try {
              const me = await instructorsApi.getMe();
              resolvedInstructorId = me.id;
            } catch {
              const list = await instructorsApi.list(orgId, false);
              resolvedInstructorId = list.find((item) => item.email.toLowerCase() === user.email?.toLowerCase())?.id ?? null;
            }
          }
        }

        const allowedGroups =
          user?.role === 'INSTRUCTOR'
            ? nextGroups.filter((group) => resolvedInstructorId && group.instructorIds?.includes(resolvedInstructorId))
            : nextGroups;

        const visible =
          user?.role === 'INSTRUCTOR'
            ? allSessions.filter((session) => allowedGroups.some((group) => group.id === session.groupId))
            : allSessions;

        setSessions(visible);

        // Check if user came from a specific session shortcut
        let targetId = '';
        try {
          const stored = localStorage.getItem(`trainhub.organization.${orgId}.attendance.selected-session`);
          if (stored && visible.some((s) => s.id === stored)) {
            targetId = stored;
            localStorage.removeItem(`trainhub.organization.${orgId}.attendance.selected-session`);
          }
        } catch {
          // ignore
        }

        setSelectedId((current) => {
          if (targetId) return targetId;
          if (current && visible.some((session) => session.id === current)) return current;
          return visible[0]?.id ?? '';
        });
      }
    } catch (error) {
      setLoadError(t(getErrorPresentation(error).description));
    } finally {
      setLoading(false);
    }
  }, [orgId, demo, isStudent, user, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = sessions.find((session) => session.id === selectedId);
  const group = groups.find((item) => item.id === selected?.groupId);

  useEffect(() => {
    if (isStudent) return;
    let cancelled = false;
    if (!group) {
      setEnrolledIds([]);
      return;
    }
    void enrollmentsApi
      .list(orgId, group.courseId, demo, { courseGroupId: group.id })
      .then((items) => {
        if (!cancelled) {
          setEnrolledIds(items.filter((item) => item.status === 'Active').map((item) => item.studentId));
        }
      })
      .catch((error) => {
        if (!cancelled) setLoadError(t(getErrorPresentation(error).description));
      });
    return () => {
      cancelled = true;
    };
  }, [group, orgId, demo, isStudent, t]);

  const roster = useMemo(() => {
    if (!group || isStudent) return [];
    return students.filter((student) => student.status === 'Active' && enrolledIds.includes(student.id));
  }, [group, isStudent, students, enrolledIds]);

  const refreshAttendance = useCallback(async () => {
    if (isStudent || !selectedId) {
      setEntries([]);
      setDraft({});
      setNotesDraft({});
      return;
    }
    try {
      const current = await attendanceApi.list(orgId, selectedId, demo);
      setEntries(current);
      setDraft(Object.fromEntries(current.map((entry) => [entry.studentId, entry.status])));
      setNotesDraft(Object.fromEntries(current.map((entry) => [entry.studentId, entry.notes ?? ''])));
      setSaveNotice(false);
    } catch (error) {
      setLoadError(t(getErrorPresentation(error).description));
    }
  }, [isStudent, selectedId, orgId, demo, t]);

  useEffect(() => {
    void refreshAttendance();
  }, [refreshAttendance]);

  useEffect(() => {
    if (isStudent) return;
    let cancelled = false;
    void Promise.all(
      sessions.map(async (session) => [session.id, await attendanceApi.list(orgId, session.id, demo)] as const)
    )
      .then((rows) => {
        if (!cancelled) setAttendanceBySession(Object.fromEntries(rows));
      })
      .catch((error) => {
        if (!cancelled) setLoadError(t(getErrorPresentation(error).description));
      });
    return () => {
      cancelled = true;
    };
  }, [sessions, orgId, demo, isStudent, t]);

  const recorded = entries.length;
  const dirty =
    canMark &&
    roster.some((student) => {
      const existing = entries.find((entry) => entry.studentId === student.id);
      const statusChanged = (draft[student.id] ?? '') !== (existing?.status ?? '');
      const noteChanged = (notesDraft[student.id] ?? '') !== (existing?.notes ?? '');
      return statusChanged || noteChanged;
    });

  const mark = (studentId: string, status: AttendanceStatus) => {
    setDraft((current) => ({ ...current, [studentId]: status }));
    setSaveError('');
    setSaveNotice(false);
  };

  const markAllPresent = () => {
    const nextDraft: Record<string, AttendanceStatus> = {};
    for (const student of roster) {
      nextDraft[student.id] = 'Present';
    }
    setDraft((current) => ({ ...current, ...nextDraft }));
    setSaveError('');
    setSaveNotice(false);
  };

  const save = async () => {
    if (!selected || !canMark) return;
    const missing = roster.filter((student) => !draft[student.id]);
    if (missing.length) {
      setSaveError(t('Mark an attendance status for every learner before saving.'));
      return;
    }
    setSaving(true);
    setSaveError('');
    setSaveNotice(false);
    try {
      const now = new Date().toISOString();
      const next: AttendanceEntry[] = roster.map((student) => ({
        studentId: student.id,
        sessionId: selected.id,
        status: draft[student.id] as AttendanceStatus,
        notes: notesDraft[student.id]?.trim() || undefined,
        markedAt: entries.find((entry) => entry.studentId === student.id)?.markedAt ?? now,
        markedBy: user?.email,
      }));
      const saved = await attendanceApi.save(orgId, selected.id, next, demo);
      setEntries(saved);
      setAttendanceBySession((current) => ({ ...current, [selected.id]: saved }));
      setDraft(Object.fromEntries(saved.map((entry) => [entry.studentId, entry.status])));
      setNotesDraft(Object.fromEntries(saved.map((entry) => [entry.studentId, entry.notes ?? ''])));
      setSaveNotice(true);
      setEditingNotesStudentId(null);
    } catch (error) {
      const presentation = getErrorPresentation(error);
      setSaveError(
        t(
          presentation.title === 'Access denied'
            ? 'You do not have permission to mark attendance.'
            : presentation.description
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // Staff summary calculation
  const staffSummaryRows = useMemo(() => {
    return sessions
      .flatMap((session) => {
        if (filterGroup !== 'All' && session.groupId !== filterGroup) return [];
        if (filterSession !== 'All' && session.id !== filterSession) return [];
        if ((dateFrom && session.date < dateFrom) || (dateTo && session.date > dateTo)) return [];
        const groupName = groups.find((item) => item.id === session.groupId)?.name ?? t('Cohort unavailable');
        return (attendanceBySession[session.id] ?? []).flatMap((entry) => {
          if (filterStatus !== 'All' && entry.status !== filterStatus) return [];
          const learner = students.find((item) => item.id === entry.studentId);
          return [
            {
              session,
              groupName,
              studentName: learner?.name ?? entry.studentName ?? t('Learner'),
              studentCode: learner?.studentCode ?? entry.studentCode ?? '',
              status: entry.status,
              notes: entry.notes,
              markedAt: entry.markedAt,
            },
          ];
        });
      })
      .sort((a, b) => `${b.session.date} ${b.session.startTime}`.localeCompare(`${a.session.date} ${a.session.startTime}`));
  }, [sessions, filterGroup, filterSession, filterStatus, dateFrom, dateTo, groups, attendanceBySession, students, t]);

  // Student summary calculation
  const studentFilteredRecords = useMemo(() => {
    return studentRecords.filter((record) => {
      if (filterStatus !== 'All' && record.status !== filterStatus) return false;
      const recDate = record.sessionStartTime ? record.sessionStartTime.split('T')[0] : record.markedAt.split('T')[0];
      if (dateFrom && recDate < dateFrom) return false;
      if (dateTo && recDate > dateTo) return false;
      return true;
    }).sort((a, b) => {
      const dateA = a.sessionStartTime || a.markedAt;
      const dateB = b.sessionStartTime || b.markedAt;
      return dateB.localeCompare(dateA);
    });
  }, [studentRecords, filterStatus, dateFrom, dateTo]);

  // Student metrics
  const studentTotalRecords = studentPercentage?.totalRecords ?? studentRecords.length;
  const studentPresentCount = studentPercentage?.presentCount ?? studentRecords.filter((r) => r.status === 'Present').length;
  const studentLateCount = studentPercentage?.lateCount ?? studentRecords.filter((r) => r.status === 'Late').length;
  const studentAbsentCount = studentPercentage?.absentCount ?? studentRecords.filter((r) => r.status === 'Absent').length;
  const studentExcusedCount = studentPercentage?.excusedCount ?? studentRecords.filter((r) => r.status === 'Excused').length;
  const studentAttendedCount = studentPercentage?.attendedCount ?? (studentPresentCount + studentLateCount);
  const studentAttendanceRate =
    studentPercentage?.attendancePercentage ??
    (studentTotalRecords > 0 ? Math.round((studentAttendedCount / studentTotalRecords) * 100) : 0);

  // Staff metrics
  const staffSummaryCount = (status: AttendanceStatus) => staffSummaryRows.filter((row) => row.status === status).length;
  const staffAttendedCount = staffSummaryCount('Present') + staffSummaryCount('Late');
  const staffAttendanceRate = staffSummaryRows.length ? Math.round((staffAttendedCount / staffSummaryRows.length) * 100) : 0;

  const resetFilters = () => {
    setFilterGroup('All');
    setFilterSession('All');
    setFilterStatus('All');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = filterGroup !== 'All' || filterSession !== 'All' || filterStatus !== 'All' || dateFrom !== '' || dateTo !== '';

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">{t('Training')}</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          {t(isStudent ? 'My Attendance' : 'Attendance')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            isStudent
              ? 'View your attendance rate and track your course session history.'
              : 'Review session attendance and record each learner’s status.'
          )}
        </p>
      </header>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground" role="status">
            {t('Loading attendance...')}
          </CardContent>
        </Card>
      ) : loadError ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p role="alert" className="mb-3 text-sm text-destructive">
              {loadError}
            </p>
            <Button variant="outline" onClick={() => void load()}>
              {t('Try again')}
            </Button>
          </CardContent>
        </Card>
      ) : isStudent ? (
        /* ========================================================================= */
        /*                          STUDENT ATTENDANCE VIEW                          */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Student Overview Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <Card className="sm:col-span-2 border-border/80 bg-gradient-to-br from-card to-muted/20">
              <CardContent className="flex flex-col justify-between p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">{t('Overall Attendance Rate')}</p>
                  <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Percent className="size-4" />
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {studentTotalRecords > 0 ? `${studentAttendanceRate}%` : '—'}
                  </p>
                  {studentTotalRecords > 0 && (
                    <Badge
                      variant={studentAttendanceRate >= 80 ? 'success' : studentAttendanceRate >= 70 ? 'warning' : 'destructive'}
                      className="text-[11px]"
                    >
                      {t(studentAttendanceRate >= 80 ? 'Good standing' : studentAttendanceRate >= 70 ? 'Average' : 'Needs attention')}
                    </Badge>
                  )}
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full transition-all duration-500 rounded-full',
                        studentAttendanceRate >= 80 ? 'bg-emerald-500' : studentAttendanceRate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, studentAttendanceRate))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t('{attended} of {total} sessions attended', { attended: studentAttendedCount, total: studentTotalRecords })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{t('Present')}</p>
                  <Badge variant="success" className="text-[10px]">{t('Present')}</Badge>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">{studentPresentCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{t('Late')}</p>
                  <Badge variant="warning" className="text-[10px]">{t('Late')}</Badge>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">{studentLateCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{t('Excused')}</p>
                  <Badge variant="secondary" className="text-[10px]">{t('Excused')}</Badge>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">{studentExcusedCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{t('Absent')}</p>
                  <Badge variant="destructive" className="text-[10px]">{t('Absent')}</Badge>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">{studentAbsentCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Student History & Records Table */}
          <Card>
            <CardHeader className="border-b border-border px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">{t('My Attendance History')}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('{count} attendance records', { count: studentFilteredRecords.length })}
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} leadingIcon={<FilterX className="size-3.5" />}>
                    {t('Clear filters')}
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              {/* Filter Bar */}
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 text-xs font-medium">
                  {t('Status')}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-input/40 px-3 text-xs"
                  >
                    <option value="All">{t('All statuses')}</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {t(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-xs font-medium">
                  {t('From date')}
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-input/40 px-3 text-xs"
                  />
                </label>

                <label className="space-y-1 text-xs font-medium">
                  {t('To date')}
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-input/40 px-3 text-xs"
                  />
                </label>
              </div>

              {/* Records Table */}
              {studentFilteredRecords.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-start text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="px-3 py-3 text-start font-medium">{t('Session / Cohort')}</th>
                        <th className="px-3 py-3 text-start font-medium">{t('Date & Time')}</th>
                        <th className="px-3 py-3 text-start font-medium">{t('Status')}</th>
                        <th className="px-3 py-3 text-start font-medium">{t('Notes')}</th>
                        <th className="px-3 py-3 text-end font-medium">{t('Recorded on')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentFilteredRecords.map((record, index) => {
                        const dateFormatted = record.sessionStartTime
                          ? new Date(record.sessionStartTime).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : new Date(record.markedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            });

                        const timeFormatted = record.sessionStartTime
                          ? new Date(record.sessionStartTime).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : null;

                        return (
                          <tr key={record.id || `${record.sessionId}-${index}`} className="border-b border-border/70 last:border-0 hover:bg-muted/20">
                            <td className="px-3 py-3.5 font-medium">
                              <div className="flex flex-col">
                                <span className="text-foreground">{record.courseGroupName || t('Cohort session')}</span>
                                {record.room && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    {t('Room')}: {record.room}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-xs text-muted-foreground">
                              <div className="flex flex-col">
                                <span>{dateFormatted}</span>
                                {timeFormatted && (
                                  <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {timeFormatted}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <Badge variant={statusTone[record.status]}>{t(record.status)}</Badge>
                            </td>
                            <td className="px-3 py-3.5 text-xs text-muted-foreground">
                              {record.notes ? (
                                <span className="italic text-foreground/80">{record.notes}</span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-3 py-3.5 text-end text-xs text-muted-foreground">
                              {new Date(record.markedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <CalendarCheck2 className="mx-auto size-9 text-muted-foreground/80" />
                  <p className="mt-3 text-sm font-medium">
                    {t(hasActiveFilters ? 'No attendance records match these filters.' : 'No attendance records yet')}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(
                      hasActiveFilters
                        ? 'Try clearing or adjusting your date and status filters.'
                        : 'Attendance will appear after you attend scheduled cohort sessions.'
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ========================================================================= */
        /*                           STAFF ATTENDANCE VIEW                           */
        /* ========================================================================= */
        <>
          {/* Summary Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t('Attendance rate')}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {staffSummaryRows.length ? `${staffAttendanceRate}%` : '—'}
                  </p>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Percent className="size-4" />
                </span>
              </CardContent>
            </Card>
            {statuses.map((status) => (
              <Card key={status}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{t(status)}</p>
                    <Badge variant={statusTone[status]} className="text-[10px]">
                      {t(status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-foreground">{staffSummaryCount(status)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Interactive Attendance Marking for Staff */}
          {canMark && (
            <Card className="border-border">
              <CardHeader className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm">{t('Session attendance')}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('{count} of {total} statuses recorded', { count: recorded, total: roster.length })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor="attendance-session">
                    {t('Choose session')}
                  </label>
                  <select
                    id="attendance-session"
                    value={selectedId}
                    onChange={(event) => setSelectedId(event.target.value)}
                    className="h-9 max-w-full rounded-lg border border-border bg-input/40 px-3 text-xs"
                  >
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.title} · {session.date} ({session.startTime})
                      </option>
                    ))}
                  </select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllPresent}
                    disabled={!roster.length}
                    leadingIcon={<CheckCheck className="size-3.5" />}
                  >
                    {t('Mark all present')}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => void save()}
                    loading={saving}
                    loadingLabel={t('Saving...')}
                    disabled={!dirty || !roster.length}
                    leadingIcon={saveNotice ? <Check className="size-3.5" /> : <Save className="size-3.5" />}
                  >
                    {t('Save attendance')}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-5">
                {dirty && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                    {t('You have unsaved attendance changes. Click "Save attendance" to persist them.')}
                  </div>
                )}

                {saveError && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-medium text-destructive" role="alert">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{saveError}</span>
                  </div>
                )}

                {saveNotice && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300" role="status">
                    <Check className="size-4 shrink-0" />
                    <span>{t('Attendance saved successfully.')}</span>
                  </div>
                )}

                {!roster.length ? (
                  <div className="py-10 text-center">
                    <Users className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">
                      {t('No active learners are linked to this cohort.')}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('Link learners to the cohort course to build its attendance roster.')}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-start text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted-foreground">
                          <th className="px-3 py-3 text-start font-medium">{t('Learner')}</th>
                          <th className="px-3 py-3 text-start font-medium">{t('Email')}</th>
                          <th className="px-3 py-3 text-start font-medium">{t('Attendance status')}</th>
                          <th className="px-3 py-3 text-end font-medium">{t('Notes')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roster.map((student) => {
                          const currentStatus = draft[student.id] || '';
                          const currentNote = notesDraft[student.id] || '';
                          const isEditingNote = editingNotesStudentId === student.id;

                          return (
                            <tr key={student.id} className="border-b border-border/70 last:border-0 hover:bg-muted/10">
                              <td className="px-3 py-3.5 font-medium">
                                <div className="flex flex-col">
                                  <span>{student.name}</span>
                                  {student.studentCode && (
                                    <span className="text-[11px] text-muted-foreground font-mono">
                                      {student.studentCode}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3.5 text-xs text-muted-foreground">{student.email}</td>
                              <td className="px-3 py-3.5">
                                {/* Segmented Status Toggle Group */}
                                <div className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-muted/40 p-1" role="group">
                                  {statuses.map((status) => {
                                    const isSelected = currentStatus === status;
                                    return (
                                      <button
                                        key={status}
                                        type="button"
                                        onClick={() => mark(student.id, status)}
                                        className={cn(
                                          'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                                          isSelected
                                            ? status === 'Present'
                                              ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                                              : status === 'Absent'
                                              ? 'bg-rose-600 text-white shadow-sm dark:bg-rose-500'
                                              : status === 'Late'
                                              ? 'bg-amber-600 text-white shadow-sm dark:bg-amber-500'
                                              : 'bg-slate-700 text-white shadow-sm dark:bg-slate-300 dark:text-slate-900'
                                            : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
                                        )}
                                      >
                                        {t(status)}
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="px-3 py-3.5 text-end">
                                {isEditingNote ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <Input
                                      placeholder={t('Optional notes (e.g. excused)')}
                                      value={currentNote}
                                      maxLength={250}
                                      onChange={(e) =>
                                        setNotesDraft((prev) => ({ ...prev, [student.id]: e.target.value }))
                                      }
                                      className="h-8 w-48 text-xs"
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingNotesStudentId(null)}
                                    >
                                      {t('Done')}
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                    {currentNote && (
                                      <span className="max-w-40 truncate text-xs text-muted-foreground" title={currentNote}>
                                        {currentNote}
                                      </span>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingNotesStudentId(student.id)}
                                      title={t('Edit notes')}
                                      leadingIcon={<FileText className="size-3.5" />}
                                    >
                                      <span className="sr-only">{t('Edit notes')}</span>
                                    </Button>
                                  </div>
                                )}
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
          )}

          {/* Attendance History / Records Table with Filters */}
          <Card>
            <CardHeader className="border-b border-border px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm">{t('Attendance records')}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('{count} attendance records', { count: staffSummaryRows.length })}
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} leadingIcon={<FilterX className="size-3.5" />}>
                    {t('Clear filters')}
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <label className="space-y-1 text-xs font-medium">
                  {t('Cohort')}
                  <select
                    value={filterGroup}
                    onChange={(event) => setFilterGroup(event.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-input/40 px-3 text-xs"
                  >
                    <option value="All">{t('All cohorts')}</option>
                    {groups
                      .filter((item) => sessions.some((session) => session.groupId === item.id))
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="space-y-1 text-xs font-medium">
                  {t('Session')}
                  <select
                    value={filterSession}
                    onChange={(event) => setFilterSession(event.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-input/40 px-3 text-xs"
                  >
                    <option value="All">{t('All sessions')}</option>
                    {sessions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-xs font-medium">
                  {t('Status')}
                  <select
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-input/40 px-3 text-xs"
                  >
                    <option value="All">{t('All statuses')}</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {t(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-xs font-medium">
                  {t('From date')}
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-input/40 px-3 text-xs"
                  />
                </label>

                <label className="space-y-1 text-xs font-medium">
                  {t('To date')}
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-input/40 px-3 text-xs"
                  />
                </label>
              </div>

              {staffSummaryRows.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-start text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="px-3 py-3 text-start font-medium">{t('Learner')}</th>
                        <th className="px-3 py-3 text-start font-medium">{t('Session')}</th>
                        <th className="px-3 py-3 text-start font-medium">{t('Cohort')}</th>
                        <th className="px-3 py-3 text-start font-medium">{t('Date')}</th>
                        <th className="px-3 py-3 text-start font-medium">{t('Status')}</th>
                        <th className="px-3 py-3 text-end font-medium">{t('Notes')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffSummaryRows.map((row, index) => (
                        <tr
                          key={`${row.session.id}-${row.studentName}-${index}`}
                          className="border-b border-border/70 last:border-0 hover:bg-muted/10"
                        >
                          <td className="px-3 py-3 font-medium">
                            <span>{row.studentName}</span>
                            {row.studentCode && (
                              <span className="ms-2 font-mono text-xs text-muted-foreground">
                                ({row.studentCode})
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-foreground">{row.session.title}</td>
                          <td className="px-3 py-3 text-muted-foreground">{row.groupName}</td>
                          <td className="px-3 py-3 text-muted-foreground text-xs">{row.session.date}</td>
                          <td className="px-3 py-3">
                            <Badge variant={statusTone[row.status]}>{t(row.status)}</Badge>
                          </td>
                          <td className="px-3 py-3 text-end text-xs text-muted-foreground">
                            {row.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t('No attendance records match these filters.')}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
