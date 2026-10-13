import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BookOpenCheck, CalendarDays, ClipboardCheck, UsersRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { DashboardContent } from '@/types/nav';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/auth/AuthContext';
import { studentsApi, type Student } from '@/features/students/api/studentsApi';
import ErrorState from '@/components/errors/ErrorState';
import OperationalStatistics from './OperationalStatistics';

const metricIcons = [UsersRound, BookOpenCheck, ArrowUpRight, ClipboardCheck];

export default function OrganizationOverview({ content, onOpenPrimarySection }: { content: DashboardContent; onOpenPrimarySection: (targetLabel?: string) => void }) {
  const { t } = useLanguage();
  const { orgId = 'demo' } = useParams();
  const { user } = useAuth();
  const [organization, setOrganization] = useState({ name: content.tenant, email: '' });
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState<unknown>();

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    setStudentsError(undefined);
    try {
      setStudents(await studentsApi.list(orgId, Boolean(user?.demo)));
    } catch (error) {
      setStudentsError(error);
    } finally {
      setStudentsLoading(false);
    }
  }, [orgId, user?.demo]);

  useEffect(() => { void loadStudents(); }, [loadStudents]);

  const studentStats = useMemo(() => {
    const active = students.filter((student) => student.status === 'Active').length;
    const pending = students.filter((student) => student.status === 'Pending').length;
    const courses = new Map<string, number>();
    students.forEach((student) => {
      const course = student.course.trim() || t('Not assigned');
      courses.set(course, (courses.get(course) ?? 0) + 1);
    });
    return { active, pending, courses: [...courses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5) };
  }, [students, t]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`trainhub.organization.${orgId}.profile`);
      if (!raw) {
        setOrganization({ name: content.tenant, email: '' });
        return;
      }
      const profile: unknown = JSON.parse(raw);
      if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
        const stored = profile as { name?: unknown; email?: unknown };
        setOrganization({
          name: typeof stored.name === 'string' && stored.name.trim() ? stored.name : content.tenant,
          email: typeof stored.email === 'string' ? stored.email : '',
        });
      }
    } catch {
      setOrganization({ name: content.tenant, email: '' });
    }
  }, [content.tenant, orgId]);

  return (
    <div className="space-y-5">
      <Card className="border-border bg-card/70 px-5 py-4 shadow-sm">
        <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-start">
            <p className="text-xs font-medium text-muted-foreground">{t('Organization summary')}</p>
            <h2 className="mt-1 break-words text-lg font-bold text-foreground">{organization.name}</h2>
            <p className="mt-1 break-words text-xs text-muted-foreground">{organization.email || t('Add a contact email to your organization profile.')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
            <Badge variant="secondary">{t(content.plan)}</Badge>
            <Link to={`/admin/organizations/${orgId}/organization-profile`} className="text-start text-xs font-semibold text-primary hover:underline">{t('Edit organization profile')}</Link>
          </div>
        </div>
      </Card>
      <section aria-label={t('Organization performance')} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {content.metrics.map((originalMetric, index) => {
          const metric = index === 0 && !studentsError
            ? { ...originalMetric, value: studentsLoading ? '—' : students.length.toLocaleString(), note: studentsLoading ? 'Loading student statistics...' : `${studentStats.active} ${t('Active').toLowerCase()} · ${studentStats.pending} ${t('Pending').toLowerCase()}` }
            : originalMetric;
          const Icon = metricIcons[index] ?? ArrowUpRight;
          return <Card key={metric.label} className="border-border bg-card/70 p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-muted-foreground">{t(metric.label)}</p><p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{metric.value}</p></div><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span></div><p className="mt-2 text-[11px] text-muted-foreground">{studentsLoading && index === 0 ? <Skeleton className="h-3 w-36" /> : t(metric.note)}</p></Card>;
        })}
      </section>

      <Card className="border-border bg-card/70 shadow-sm">
        <CardHeader className="px-5 pb-2 pt-5">
          <CardTitle className="text-sm">{t('Student statistics')}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{t('Enrollment and status summary for your training center.')}</p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {studentsError ? (
            <ErrorState error={studentsError} onRetry={() => void loadStudents()} retryLabel={t('Try again')} />
          ) : studentsLoading ? (
            <div role="status" aria-label={t('Loading student statistics...')} className="grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((item) => <Skeleton key={item} className="h-16 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
              {[
                { label: 'Total students', value: students.length },
                { label: 'Active', value: studentStats.active },
                { label: 'Pending', value: studentStats.pending },
              ].map((stat) => <div key={stat.label} className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">{t(stat.label)}</p><p className="mt-1 text-xl font-semibold text-foreground">{stat.value.toLocaleString()}</p></div>)}
              <div className="sm:col-span-3">
                <h3 className="mb-2 text-xs font-semibold text-foreground">{t('Enrollment by course')}</h3>
                {studentStats.courses.length ? <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{studentStats.courses.map(([course, count]) => <li key={course} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-xs"><span className="truncate text-muted-foreground">{course}</span><span className="font-semibold text-foreground">{count.toLocaleString()}</span></li>)}</ul> : <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">{t('No student enrollment data yet.')}</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <OperationalStatistics />

      <div>
        <Card className="border-border bg-card/70 shadow-sm">
          <CardHeader className="px-5 pb-2 pt-5"><CardTitle className="text-sm">{t('Needs your attention')}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{t('Keep your academy operations moving.')}</p></CardHeader>
          <CardContent className="space-y-3 px-5 pb-5 pt-2">
            <button onClick={() => onOpenPrimarySection('Cohorts')} className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-start transition hover:bg-muted/50"><span className="grid size-9 place-items-center rounded-lg bg-amber-500/10 text-amber-500"><ClipboardCheck className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-foreground">{t('Active cohorts')}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{t('Monitor running batches')}</span></span><ArrowUpRight className="size-4 text-muted-foreground" /></button>
            <button onClick={() => onOpenPrimarySection('Sessions')} className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-start transition hover:bg-muted/50"><span className="grid size-9 place-items-center rounded-lg bg-sky-500/10 text-sky-500"><CalendarDays className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-foreground">{t('Upcoming sessions')}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{t('Scheduled classes')}</span></span><ArrowUpRight className="size-4 text-muted-foreground" /></button>
            <Button className="mt-1 w-full" variant="outline" onClick={() => onOpenPrimarySection('Courses')}>{t('View courses and cohorts')}</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/70 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between px-5 pb-2 pt-5"><div><CardTitle className="text-sm">{t(content.tableTitle)}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{t(content.subtitle)}</p></div><Button variant="ghost" size="sm" onClick={() => onOpenPrimarySection()}>{t('View all')} <ArrowUpRight className="size-3.5" /></Button></CardHeader>
        <CardContent className="space-y-1 px-5 pb-5">
          {content.rows.map((row) => <div key={row.title} className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{t(row.title)}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{t(row.detail)}</p></div><Badge variant={/upcoming|review/i.test(row.status) ? 'warning' : 'success'}>{t(row.status)}</Badge></div>)}
        </CardContent>
      </Card>
    </div>
  );
}
