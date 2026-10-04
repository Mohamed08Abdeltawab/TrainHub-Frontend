import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Check, Save, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { getErrorPresentation } from '@/utils/errorPresentation';
import { groupsApi, type CourseGroup } from '@/features/courses/api/groupsApi';
import { enrollmentsApi } from '@/features/courses/api/enrollmentsApi';
import { studentsApi, type Student } from '@/features/students/api/studentsApi';
import { instructorsApi } from '@/features/instructors/api/instructorsApi';
import { sessionsApi, type TrainingSession } from '../api/sessionsApi';
import { attendanceApi, type AttendanceEntry, type AttendanceStatus } from '../api/attendanceApi';

const statuses: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused'];
const statusTone: Record<AttendanceStatus, 'success' | 'destructive' | 'warning' | 'secondary'> = { Present: 'success', Absent: 'destructive', Late: 'warning', Excused: 'secondary' };

export default function AttendancePage() {
  const { orgId: routeOrgId } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const orgId = routeOrgId ?? user?.organizationId ?? 'demo';
  const demo = Boolean(user?.demo);
  const canMark = user?.role === 'ORG_ADMIN' || user?.role === 'INSTRUCTOR' || user?.role === 'SUPER_ADMIN';
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [attendanceBySession, setAttendanceBySession] = useState<Record<string, AttendanceEntry[]>>({});
  const [draft, setDraft] = useState<Record<string, AttendanceStatus | ''>>({});
  const [filterGroup, setFilterGroup] = useState('All');
  const [filterSession, setFilterSession] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveNotice, setSaveNotice] = useState(false);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const [allSessions, nextGroups, nextStudents] = await Promise.all([sessionsApi.list(orgId, demo), groupsApi.list(orgId, demo), studentsApi.list(orgId, demo)]);
      setGroups(nextGroups); setStudents(nextStudents);
      const resolvedInstructorId = user?.role === 'INSTRUCTOR' && user.email ? (await instructorsApi.list(orgId, demo)).find((item) => item.email.toLowerCase() === user.email?.toLowerCase())?.id ?? null : null;
      const allowedGroups = user?.role === 'INSTRUCTOR' ? nextGroups.filter((group) => resolvedInstructorId && group.instructorIds?.includes(resolvedInstructorId)) : nextGroups;
      // Course membership is checked below for learners; instructors only see sessions for assigned cohorts.
      let visible = user?.role === 'INSTRUCTOR' ? allSessions.filter((session) => allowedGroups.some((group) => group.id === session.groupId)) : allSessions;
      if (user?.role === 'STUDENT') {
        const learner = nextStudents.find((student) => student.email.toLowerCase() === user.email.toLowerCase());
        const enrollments = await Promise.all(nextGroups.map((group) => enrollmentsApi.list(orgId, group.courseId, demo)));
        const groupIds = new Set(nextGroups.filter((group, index) => enrollments[index].some((item) => item.studentId === learner?.id && item.status === 'Active')).map((group) => group.id));
        visible = learner ? allSessions.filter((session) => groupIds.has(session.groupId)) : [];
      }
      setSessions(visible); setSelectedId((current) => visible.some((session) => session.id === current) ? current : visible[0]?.id ?? '');
    } catch (error) { setLoadError(t(getErrorPresentation(error).description)); }
    finally { setLoading(false); }
  }, [orgId, demo, user?.role, user?.email, t]);

  useEffect(() => { void load(); }, [load]);

  const selected = sessions.find((session) => session.id === selectedId);
  const group = groups.find((item) => item.id === selected?.groupId);
  useEffect(() => {
    let cancelled = false;
    if (!group) { setEnrolledIds([]); return; }
    void enrollmentsApi.list(orgId, group.courseId, demo).then((items) => {
      if (!cancelled) setEnrolledIds(items.filter((item) => item.status === 'Active').map((item) => item.studentId));
    }).catch((error) => { if (!cancelled) setLoadError(t(getErrorPresentation(error).description)); });
    return () => { cancelled = true; };
  }, [group?.courseId, orgId, demo, t]);
  const roster = useMemo(() => {
    if (!group) return [];
    if (user?.role === 'STUDENT') return students.filter((student) => student.email.toLowerCase() === user.email.toLowerCase() && enrolledIds.includes(student.id));
    return students.filter((student) => student.status === 'Active' && enrolledIds.includes(student.id));
  }, [group, students, enrolledIds, user?.role, user?.email]);

  const refreshAttendance = useCallback(async () => {
    if (!selectedId) { setEntries([]); setDraft({}); return; }
    try {
      const current = await attendanceApi.list(orgId, selectedId, demo);
      setEntries(current);
      setDraft(Object.fromEntries(current.map((entry) => [entry.studentId, entry.status])));
      setSaveNotice(false);
    } catch (error) { setLoadError(t(getErrorPresentation(error).description)); }
  }, [selectedId, orgId, demo, t]);
  useEffect(() => { void refreshAttendance(); }, [refreshAttendance]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(sessions.map(async (session) => [session.id, await attendanceApi.list(orgId, session.id, demo)] as const))
      .then((rows) => { if (!cancelled) setAttendanceBySession(Object.fromEntries(rows)); })
      .catch((error) => { if (!cancelled) setLoadError(t(getErrorPresentation(error).description)); });
    return () => { cancelled = true; };
  }, [sessions, orgId, demo, t]);

  const recorded = entries.length;
  const dirty = canMark && roster.some((student) => (draft[student.id] ?? '') !== (entries.find((entry) => entry.studentId === student.id)?.status ?? ''));
  const mark = (studentId: string, status: AttendanceStatus) => {
    setDraft((current) => ({ ...current, [studentId]: status })); setSaveError(''); setSaveNotice(false);
  };
  const save = async () => {
    if (!selected || !canMark) return;
    const missing = roster.filter((student) => !draft[student.id]);
    if (missing.length) { setSaveError(t('Mark an attendance status for every learner before saving.')); return; }
    setSaving(true); setSaveError(''); setSaveNotice(false);
    try {
      const now = new Date().toISOString();
      const next = roster.map((student) => ({ studentId: student.id, status: draft[student.id] as AttendanceStatus, markedAt: entries.find((entry) => entry.studentId === student.id)?.markedAt ?? now, markedBy: user?.email }));
      const saved = await attendanceApi.save(orgId, selected.id, next, demo);
      setEntries(saved); setAttendanceBySession((current) => ({ ...current, [selected.id]: saved })); setDraft(Object.fromEntries(saved.map((entry) => [entry.studentId, entry.status]))); setSaveNotice(true);
    } catch (error) {
      const presentation = getErrorPresentation(error);
      setSaveError(t(presentation.title === 'Access denied' ? 'You do not have permission to mark attendance.' : presentation.description));
    } finally { setSaving(false); }
  };

  const count = (status: AttendanceStatus) => roster.filter((student) => (draft[student.id] ?? entries.find((entry) => entry.studentId === student.id)?.status) === status).length;
  const summaryRows = sessions.flatMap((session) => {
    if (filterGroup !== 'All' && session.groupId !== filterGroup) return [];
    if (filterSession !== 'All' && session.id !== filterSession) return [];
    if ((dateFrom && session.date < dateFrom) || (dateTo && session.date > dateTo)) return [];
    const groupName = groups.find((item) => item.id === session.groupId)?.name ?? t('Cohort unavailable');
    return (attendanceBySession[session.id] ?? []).flatMap((entry) => {
      if (user?.role === 'STUDENT' && !students.some((student) => student.id === entry.studentId && student.email.toLowerCase() === user.email.toLowerCase())) return [];
      if (filterStatus !== 'All' && entry.status !== filterStatus) return [];
      return [{ session, groupName, studentName: students.find((item) => item.id === entry.studentId)?.name ?? t('Learner'), status: entry.status }];
    });
  }).sort((a, b) => `${b.session.date} ${b.session.startTime}`.localeCompare(`${a.session.date} ${a.session.startTime}`));
  const summaryCount = (status: AttendanceStatus) => summaryRows.filter((row) => row.status === status).length;
  return <section className="space-y-6">
    <header><p className="text-sm text-muted-foreground">{t('Training')}</p><h1 className="mt-1 text-2xl font-semibold">{t('Attendance')}</h1><p className="mt-1 text-sm text-muted-foreground">{t(user?.role === 'STUDENT' ? 'View your attendance and track your session history.' : 'Review session attendance and record each learner’s status.')}</p></header>
    {loading ? <Card><CardContent className="py-12 text-center text-sm text-muted-foreground" role="status">{t('Loading attendance...')}</CardContent></Card> : loadError ? <Card><CardContent className="py-10 text-center"><p role="alert" className="mb-3 text-sm text-destructive">{loadError}</p><Button variant="outline" onClick={() => void load()}>{t('Try again')}</Button></CardContent></Card> : !sessions.length ? <Card><CardContent className="py-12 text-center"><CalendarCheck2 className="mx-auto size-9 text-muted-foreground"/><h2 className="mt-3 font-medium">{t(user?.role === 'STUDENT' ? 'No attendance records yet' : 'No sessions available')}</h2><p className="mt-1 text-sm text-muted-foreground">{t(user?.role === 'STUDENT' ? 'Attendance will appear after you are enrolled in a cohort with scheduled sessions.' : 'Create a session and add active learners to its cohort to take attendance.')}</p></CardContent></Card> : <>
      <Card><CardHeader className="border-b border-border px-5 py-4"><CardTitle className="text-sm">{t(user?.role === 'STUDENT' ? 'My attendance summary' : 'Attendance summary')}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{t('{count} attendance records', { count: summaryRows.length })}</p></CardHeader><CardContent className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-4">{statuses.map((status) => <div key={status} className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">{t(status)}</p><p className="mt-1 text-lg font-semibold">{summaryCount(status)}</p></div>)}</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-1 text-xs font-medium">{t('Cohort')}<select value={filterGroup} onChange={(event) => setFilterGroup(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm"><option value="All">{t('All cohorts')}</option>{groups.filter((item) => sessions.some((session) => session.groupId === item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="space-y-1 text-xs font-medium">{t('Session')}<select value={filterSession} onChange={(event) => setFilterSession(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm"><option value="All">{t('All sessions')}</option>{sessions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <label className="space-y-1 text-xs font-medium">{t('Status')}<select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm"><option value="All">{t('All statuses')}</option>{statuses.map((status) => <option key={status}>{t(status)}</option>)}</select></label>
          <label className="space-y-1 text-xs font-medium">{t('From date')}<input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm"/></label>
          <label className="space-y-1 text-xs font-medium">{t('To date')}<input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm"/></label>
        </div>
        {summaryRows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-start text-sm"><thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="px-3 py-3 text-start font-medium">{t('Learner')}</th><th className="px-3 py-3 text-start font-medium">{t('Session')}</th><th className="px-3 py-3 text-start font-medium">{t('Cohort')}</th><th className="px-3 py-3 text-start font-medium">{t('Date')}</th><th className="px-3 py-3 text-start font-medium">{t('Status')}</th></tr></thead><tbody>{summaryRows.map((row, index) => <tr key={`${row.session.id}-${row.studentName}-${index}`} className="border-b border-border/70 last:border-0"><td className="px-3 py-3 font-medium">{row.studentName}</td><td className="px-3 py-3">{row.session.title}</td><td className="px-3 py-3 text-muted-foreground">{row.groupName}</td><td className="px-3 py-3 text-muted-foreground">{row.session.date}</td><td className="px-3 py-3"><Badge variant={statusTone[row.status]}>{t(row.status)}</Badge></td></tr>)}</tbody></table></div> : <p className="py-8 text-center text-sm text-muted-foreground">{t('No attendance records match these filters.')}</p>}
      </CardContent></Card>
      {canMark && <div className="grid gap-3 sm:grid-cols-4">{[{ label: 'Learners', value: roster.length }, ...statuses.map((status) => ({ label: status, value: count(status) }))].map((item) => <Card key={item.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{t(item.label)}</p><p className="mt-1 text-xl font-semibold">{item.value}</p></CardContent></Card>)}</div>}
      <Card><CardHeader className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-sm">{t('Session attendance')}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{t('{count} of {total} statuses recorded', { count: recorded, total: roster.length })}</p></div><div className="flex flex-wrap gap-2"><label className="sr-only" htmlFor="attendance-session">{t('Choose session')}</label><select id="attendance-session" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="h-10 max-w-full rounded-lg border border-border bg-input/40 px-3 text-sm">{sessions.map((session) => <option key={session.id} value={session.id}>{session.title} · {session.date}</option>)}</select>{canMark && <Button onClick={() => void save()} loading={saving} loadingLabel={t('Saving...')} disabled={!dirty || !roster.length} leadingIcon={saveNotice ? <Check className="size-4"/> : <Save className="size-4"/>}>{t('Save attendance')}</Button>}</div></CardHeader>
        <CardContent className="p-5">{saveError && <p role="alert" className="mb-4 text-sm text-destructive">{saveError}</p>}{saveNotice && <p role="status" className="mb-4 text-sm text-success">{t('Attendance saved successfully.')}</p>}{!roster.length ? <div className="py-10 text-center"><Users className="mx-auto size-8 text-muted-foreground"/><p className="mt-3 text-sm font-medium">{t(user?.role === 'STUDENT' ? 'Your attendance has not been marked yet.' : 'No active learners are linked to this cohort.')}</p><p className="mt-1 text-xs text-muted-foreground">{t('Link learners to the cohort course to build its attendance roster.')}</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-start text-sm"><thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="px-3 py-3 text-start font-medium">{t('Learner')}</th><th className="px-3 py-3 text-start font-medium">{t('Email')}</th><th className="px-3 py-3 text-start font-medium">{t('Attendance status')}</th></tr></thead><tbody>{roster.map((student) => { const status = draft[student.id] || ''; const entry = entries.find((item) => item.studentId === student.id); return <tr key={student.id} className="border-b border-border/70 last:border-0"><td className="px-3 py-4 font-medium">{student.name}</td><td className="px-3 py-4 text-muted-foreground">{student.email}</td><td className="px-3 py-4">{canMark ? <select aria-label={t('Attendance status for {name}', { name: student.name })} value={status} onChange={(event) => event.target.value && mark(student.id, event.target.value as AttendanceStatus)} className="h-9 min-w-36 rounded-lg border border-border bg-input/40 px-2 text-sm"><option value="">{t('Select status')}</option>{statuses.map((item) => <option key={item} value={item}>{t(item)}</option>)}</select> : status ? <Badge variant={statusTone[status as AttendanceStatus]}>{t(status)}</Badge> : <span className="text-muted-foreground">{t('Not recorded')}</span>}{entry && !canMark && <span className="ms-2 text-xs text-muted-foreground">{new Date(entry.markedAt).toLocaleDateString()}</span>}</td></tr>; })}</tbody></table></div>}</CardContent>
      </Card>
    </>}
  </section>;
}
