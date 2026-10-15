import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock3,
  Layers,
  Lock,
  RefreshCw,
  Sparkles,
  User,
  Users,
  AlertCircle,
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
  Modal,
  Spinner,
} from '@/components/ui';
import apiClient from '@/api/apiClient';
import { enrollmentsApi } from '@/api/enrollmentsApi';
import { studentsApi } from '@/features/students/api/studentsApi';
import { getErrorPresentation } from '@/utils/errorPresentation';

interface CourseDetails {
  id: string;
  name: string;
  description?: string;
  category?: string;
  basePrice: number;
  durationInHours?: number;
  statusName?: string;
}

interface CohortInfo {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  startDate: string;
  endDate: string;
  scheduleDescription?: string;
  capacity: number;
  enrolledStudentsCount: number;
  availableSeats: number;
  isFull: boolean;
  instructorName?: string;
  statusName: string;
}

interface SessionInfo {
  id: string;
  courseGroupId: string;
  courseGroupName: string;
  courseName: string;
  startTime: string;
  endTime: string;
  room?: string;
  instructorName?: string;
  statusName: string;
}

interface StudentCourseItem {
  id: string;
  title: string;
  name: string;
  instructorName?: string;
  progressPercent: number;
  enrollmentStatus: string;
  courseGroupId: string;
  courseGroupName: string;
}

