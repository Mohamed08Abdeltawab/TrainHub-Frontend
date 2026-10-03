import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addDays, format, startOfWeek } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { getErrorPresentation } from '@/utils/errorPresentation';
import { groupsApi, type CourseGroup } from '@/features/courses/api/groupsApi';
import { instructorsApi } from '@/features/instructors/api/instructorsApi';
import { sessionsApi, type TrainingSession } from '../api/sessionsApi';

export default function ScheduleView({ instructorOnly = false }: { instructorOnly?: boolean }) {
  const { orgId: routeOrgId } = useParams(); const { user } = useAuth(); const { t, language } = useLanguage();
  const orgId = routeOrgId ?? user?.organizationId ?? 'demo'; const demo = Boolean(user?.demo);
  const [sessions, setSessions] = useState<TrainingSession[]>([]); const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [instructorGroupIds, setInstructorGroupIds] = useState<string[] | null>(null); const [week, setWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [nextSessions, nextGroups] = await Promise.all([sessionsApi.list(orgId, demo), groupsApi.list(orgId, demo)]);
      setSessions(nextSessions); setGroups(nextGroups);
      if (instructorOnly && user?.email) {
        const instructors = await instructorsApi.list(orgId, demo); const self = instructors.find((item) => item.email.toLowerCase() === user.email.toLowerCase());
        setInstructorGroupIds(self ? nextGroups.filter((group) => group.instructorIds?.includes(self.id)).map((group) => group.id) : []);
      }
    } catch (reason) { setError(t(getErrorPresentation(reason).description)); }
    finally { setLoading(false); }
  }, [orgId, demo, instructorOnly, user?.email, t]);
  useEffect(() => { void load(); }, [load]);
  const groupById = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(week, index)), [week]);
  const visibleSessions = sessions.filter((session) => (!instructorOnly || instructorGroupIds?.includes(session.groupId)) && session.status !== 'Cancelled');
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const weekLabel = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).formatRange(week, addDays(week, 6));
  return <section className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-muted-foreground">{t(instructorOnly ? 'Teaching' : 'Training')}</p><h1 className="mt-1 text-2xl font-semibold">{t(instructorOnly ? 'Instructor schedule' : 'Schedule')}</h1><p className="mt-1 text-sm text-muted-foreground">{t(instructorOnly ? 'Review sessions for cohorts assigned to you.' : 'Browse sessions by week across your training center.')}</p></div><div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label={t('Previous week')} onClick={() => setWeek((current) => addDays(current, -7))}>{language === 'ar' ? <ChevronRight className="size-4"/> : <ChevronLeft className="size-4"/>}</Button><span className="min-w-36 text-center text-sm font-medium" lang={locale}>{weekLabel}</span><Button variant="outline" size="icon" aria-label={t('Next week')} onClick={() => setWeek((current) => addDays(current, 7))}>{language === 'ar' ? <ChevronLeft className="size-4"/> : <ChevronRight className="size-4"/>}</Button><Button variant="ghost" onClick={() => setWeek(startOfWeek(new Date(), { weekStartsOn: 0 }))}>{t('Today')}</Button></div></header>
    {loading ? <p role="status" className="py-12 text-center text-sm text-muted-foreground">{t('Loading schedule...')}</p> : error ? <div className="py-8 text-center"><p role="alert" className="mb-3 text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => void load()}>{t('Try again')}</Button></div> : instructorOnly && !instructorGroupIds?.length ? <Card><CardContent className="py-12 text-center"><CalendarDays className="mx-auto size-9 text-muted-foreground"/><h2 className="mt-3 font-medium">{t('No assigned cohorts')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('Your schedule will show sessions after cohorts are assigned to your instructor profile.')}</p></CardContent></Card> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{days.map((day) => { const dayKey = format(day, 'yyyy-MM-dd'); const items = visibleSessions.filter((session) => session.date === dayKey).sort((a, b) => a.startTime.localeCompare(b.startTime)); return <Card key={dayKey} className="min-h-48"><CardHeader className="border-b border-border px-4 py-3"><CardTitle className="text-sm">{new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric' }).format(day)}</CardTitle></CardHeader><CardContent className="space-y-2 p-3">{items.length ? items.map((session) => <article key={session.id} className="rounded-lg border border-border p-3"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-medium">{session.title}</h3><Badge variant={session.status === 'Completed' ? 'success' : 'warning'}>{t(session.status)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{groupById.get(session.groupId)?.name ?? t('Cohort unavailable')}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3.5"/>{session.startTime} – {session.endTime}</p>{session.location && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3.5"/>{session.location}</p>}{session.meetingUrl && <a href={session.meetingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary underline-offset-4 hover:underline">{t('Join online')}</a>}</article>) : <p className="py-6 text-center text-xs text-muted-foreground">{t('No sessions scheduled')}</p>}</CardContent></Card>; })}</div>}
  </section>;
}
