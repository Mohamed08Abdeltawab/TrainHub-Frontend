import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpenCheck, ClipboardCheck, UsersRound, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import ErrorState from '@/components/errors/ErrorState';
import { useLanguage } from '@/i18n/LanguageContext';
import { coursesApi } from '@/features/courses/api/coursesApi';
import { instructorsApi } from '@/features/instructors/api/instructorsApi';
import { attendanceApi } from '@/features/sessions/api/attendanceApi';
import { sessionsApi } from '@/features/sessions/api/sessionsApi';

function renderStatisticsCard(title: string, Icon: LucideIcon, children: ReactNode) {
  return <Card className="border-border bg-card/70 shadow-sm"><CardHeader className="flex flex-row items-center gap-2 px-4 pb-1 pt-4"><Icon className="size-4 text-primary" /><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent className="space-y-3 px-4 pb-4">{children}</CardContent></Card>;
}

export default function OperationalStatistics() {
  const { orgId = 'demo' } = useParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const demo = Boolean(user?.demo);
  const queryKey = ['operational-statistics', orgId, demo];

  const coursesQuery = useQuery({ queryKey: [...queryKey, 'courses'], queryFn: () => coursesApi.list(orgId, demo) });
  const instructorsQuery = useQuery({ queryKey: [...queryKey, 'instructors'], queryFn: () => instructorsApi.list(orgId, demo) });
  const attendanceQuery = useQuery({
    queryKey: [...queryKey, 'attendance'],
    queryFn: async () => {
      const sessions = await sessionsApi.list(orgId, demo);
      const records = await Promise.all(sessions.map((session) => attendanceApi.list(orgId, session.id, demo)));
      return records.flat();
    },
  });

  const courseStats = useMemo(() => {
    const courses = coursesQuery.data ?? [];
    const categories = new Map<string, number>();
    courses.forEach((course) => {
      const category = course.category.trim() || t('Uncategorized');
      categories.set(category, (categories.get(category) ?? 0) + 1);
    });
    return { total: courses.length, active: courses.filter((course) => course.status === 'Active').length, draft: courses.filter((course) => course.status === 'Draft').length, archived: courses.filter((course) => course.status === 'Archived').length, categories: [...categories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4) };
  }, [coursesQuery.data, t]);
  const instructorStats = useMemo(() => {
    const instructors = instructorsQuery.data ?? [];
    const expertise = new Map<string, number>();
    instructors.forEach((instructor) => {
      const area = instructor.expertise.trim() || t('Not specified');
      expertise.set(area, (expertise.get(area) ?? 0) + 1);
    });
    return { total: instructors.length, active: instructors.filter((item) => item.status === 'Active').length, pending: instructors.filter((item) => item.status === 'Pending').length, inactive: instructors.filter((item) => item.status === 'Inactive').length, expertise: [...expertise.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4) };
  }, [instructorsQuery.data, t]);
  const attendanceStats = useMemo(() => {
    const records = attendanceQuery.data ?? [];
    const counts = { Present: 0, Late: 0, Absent: 0, Excused: 0 };
    records.forEach((record) => {
      if (record.status === 'Present' || record.status === 'Late' || record.status === 'Absent' || record.status === 'Excused') {
        counts[record.status] += 1;
      }
    });
    const marked = counts.Present + counts.Late + counts.Absent;
    return { ...counts, marked, rate: marked ? Math.round(((counts.Present + counts.Late) / marked) * 100) : 0 };
  }, [attendanceQuery.data]);

  const number = (value: number) => value.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
  const rows = (items: [string, number][]) => items.length ? <ul className="space-y-2">{items.map(([label, count]) => <li key={label} className="flex items-center justify-between gap-3 text-xs"><span className="truncate text-muted-foreground">{label}</span><span className="font-semibold text-foreground">{number(count)}</span></li>)}</ul> : <p className="text-xs text-muted-foreground">{t('No statistics available yet.')}</p>;
  const metric = (label: string, value: number) => <div className="rounded-lg bg-muted/40 px-3 py-2"><p className="text-[11px] text-muted-foreground">{t(label)}</p><p className="mt-1 text-lg font-semibold text-foreground">{number(value)}</p></div>;
  const loading = () => <div role="status" aria-label={t('Loading statistics...')} className="grid gap-2">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-8 rounded-md" />)}</div>;
  const queryError = (error: unknown, retry: () => void) => <ErrorState error={error} onRetry={() => void retry()} retryLabel={t('Try again')} />;

  return (
    <section aria-label={t('Training statistics')} className="grid gap-3 xl:grid-cols-3">
      {renderStatisticsCard(t('Course statistics'), BookOpenCheck, coursesQuery.isError ? queryError(coursesQuery.error, coursesQuery.refetch) : coursesQuery.isPending ? loading() : <>
        <div className="grid grid-cols-2 gap-2">{metric('Total courses', courseStats.total)}{metric('Active courses', courseStats.active)}</div>
        <p className="text-xs text-muted-foreground">{t('Draft courses')}: <span className="font-semibold text-foreground">{number(courseStats.draft)}</span><span className="px-2">·</span>{t('Archived courses')}: <span className="font-semibold text-foreground">{number(courseStats.archived)}</span></p>
        <div className="border-t border-border pt-2"><p className="mb-2 text-[11px] font-semibold text-foreground">{t('Courses by category')}</p>{rows(courseStats.categories)}</div>
      </>)}
      {renderStatisticsCard(t('Instructor statistics'), UsersRound, instructorsQuery.isError ? queryError(instructorsQuery.error, instructorsQuery.refetch) : instructorsQuery.isPending ? loading() : <>
        <div className="grid grid-cols-2 gap-2">{metric('Total instructors', instructorStats.total)}{metric('Active instructors', instructorStats.active)}</div>
        <p className="text-xs text-muted-foreground">{t('Pending')}: <span className="font-semibold text-foreground">{number(instructorStats.pending)}</span><span className="px-2">·</span>{t('Inactive instructors')}: <span className="font-semibold text-foreground">{number(instructorStats.inactive)}</span></p>
        <div className="border-t border-border pt-2"><p className="mb-2 text-[11px] font-semibold text-foreground">{t('Expertise areas')}</p>{rows(instructorStats.expertise)}</div>
      </>)}
      {renderStatisticsCard(t('Attendance statistics'), ClipboardCheck, attendanceQuery.isError ? queryError(attendanceQuery.error, attendanceQuery.refetch) : attendanceQuery.isPending ? loading() : <>
        <div className="rounded-lg bg-primary/10 px-3 py-3"><p className="text-xs text-muted-foreground">{t('Attendance rate')}</p><p className="mt-1 text-2xl font-bold text-foreground">{attendanceStats.marked ? `${number(attendanceStats.rate)}%` : '—'}</p></div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">{([[t('Present'), attendanceStats.Present], [t('Late'), attendanceStats.Late], [t('Absent'), attendanceStats.Absent], [t('Excused'), attendanceStats.Excused]] as [string, number][]).map(([label, count]) => <div key={label} className="flex justify-between gap-2"><span className="text-muted-foreground">{label}</span><span className="font-semibold text-foreground">{number(count)}</span></div>)}</div>
        {!attendanceStats.marked && <p className="text-[11px] text-muted-foreground">{t('Attendance statistics appear after attendance is recorded.')}</p>}
      </>)}
    </section>
  );
}
