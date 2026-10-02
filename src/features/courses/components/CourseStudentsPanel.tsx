import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserPlus, Users, X } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge, Button, Card, CardContent, Input, Modal } from '@/components/ui';
import { studentsApi, type Student } from '@/features/students/api/studentsApi';
import { getErrorPresentation } from '@/utils/errorPresentation';
import { enrollmentsApi, type Enrollment, type EnrollmentStatus } from '../api/enrollmentsApi';
import type { Course } from '../api/coursesApi';

export default function CourseStudentsPanel({ course, orgId, onClose }: { course: Course; orgId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const demo = Boolean(user?.demo);
  const canManage = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN';
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'load' | 'action'>('load');
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [allStudents, ids] = await Promise.all([
        studentsApi.list(orgId, demo), enrollmentsApi.list(orgId, course.id, demo),
      ]);
      setStudents(allStudents); setEnrollments(ids);
    } catch (cause) { setErrorType('load'); setError(t(getErrorPresentation(cause).description)); }
    finally { setLoading(false); }
  }, [orgId, demo, course.id, t]);
  useEffect(() => { void load(); }, [load]);

  const enrollmentByStudent = useMemo(() => new Map(enrollments.map((item) => [item.studentId, item])), [enrollments]);
  const enrolled = useMemo(() => students.filter((student) => enrollmentByStudent.has(student.id)), [students, enrollmentByStudent]);
  const available = useMemo(() => students.filter((student) => !enrollmentByStudent.has(student.id) && student.status === 'Active' && `${student.name} ${student.email}`.toLowerCase().includes(query.trim().toLowerCase())), [students, enrollmentByStudent, query]);
  const updateStatus = async (student: Student, status: EnrollmentStatus) => {
    setSavingId(student.id); setError('');
    try {
      await enrollmentsApi.updateStatus(orgId, course.id, student.id, status, demo);
      setEnrollments((current) => current.map((item) => item.studentId === student.id ? { ...item, status } : item));
    } catch (cause) {
      const presentation = getErrorPresentation(cause);
      setErrorType('action');
      setError(t(presentation.title === 'Access denied' ? 'You do not have permission to change course enrollment.' : presentation.description));
    } finally { setSavingId(''); }
  };

  const toggle = async (student: Student, add: boolean) => {
    setSavingId(student.id); setError('');
    try {
      if (add) await enrollmentsApi.enroll(orgId, course.id, student.id, demo);
      else await enrollmentsApi.remove(orgId, course.id, student.id, demo);
      setEnrollments((current) => add
        ? [...current.filter((item) => item.studentId !== student.id), { studentId: student.id, status: 'Active', enrolledAt: new Date().toISOString() }]
        : current.filter((item) => item.studentId !== student.id));
    } catch (cause) {
      const presentation = getErrorPresentation(cause);
      setErrorType('action');
      setError(t(presentation.title === 'Access denied' ? 'You do not have permission to change course enrollment.' : presentation.description));
    } finally { setSavingId(''); }
  };

  return <Modal open onClose={onClose} title={t('Course students')} description={course.title} size="lg" footer={<Button variant="outline" onClick={onClose}>{t('Close')}</Button>}>
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">{[
        { label: 'Total enrollments', value: enrollments.length },
        { label: 'Active enrollments', value: enrollments.filter((item) => item.status === 'Active').length },
        { label: 'Completed enrollments', value: enrollments.filter((item) => item.status === 'Completed').length },
      ].map((item) => <Card key={item.label}><CardContent className="p-3"><p className="text-xs text-muted-foreground">{t(item.label)}</p><p className="mt-1 text-xl font-semibold">{item.value}</p></CardContent></Card>)}</div>
      {course.status !== 'Active' && <Badge variant={course.status === 'Draft' ? 'warning' : 'secondary'}>{t(course.status)}</Badge>}
      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><p role="alert">{error}</p><Button variant="outline" size="sm" className="mt-2" onClick={() => errorType === 'load' ? void load() : setError('')}>{t(errorType === 'load' ? 'Try again' : 'Dismiss')}</Button></div>}
      {loading ? <p role="status" className="py-8 text-center text-sm text-muted-foreground">{t('Loading course students...')}</p> : error && errorType === 'load' ? <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">{t('Enrollment data could not be loaded.')}</p> : <>
        <section><h3 className="text-sm font-semibold">{t('Enrolled students')}</h3>{enrolled.length ? <ul className="mt-2 divide-y divide-border rounded-lg border border-border">{enrolled.map((student) => { const enrollment = enrollmentByStudent.get(student.id)!; return <li key={student.id} className="flex flex-wrap items-center gap-3 p-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">{student.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{student.name}</p><p className="truncate text-xs text-muted-foreground">{student.email}</p></div><Badge variant={enrollment.status === 'Active' ? 'success' : enrollment.status === 'Completed' ? 'default' : 'secondary'}>{t(enrollment.status)}</Badge>{canManage && <><select aria-label={t('Enrollment status for {name}', { name: student.name })} value={enrollment.status} disabled={savingId === student.id} onChange={(event) => void updateStatus(student, event.target.value as EnrollmentStatus)} className="h-9 rounded-lg border border-border bg-input/40 px-2 text-xs"><option value="Active">{t('Active')}</option><option value="Completed">{t('Completed')}</option><option value="Withdrawn">{t('Withdrawn')}</option></select><Button variant="ghost" size="sm" disabled={savingId === student.id} aria-label={t('Remove {name} from course', { name: student.name })} onClick={() => void toggle(student, false)} leadingIcon={<X className="size-4"/>}>{t('Remove')}</Button></>}</li>; })}</ul> : <div className="mt-2 rounded-lg border border-dashed border-border p-5 text-center"><Users className="mx-auto size-8 text-muted-foreground"/><p className="mt-2 text-sm font-medium">{t('No students are enrolled in this course yet.')}</p><p className="mt-1 text-xs text-muted-foreground">{canManage && course.status === 'Active' ? t('Enroll an active student to build your course roster.') : t('Enrolled students will appear here.')}</p></div>}</section>
        {canManage && course.status === 'Active' && <section className="space-y-3 border-t border-border pt-4"><div><h3 className="text-sm font-semibold">{t('Enroll a student')}</h3><p className="mt-1 text-xs text-muted-foreground">{t('Only active students can be enrolled.')}</p></div><Input aria-label={t('Search available students')} placeholder={t('Search by name or email')} value={query} onChange={(event) => setQuery(event.target.value)}/>{available.length ? <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-lg border border-border">{available.map((student) => <li key={student.id} className="flex items-center gap-3 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{student.name}</p><p className="truncate text-xs text-muted-foreground">{student.email}</p></div><Button size="sm" disabled={savingId === student.id} onClick={() => void toggle(student, true)} leadingIcon={<UserPlus className="size-4"/>}>{t('Enroll')}</Button></li>)}</ul> : <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{students.length === 0 ? t('Add students to your center before enrolling them.') : query ? t('No available students match your search.') : t('There are no active students available to enroll.')}</p>}</section>}
        {canManage && course.status !== 'Active' && <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">{t('Publish this course as active before enrolling students.')}</p>}
      </>}
    </div>
  </Modal>;
}
