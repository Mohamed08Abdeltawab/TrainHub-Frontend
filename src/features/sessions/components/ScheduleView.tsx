import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useDashboardContext } from '@/layouts/DashboardLayout';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Modal } from '@/components/ui';
import { getErrorPresentation } from '@/utils/errorPresentation';
import { groupsApi, type CourseGroup } from '@/features/courses/api/groupsApi';
import { instructorsApi } from '@/features/instructors/api/instructorsApi';
import { studentsApi } from '@/features/students/api/studentsApi';
import { enrollmentsApi } from '@/features/courses/api/enrollmentsApi';
import { sessionsApi, type TrainingSession } from '../api/sessionsApi';

export default function ScheduleView({
  instructorOnly = false,
  studentOnly = false,
}: {
  instructorOnly?: boolean;
  studentOnly?: boolean;
}) {
  const { orgId: routeOrgId } = useParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const dashboardContext = useDashboardContext();

  const orgId = routeOrgId ?? user?.organizationId ?? 'demo';
  const demo = Boolean(user?.demo);

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [allowedGroupIds, setAllowedGroupIds] = useState<string[] | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<string>('All');
  const [week, setWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextSessions, nextGroups] = await Promise.all([
        sessionsApi.list(orgId, demo),
        groupsApi.list(orgId, demo),
      ]);
      setSessions(nextSessions);
      setGroups(nextGroups);

      if (instructorOnly && user?.email) {
        if (demo) {
          const instructors = await instructorsApi.list(orgId, true);
          const self = instructors.find((item) => item.email.toLowerCase() === user.email?.toLowerCase());
          setAllowedGroupIds(self ? nextGroups.filter((group) => group.instructorIds?.includes(self.id)).map((group) => group.id) : []);
        } else {
          try {
            const me = await instructorsApi.getMe();
            setAllowedGroupIds(me ? nextGroups.filter((group) => group.instructorIds?.includes(me.id)).map((group) => group.id) : []);
          } catch {
            const instructors = await instructorsApi.list(orgId, false);
            const self = instructors.find((item) => item.email.toLowerCase() === user.email?.toLowerCase());
            setAllowedGroupIds(self ? nextGroups.filter((group) => group.instructorIds?.includes(self.id)).map((group) => group.id) : []);
          }
        }
      } else if (studentOnly && user?.email) {
        const students = await studentsApi.list(orgId, demo);
        const learner = students.find(
          (student) => student.email.toLowerCase() === user.email.toLowerCase()
        );
        if (learner) {
          const enrollments = await Promise.all(
            nextGroups.map((group) => enrollmentsApi.list(orgId, group.courseId, demo))
          );
          const enrolled = nextGroups
            .filter((_, idx) =>
              enrollments[idx]?.some(
                (item) => item.studentId === learner.id && item.status === 'Active'
              )
            )
            .map((g) => g.id);
          setAllowedGroupIds(enrolled);
        } else {
          setAllowedGroupIds([]);
        }
      } else {
        setAllowedGroupIds(null);
      }
    } catch (reason) {
      setError(t(getErrorPresentation(reason).description));
    } finally {
      setLoading(false);
    }
  }, [orgId, demo, instructorOnly, studentOnly, user?.email, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const groupById = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(week, index)), [week]);

  const availableCohorts = useMemo(() => {
    if (allowedGroupIds !== null) {
      return groups.filter((g) => allowedGroupIds.includes(g.id));
    }
    return groups;
  }, [groups, allowedGroupIds]);

  const visibleSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (session.status === 'Cancelled') return false;
      if (allowedGroupIds !== null && !allowedGroupIds.includes(session.groupId)) {
        return false;
      }
      if (selectedCohort !== 'All' && session.groupId !== selectedCohort) {
        return false;
      }
      return true;
    });
  }, [sessions, allowedGroupIds, selectedCohort]);

  const weekSessionsCount = useMemo(() => {
    const dayKeys = new Set(days.map((d) => format(d, 'yyyy-MM-dd')));
    return visibleSessions.filter((s) => dayKeys.has(s.date)).length;
  }, [visibleSessions, days]);

  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const weekLabel = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).formatRange(week, addDays(week, 6));

  const pageTitle = studentOnly
    ? t('My schedule')
    : instructorOnly
    ? t('Instructor schedule')
    : t('Schedule');

  const pageSubtitle = studentOnly
    ? t('View your upcoming and scheduled cohort learning sessions.')
    : instructorOnly
    ? t('Review sessions for cohorts assigned to you.')
    : t('Browse sessions by week across your training center.');

  const categoryLabel = studentOnly ? t('Learning') : instructorOnly ? t('Teaching') : t('Training');

  const goToAttendance = (session: TrainingSession) => {
    try {
      localStorage.setItem(`trainhub.organization.${orgId}.attendance.selected-session`, session.id);
    } catch {
      // ignore storage error
    }
    setActiveSession(null);
    if (dashboardContext?.navigate) {
      dashboardContext.navigate('Attendance');
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{categoryLabel}</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{pageTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pageSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableCohorts.length > 0 && (
            <select
              aria-label={t('Filter by cohort')}
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="h-9 rounded-lg border border-border bg-input/40 px-3 text-xs"
            >
              <option value="All">{t('All cohorts')}</option>
              {availableCohorts.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label={t('Previous week')}
              onClick={() => setWeek((current) => addDays(current, -7))}
            >
              {language === 'ar' ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </Button>
            <span className="min-w-36 text-center text-xs font-medium sm:text-sm" lang={locale}>
              {weekLabel}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('Next week')}
              onClick={() => setWeek((current) => addDays(current, 7))}
            >
              {language === 'ar' ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeek(startOfWeek(new Date(), { weekStartsOn: 0 }))}
            >
              {t('Today')}
            </Button>
          </div>
        </div>
      </header>

      {loading ? (
        <p role="status" className="py-12 text-center text-sm text-muted-foreground">
          {t('Loading schedule...')}
        </p>
      ) : error ? (
        <div className="py-8 text-center">
          <p role="alert" className="mb-3 text-sm text-destructive">
            {error}
          </p>
          <Button variant="outline" onClick={() => void load()}>
            {t('Try again')}
          </Button>
        </div>
      ) : (instructorOnly || studentOnly) && allowedGroupIds !== null && allowedGroupIds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-3 font-medium">
              {instructorOnly ? t('No assigned cohorts') : t('No enrolled cohorts')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {instructorOnly
                ? t('Your schedule will show sessions after cohorts are assigned to your instructor profile.')
                : t('Your schedule will show sessions after you are enrolled in a training cohort.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t('{count} sessions this week', { count: weekSessionsCount })}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {days.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const items = visibleSessions
                .filter((session) => session.date === dayKey)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              const isToday = isSameDay(day, new Date());

              return (
                <Card
                  key={dayKey}
                  className={`min-h-48 transition ${
                    isToday ? 'border-primary/50 shadow-sm ring-1 ring-primary/20' : ''
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
                    <CardTitle className="text-sm font-medium">
                      {new Intl.DateTimeFormat(locale, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      }).format(day)}
                    </CardTitle>
                    {isToday && (
                      <Badge variant="default" className="text-[10px] font-semibold">
                        {t('Today')}
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-2 p-3">
                    {items.length ? (
                      items.map((session) => (
                        <article
                          key={session.id}
                          onClick={() => setActiveSession(session)}
                          tabIndex={0}
                          role="button"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setActiveSession(session);
                            }
                          }}
                          className="cursor-pointer rounded-lg border border-border p-3 text-start transition hover:border-primary/50 hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="line-clamp-1 text-xs font-semibold text-foreground">
                              {session.title}
                            </h3>
                            <Badge
                              variant={session.status === 'Completed' ? 'success' : 'warning'}
                              className="shrink-0 text-[10px]"
                            >
                              {t(session.status)}
                            </Badge>
                          </div>

                          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                            {groupById.get(session.groupId)?.name ?? session.groupName ?? t('Cohort unavailable')}
                          </p>

                          <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock3 className="size-3 shrink-0" />
                            {session.startTime} – {session.endTime}
                          </p>

                          {session.location && (
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="size-3 shrink-0" />
                              <span className="line-clamp-1">{session.location}</span>
                            </p>
                          )}

                          {session.meetingUrl && (
                            <div className="mt-2">
                              <a
                                href={session.meetingUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary underline-offset-4 hover:underline"
                              >
                                {t('Join online')}
                                <ExternalLink className="size-3" />
                              </a>
                            </div>
                          )}
                        </article>
                      ))
                    ) : (
                      <p className="py-6 text-center text-xs text-muted-foreground">
                        {t('No sessions scheduled')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      <Modal
        open={Boolean(activeSession)}
        onClose={() => setActiveSession(null)}
        title={activeSession?.title ?? t('Session details')}
        description={groupById.get(activeSession?.groupId ?? '')?.name ?? activeSession?.groupName}
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            {!studentOnly && activeSession && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToAttendance(activeSession)}
                leadingIcon={<CalendarCheck className="size-4 text-primary" />}
              >
                {t('Take attendance')}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setActiveSession(null)}>
              {t('Close')}
            </Button>
          </div>
        }
      >
        {activeSession && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('Status')}</span>
              <Badge variant={activeSession.status === 'Completed' ? 'success' : 'warning'}>
                {t(activeSession.status)}
              </Badge>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-4 shrink-0 text-foreground" />
                <span>{activeSession.date}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock3 className="size-4 shrink-0 text-foreground" />
                <span>
                  {activeSession.startTime} – {activeSession.endTime}
                </span>
              </div>
              {activeSession.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4 shrink-0 text-foreground" />
                  <span>{activeSession.location}</span>
                </div>
              )}
              {activeSession.instructorName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="size-4 shrink-0 text-foreground" />
                  <span>{activeSession.instructorName}</span>
                </div>
              )}
              {groupById.get(activeSession.groupId)?.name && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4 shrink-0 text-foreground" />
                  <span>{groupById.get(activeSession.groupId)?.name}</span>
                </div>
              )}
            </div>

            {activeSession.meetingUrl && (
              <div>
                <a
                  href={activeSession.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                >
                  <ExternalLink className="size-4" />
                  {t('Join online meeting')}
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  );
}
