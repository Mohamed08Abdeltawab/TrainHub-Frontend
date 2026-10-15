import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ClipboardList,
  Clock3,
  ExternalLink,
  Plus,
  RefreshCw,
  ShieldAlert,
  Users,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Spinner,
} from '@/components/ui';
import apiClient from '@/api/apiClient';
import { assignmentsApi, type AssignmentDto } from '@/features/assignments/api/assignmentsApi';
import { getErrorPresentation } from '@/utils/errorPresentation';

interface CourseDetails {
  id: string;
  name: string;
  description?: string;
  category?: string;
  durationInHours?: number;
  statusName?: string;
}

interface InstructorCohort {
  id: string;
  courseId: string;
  courseName: string;
  name: string;
  startDate: string;
  endDate: string;
  scheduleDescription?: string;
  capacity: number;
  enrolledStudentsCount: number;
  status: string;
}

interface SessionItem {
  id: string;
  courseGroupId: string;
  courseGroupName: string;
  startTime: string;
  endTime: string;
  room?: string;
  statusName: string;
}

export default function InstructorCourseDetails({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isDemo = Boolean(user?.demo);

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [cohorts, setCohorts] = useState<InstructorCohort[]>([]);
  const [sessionsByCohort, setSessionsByCohort] = useState<Record<string, SessionItem[]>>({});
  const [assignmentsByCohort, setAssignmentsByCohort] = useState<Record<string, AssignmentDto[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notAssigned, setNotAssigned] = useState(false);

  const loadInstructorData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotAssigned(false);

    try {
      if (isDemo) {
        setCourse({
          id: courseId,
          name: 'Fullstack Web Development',
          description: 'Comprehensive curriculum covering modern React, TypeScript, and backend architectures.',
          category: 'Web Development',
          durationInHours: 60,
          statusName: 'Active',
        });
        const demoCohorts: InstructorCohort[] = [
          {
            id: 'demo-cohort-1',
            courseId,
            courseName: 'Fullstack Web Development',
            name: 'Cohort A',
            startDate: '2026-09-01',
            endDate: '2026-12-15',
            scheduleDescription: 'Mon & Wed, 2:00 PM – 4:00 PM',
            capacity: 25,
            enrolledStudentsCount: 22,
            status: 'Active',
          },
        ];
        setCohorts(demoCohorts);
        setSessionsByCohort({
          'demo-cohort-1': [
            {
              id: 's1',
              courseGroupId: 'demo-cohort-1',
              courseGroupName: 'Cohort A',
              startTime: new Date().toISOString(),
              endTime: new Date(Date.now() + 7200000).toISOString(),
              room: 'Lab 201',
              statusName: 'Scheduled',
            },
          ],
        });
        setAssignmentsByCohort({
          'demo-cohort-1': [
            {
              id: 'a1',
              organizationId: 'demo',
              courseGroupId: 'demo-cohort-1',
              courseGroupName: 'Cohort A',
              courseId,
              courseName: 'Fullstack Web Development',
              title: 'Build a REST API Client',
              description: 'Connect frontend to backend.',
              dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
              maxScore: 100,
              status: 1,
              statusName: 'Active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        });
        setLoading(false);
        return;
      }

      // 1. Fetch course details
      const courseRes = await apiClient.get<CourseDetails>(`/courses/${encodeURIComponent(courseId)}`);
      setCourse(courseRes.data);

      // 2. Fetch instructor's cohorts
      let assignedCohorts: InstructorCohort[] = [];
      if (user?.role === 'INSTRUCTOR') {
        const cohortsRes = await apiClient.get<InstructorCohort[]>('/instructors/me/cohorts');
        assignedCohorts = (cohortsRes.data || []).filter((c) => c.courseId === courseId);
      } else {
        // SuperAdmin / OrgAdmin inspecting instructor view
        const groupsRes = await apiClient.get<any>('/coursegroups', { params: { courseId } });
        const items: any[] = Array.isArray(groupsRes.data) ? groupsRes.data : groupsRes.data?.items || [];
        assignedCohorts = items.map((g) => ({
          id: g.id,
          courseId: g.courseId,
          courseName: g.courseName,
          name: g.name,
          startDate: g.startDate,
          endDate: g.endDate,
          scheduleDescription: g.scheduleDescription,
          capacity: g.capacity,
          enrolledStudentsCount: g.enrolledStudentsCount,
          status: g.statusName || 'Active',
        }));
      }

      if (assignedCohorts.length === 0 && user?.role === 'INSTRUCTOR') {
        setNotAssigned(true);
        setLoading(false);
        return;
      }

      setCohorts(assignedCohorts);

      // 3. For each assigned cohort, fetch sessions & assignments concurrently
      const sessionsMap: Record<string, SessionItem[]> = {};
      const assignmentsMap: Record<string, AssignmentDto[]> = {};

      await Promise.all(
        assignedCohorts.map(async (cohort) => {
          try {
            const [sessRes, asgRes] = await Promise.all([
              apiClient.get<SessionItem[]>(`/coursegroups/${cohort.id}/sessions`),
              assignmentsApi.list({ courseGroupId: cohort.id }, isDemo),
            ]);
            sessionsMap[cohort.id] = sessRes.data || [];
            assignmentsMap[cohort.id] = asgRes.items || [];
          } catch {
            sessionsMap[cohort.id] = [];
            assignmentsMap[cohort.id] = [];
          }
        })
      );

      setSessionsByCohort(sessionsMap);
      setAssignmentsByCohort(assignmentsMap);
    } catch (err) {
      setError(getErrorPresentation(err).description || t('Failed to load course details.'));
    } finally {
      setLoading(false);
    }
  }, [courseId, isDemo, user?.role, t]);

  useEffect(() => {
    void loadInstructorData();
  }, [loadInstructorData]);

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-16">
        <Spinner className="size-8 text-primary" />
      </Card>
    );
  }

  if (notAssigned) {
    return (
      <Card className="border-amber-500/20 bg-amber-500/10 p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-amber-400" />
        <h2 className="mt-3 text-base font-semibold text-foreground">
          {t('Teaching Assignment Required')}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
          {t('You are not currently assigned to teach any active cohorts for this course. Contact your academy administrator for cohort assignments.')}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/instructor/my-courses')}
          className="mt-4 gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          <span>{t('Back to My Courses')}</span>
        </Button>
      </Card>
    );
  }

  if (error || !course) {
    return (
      <Card className="border-destructive/20 bg-destructive/10 p-8 text-center">
        <p className="text-sm font-medium text-destructive">{error || t('Course not found.')}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/instructor/my-courses')}
          className="mt-4 gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          <span>{t('Back to My Courses')}</span>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Back navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/instructor/my-courses')}
          className="gap-2 text-xs text-muted-foreground hover:text-foreground self-start"
        >
          <ArrowLeft className="size-4" />
          <span>{t('Back to My Courses')}</span>
        </Button>

        <Badge variant="success" className="self-start sm:self-auto">
          {t('Instructor Management View')}
        </Badge>
      </div>

      {/* Course Overview Card */}
      <Card className="border-border bg-card/60 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-5" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{course.name}</h1>
                <p className="text-xs text-muted-foreground">{course.category || t('Curriculum')}</p>
              </div>
            </div>

            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {course.description || t('No course description provided.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/80 bg-background/50 p-4 text-xs">
            {course.durationInHours && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock3 className="size-4 text-primary" />
                <span>{course.durationInHours} {t('hours')}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-4 text-primary" />
              <span>{cohorts.length} {t('assigned cohort(s)')}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Cohorts Assigned to Instructor */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <span>{t('Assigned Teaching Cohorts')}</span>
        </h2>

        {cohorts.map((cohort) => {
          const cohortSessions = sessionsByCohort[cohort.id] || [];
          const cohortAssignments = assignmentsByCohort[cohort.id] || [];

          return (
            <Card key={cohort.id} className="border-border bg-card/60 p-6 shadow-sm space-y-6">
              {/* Cohort Header & Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">{cohort.name}</h3>
                    <Badge variant="outline" className="text-[10px]">
                      {cohort.status}
                    </Badge>
                  </div>
                  {cohort.scheduleDescription && (
                    <p className="mt-1 text-xs text-muted-foreground">{cohort.scheduleDescription}</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t('Enrolled learners')}: <strong className="text-foreground">{cohort.enrolledStudentsCount}</strong> / {cohort.capacity}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/instructor/attendance')}
                    className="gap-1.5 text-xs"
                  >
                    <CheckCircle className="size-3.5" />
                    <span>{t('Take Attendance')}</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/instructor/assignments?action=create')}
                    className="gap-1.5 text-xs"
                  >
                    <Plus className="size-3.5" />
                    <span>{t('Add Assignment')}</span>
                  </Button>
                </div>
              </div>

              {/* Cohort Deliverables Grid: Sessions & Assignments */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Scheduled Sessions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-primary" />
                      <span>{t('Teaching Sessions')} ({cohortSessions.length})</span>
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/instructor/sessions')}
                      className="text-xs h-7 px-2"
                    >
                      <span>{t('Manage')}</span>
                      <ExternalLink className="size-3 ms-1" />
                    </Button>
                  </div>

                  {cohortSessions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      {t('No sessions scheduled for this cohort yet.')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cohortSessions.slice(0, 4).map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between rounded-lg border border-border/80 bg-background/50 p-2.5 text-xs"
                        >
                          <div>
                            <span className="font-medium text-foreground">
                              {new Date(session.startTime).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="text-muted-foreground ms-2">
                              {new Date(session.startTime).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {session.room ? ` · ${session.room}` : ''}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {session.statusName}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cohort Assignments */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ClipboardList className="size-3.5 text-primary" />
                      <span>{t('Assignments')} ({cohortAssignments.length})</span>
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/instructor/assignments')}
                      className="text-xs h-7 px-2"
                    >
                      <span>{t('Manage')}</span>
                      <ExternalLink className="size-3 ms-1" />
                    </Button>
                  </div>

                  {cohortAssignments.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      {t('No assignments assigned for this cohort yet.')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cohortAssignments.slice(0, 4).map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between rounded-lg border border-border/80 bg-background/50 p-2.5 text-xs"
                        >
                          <div>
                            <p className="font-medium text-foreground">{assignment.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {t('Due')}: {new Date(assignment.dueDate).toLocaleDateString()} · {assignment.maxScore} {t('pts')}
                            </p>
                          </div>
                          <Badge
                            variant={
                              assignment.status === 1
                                ? 'success'
                                : assignment.status === 0
                                ? 'warning'
                                : 'secondary'
                            }
                            className="text-[10px]"
                          >
                            {assignment.statusName}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