export default function StudentCourseDetails({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isDemo = Boolean(user?.demo);

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [enrolledItem, setEnrolledItem] = useState<StudentCourseItem | null>(null);
  const [availableCohorts, setAvailableCohorts] = useState<CohortInfo[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enrollment modal state
  const [selectedCohort, setSelectedCohort] = useState<CohortInfo | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  const loadCourseData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isDemo) {
        // Fallback for demo mode
        const demoCourse: CourseDetails = {
          id: courseId,
          name: 'Fullstack Web Development',
          description: 'Comprehensive curriculum covering modern React, TypeScript, and backend architectures.',
          category: 'Web Development',
          basePrice: 250,
          durationInHours: 60,
          statusName: 'Active',
        };
        setCourse(demoCourse);
        setEnrolledItem({
          id: courseId,
          title: 'Fullstack Web Development',
          name: 'Fullstack Web Development',
          instructorName: 'Sara Jenkins',
          progressPercent: 62,
          enrollmentStatus: 'Active',
          courseGroupId: 'demo-cohort-1',
          courseGroupName: 'Cohort A',
        });
        setSessions([
          {
            id: 's1',
            courseGroupId: 'demo-cohort-1',
            courseGroupName: 'Cohort A',
            courseName: 'Fullstack Web Development',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 7200000).toISOString(),
            room: 'Lab 201',
            instructorName: 'Sara Jenkins',
            statusName: 'Scheduled',
          },
        ]);
        setLoading(false);
        return;
      }

      // 1. Fetch course info
      const courseRes = await apiClient.get<CourseDetails>(`/courses/${encodeURIComponent(courseId)}`);
      setCourse(courseRes.data);

      // 2. Fetch student's enrolled courses to check if enrolled
      try {
        const myCoursesRes = await apiClient.get<StudentCourseItem[]>('/students/me/courses');
        const found = (myCoursesRes.data || []).find((c) => c.id === courseId || (c as any).courseId === courseId);
        setEnrolledItem(found || null);

        if (found) {
          // Fetch student's sessions for this enrolled course group
          try {
            const sessionsRes = await apiClient.get<SessionInfo[]>('/students/me/sessions');
            const cohortSessions = (sessionsRes.data || []).filter(
              (s) => s.courseGroupId === found.courseGroupId
            );
            setSessions(cohortSessions);
          } catch {
            // Sessions could not be loaded; non-critical
          }
        }
      } catch {
        setEnrolledItem(null);
      }

      // 3. Fetch available cohorts for this course
      try {
        const cohortsRes = await apiClient.get<any>('/coursegroups', {
          params: { courseId, status: 1, pageSize: 50 },
        });
        const items: CohortInfo[] = Array.isArray(cohortsRes.data)
          ? cohortsRes.data
          : cohortsRes.data?.items || [];
        setAvailableCohorts(items);
      } catch {
        setAvailableCohorts([]);
      }
    } catch (err) {
      setError(getErrorPresentation(err).description || t('Failed to load course details.'));
    } finally {
      setLoading(false);
    }
  }, [courseId, isDemo, t]);

  useEffect(() => {
    void loadCourseData();
  }, [loadCourseData]);

  const handleEnrollSubmit = async () => {
    if (!selectedCohort || !course) return;
    setEnrolling(true);
    setEnrollError(null);

    try {
      if (isDemo) {
        setEnrolledItem({
          id: course.id,
          title: course.name,
          name: course.name,
          instructorName: selectedCohort.instructorName || 'Lead Instructor',
          progressPercent: 0,
          enrollmentStatus: 'Active',
          courseGroupId: selectedCohort.id,
          courseGroupName: selectedCohort.name,
        });
        setEnrollSuccess(t('Enrolled successfully!'));
        setSelectedCohort(null);
        setEnrolling(false);
        return;
      }

      // Get current student profile to obtain student ID
      const me = await studentsApi.getMe();
      if (!me) {
        throw new Error(t('No active student profile found for your account.'));
      }

      await enrollmentsApi.create({
        courseGroupId: selectedCohort.id,
        studentId: me.id,
        paidAmount: course.basePrice,
        status: 1,
      });

      setEnrollSuccess(t('You have successfully enrolled in this cohort!'));
      setSelectedCohort(null);
      await loadCourseData();
    } catch (err) {
      setEnrollError(getErrorPresentation(err).description || t('Failed to complete enrollment.'));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-16">
        <Spinner className="size-8 text-primary" />
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
          onClick={() => navigate('/student/my-courses')}
          className="mt-4 gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          <span>{t('Back to My Courses')}</span>
        </Button>
      </Card>
    );
  }

  const isEnrolled = Boolean(enrolledItem);

  return (
    <div className="space-y-6">
      {/* Header & Back navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/student/my-courses')}
          className="gap-2 text-xs text-muted-foreground hover:text-foreground self-start"
        >
          <ArrowLeft className="size-4" />
          <span>{t('Back to courses')}</span>
        </Button>

        <Badge variant={isEnrolled ? 'success' : 'default'} className="self-start sm:self-auto">
          {isEnrolled ? t('Enrolled') : t('Preview Mode')}
        </Badge>
      </div>

      {enrollSuccess && (
        <Alert variant="default" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{enrollSuccess}</span>
        </Alert>
      )}

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
                <p className="text-xs text-muted-foreground">{course.category || t('General Curriculum')}</p>
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
              <Sparkles className="size-4 text-amber-400" />
              <span>{course.basePrice > 0 ? `$${course.basePrice}` : t('Free')}</span>
            </div>
            {isEnrolled && enrolledItem?.instructorName && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="size-4 text-primary" />
                <span>{t('Instructor')}: <strong className="text-foreground">{enrolledItem.instructorName}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar if enrolled */}
        {isEnrolled && (
          <div className="mt-6 border-t border-border pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">{t('Course Progress')}</span>
              <span className="font-bold text-primary">{enrolledItem?.progressPercent ?? 0}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, enrolledItem?.progressPercent ?? 0))}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Conditional Content: Enrolled Learning Content vs Preview & Available Cohorts */}
      {isEnrolled ? (
        <div className="space-y-6">
          {/* Enrolled Cohort Summary */}
          <Card className="border-border bg-card/60 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span>{t('Your Enrolled Cohort')}: {enrolledItem?.courseGroupName}</span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('You have active learning access to this cohort schedule and classroom materials.')}
            </p>
          </Card>

          {/* Scheduled Sessions / Lessons */}
          <Card className="border-border bg-card/60 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <span>{t('Scheduled Sessions & Lessons')}</span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('Live lessons, classroom meetings, and attendance records.')}
            </p>

            <div className="mt-4 space-y-3">
              {sessions.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="size-5 text-muted-foreground" />}
                  title={t('No scheduled sessions yet')}
                  description={t('Your instructor will schedule upcoming lessons for this cohort.')}
                />
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col gap-2 rounded-lg border border-border/80 bg-background/50 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-xs">
                          {new Date(session.startTime).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {session.statusName}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(session.startTime).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        –{' '}
                        {new Date(session.endTime).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {session.room ? ` · ${session.room}` : ''}
                      </p>
                    </div>

                    {session.instructorName && (
                      <span className="text-xs text-muted-foreground">
                        {t('Instructor')}: <span className="text-foreground">{session.instructorName}</span>
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Restricted Content Notice */}
          <Card className="border-amber-500/20 bg-amber-500/10 p-5 text-amber-300">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 size-5 shrink-0 text-amber-400" />
              <div>
                <h2 className="text-sm font-semibold">{t('Course Content Restricted')}</h2>
                <p className="mt-1 text-xs text-amber-200/90">
                  {t('To view learning modules, attend live sessions, and submit coursework, select an available cohort below and complete enrollment.')}
                </p>
              </div>
            </div>
          </Card>

          {/* Available Cohorts for Enrollment */}
          <Card className="border-border bg-card/60 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span>{t('Available Cohorts & Enrollment')}</span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('Choose an open cohort to join and start learning.')}
            </p>

            <div className="mt-4 space-y-3">
              {availableCohorts.length === 0 ? (
                <EmptyState
                  icon={<Users className="size-5 text-muted-foreground" />}
                  title={t('No open cohorts at this time')}
                  description={t('All cohorts for this course are either full or not yet open for registration. Please check back later.')}
                />
              ) : (
                availableCohorts.map((cohort) => {
                  const isFull = cohort.isFull || cohort.enrolledStudentsCount >= cohort.capacity;
                  return (
                    <div
                      key={cohort.id}
                      className="flex flex-col gap-3 rounded-xl border border-border/80 bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground text-sm">{cohort.name}</h3>
                          <Badge variant={isFull ? 'destructive' : 'success'} className="text-[10px]">
                            {isFull ? t('Cohort Full') : t('Open for Enrollment')}
                          </Badge>
                        </div>

                        {cohort.scheduleDescription && (
                          <p className="text-xs text-muted-foreground">{cohort.scheduleDescription}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                          <span>
                            {t('Dates')}: {new Date(cohort.startDate).toLocaleDateString()} – {new Date(cohort.endDate).toLocaleDateString()}
                          </span>
                          <span>·</span>
                          <span>
                            {t('Capacity')}: {cohort.enrolledStudentsCount} / {cohort.capacity} {t('enrolled')}
                          </span>
                          {cohort.instructorName && (
                            <>
                              <span>·</span>
                              <span>{t('Instructor')}: {cohort.instructorName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <Button
                        variant={isFull ? 'outline' : 'primary'}
                        size="sm"
                        disabled={isFull}
                        onClick={() => {
                          setEnrollError(null);
                          setSelectedCohort(cohort);
                        }}
                        className="self-start sm:self-center"
                      >
                        {isFull ? t('Full') : t('Enroll in Cohort')}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Enrollment Confirmation Modal */}
      <Modal
        open={Boolean(selectedCohort)}
        onClose={() => {
          if (!enrolling) setSelectedCohort(null);
        }}
        title={t('Confirm Course Enrollment')}
        description={t('Review cohort details before confirming your registration.')}
        size="sm"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={enrolling}
              onClick={() => setSelectedCohort(null)}
            >
              {t('Cancel')}
            </Button>
            <Button
              variant="primary"
              type="button"
              disabled={enrolling}
              onClick={handleEnrollSubmit}
              leadingIcon={enrolling ? <Spinner className="size-4" /> : <CheckCircle2 className="size-4" />}
            >
              {enrolling ? t('Enrolling...') : t('Confirm Enrollment')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {enrollError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <p className="text-xs">{enrollError}</p>
            </Alert>
          )}

          <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs space-y-2">
            <div>
              <span className="text-muted-foreground">{t('Course')}: </span>
              <strong className="text-foreground">{course.name}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">{t('Cohort')}: </span>
              <strong className="text-foreground">{selectedCohort?.name}</strong>
            </div>
            {selectedCohort?.scheduleDescription && (
              <div>
                <span className="text-muted-foreground">{t('Schedule')}: </span>
                <span className="text-foreground">{selectedCohort.scheduleDescription}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">{t('Tuition')}: </span>
              <strong className="text-foreground">
                {course.basePrice > 0 ? `$${course.basePrice}` : t('Free')}
              </strong>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('By confirming, you will be enrolled into this cohort and granted immediate access to learning sessions and assignments.')}
          </p>
        </div>
      </Modal>
    </div>
  );
}
