import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Clock3, RefreshCw, Compass, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge, Button, Card, CardContent, CourseCardSkeletonGrid, EmptyState } from '@/components/ui';
import apiClient from '@/api/apiClient';
import { getErrorPresentation } from '@/utils/errorPresentation';
import { myCoursesApi, type LearnerCourse } from '../api/myCoursesApi';
import { coursesApi, type Course } from '../api/coursesApi';

export default function MyCourses() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const role = user?.role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';
  const isDemo = Boolean(user?.demo);

  // Tab for students: 'enrolled' or 'explore'
  const activeTabParam = searchParams.get('tab') === 'explore' ? 'explore' : 'enrolled';
  const [activeTab, setActiveTab] = useState<'enrolled' | 'explore'>(activeTabParam);

  const [enrolledCourses, setEnrolledCourses] = useState<LearnerCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('tab') === 'explore') {
      setActiveTab('explore');
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'enrolled' | 'explore') => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'explore') {
      nextParams.set('tab', 'explore');
    } else {
      nextParams.delete('tab');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (role === 'INSTRUCTOR') {
        const list = await myCoursesApi.list('INSTRUCTOR');
        setEnrolledCourses(list);
      } else {
        // For student, fetch both enrolled courses and available courses
        const [enrolledRes, availableRes] = await Promise.allSettled([
          myCoursesApi.list('STUDENT'),
          coursesApi.list('demo', isDemo, { pageSize: 50, status: 'Active' }),
        ]);

        if (enrolledRes.status === 'fulfilled') {
          setEnrolledCourses(enrolledRes.value);
        }
        if (availableRes.status === 'fulfilled') {
          setAvailableCourses(availableRes.value);
        }

        if (enrolledRes.status === 'rejected' && availableRes.status === 'rejected') {
          throw enrolledRes.reason;
        }
      }
    } catch (cause) {
      setError(t(getErrorPresentation(cause).description));
    } finally {
      setLoading(false);
    }
  }, [role, isDemo, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const basePath = role === 'INSTRUCTOR' ? '/instructor' : '/student';

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {t(role === 'STUDENT' ? 'Learning' : 'Teaching')}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{t('My courses')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              role === 'STUDENT'
                ? 'Access your enrolled curriculum and explore available training programs.'
                : 'Courses and cohorts assigned to your instructor account.'
            )}
          </p>
        </div>

        {/* Tab switcher for students */}
        {role === 'STUDENT' && (
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1 text-xs self-start sm:self-center">
            <Button
              variant={activeTab === 'enrolled' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange('enrolled')}
              className="text-xs"
            >
              <BookOpen className="size-3.5" />
              <span>{t('Enrolled Courses')}</span>
              {enrolledCourses.length > 0 && (
                <span className="ms-1.5 rounded-full bg-background/30 px-1.5 py-0.2 text-[10px]">
                  {enrolledCourses.length}
                </span>
              )}
            </Button>
            <Button
              variant={activeTab === 'explore' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange('explore')}
              className="text-xs"
            >
              <Compass className="size-3.5" />
              <span>{t('Explore Available')}</span>
            </Button>
          </div>
        )}
      </header>

      {loading ? (
        <CourseCardSkeletonGrid count={6} />
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <p role="alert" className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => void loadData()} leadingIcon={<RefreshCw className="size-4" />}>
              {t('Try again')}
            </Button>
          </CardContent>
        </Card>
      ) : role === 'STUDENT' && activeTab === 'explore' ? (
        /* Student Explore Available Courses Tab */
        availableCourses.length === 0 ? (
          <Card className="border-border bg-card/60">
            <CardContent className="p-6">
              <EmptyState
                icon={<Compass className="size-6 text-primary" />}
                title={t('No available courses')}
                description={t('New courses will be published soon. Please check back later.')}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {availableCourses.map((course) => {
              const isAlreadyEnrolled = enrolledCourses.some((e) => e.id === course.id);
              return (
                <article
                  key={course.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                        <BookOpen className="size-5" />
                      </span>
                      <Badge variant={isAlreadyEnrolled ? 'success' : 'secondary'}>
                        {isAlreadyEnrolled ? t('Enrolled') : t('Available')}
                      </Badge>
                    </div>

                    <h2 className="mt-4 font-semibold text-foreground text-base line-clamp-1">{course.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{course.category || t('Curriculum')} · {t(course.level || 'Beginner')}</p>
                    <p className="mt-3 line-clamp-2 min-h-10 text-xs text-muted-foreground">
                      {course.description || t('No course description.')}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5" />
                        {course.durationHours} {t('hours')}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                        <Sparkles className="size-3.5 text-amber-400" />
                        {t('Open Cohorts')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-border pt-3">
                    <Button
                      variant={isAlreadyEnrolled ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => navigate(`${basePath}/my-courses/${course.id}`)}
                      className="w-full justify-between text-xs"
                    >
                      <span>{isAlreadyEnrolled ? t('View Course') : t('Inspect & Enroll')}</span>
                      <ArrowRight className="size-3.5 rtl:rotate-180" />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : enrolledCourses.length === 0 ? (
        /* Enrolled courses empty state */
        <Card className="border-border bg-card/60">
          <CardContent className="p-6 text-center space-y-4">
            <EmptyState
              icon={<BookOpen className="size-6 text-primary" />}
              title={t('No courses yet')}
              description={
                role === 'STUDENT'
                  ? t('You are not enrolled in any courses right now.')
                  : t('No teaching courses are currently assigned to your instructor account.')
              }
            />
            {role === 'STUDENT' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleTabChange('explore')}
                className="gap-2 mx-auto"
              >
                <Compass className="size-4" />
                <span>{t('Explore Available Courses')}</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Enrolled courses grid (Student or Instructor) */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {enrolledCourses.map((course) => (
            <article
              key={course.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="size-5" />
                  </span>
                  <Badge variant={course.status === 'Active' ? 'success' : course.status === 'Draft' ? 'warning' : 'secondary'}>
                    {t(course.status)}
                  </Badge>
                </div>

                <h2 className="mt-4 font-semibold text-foreground text-base line-clamp-1">{course.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{course.category || t('Curriculum')} · {t(course.level || 'Beginner')}</p>
                <p className="mt-3 line-clamp-2 min-h-10 text-xs text-muted-foreground">
                  {course.description || t('No course description.')}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="size-3.5" />
                    {course.durationHours} {t('hours')}
                  </span>
                  {role === 'STUDENT' && typeof course.progressPercent === 'number' && (
                    <span className="font-medium text-foreground">
                      {Math.min(100, Math.max(0, course.progressPercent))}% {t('complete')}
                    </span>
                  )}
                  {role === 'INSTRUCTOR' && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Layers className="size-3.5 text-primary" />
                      <span>{t('Teaching Scope')}</span>
                    </span>
                  )}
                </div>

                {role === 'STUDENT' && course.instructorName && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t('Instructor')}: <span className="text-foreground font-medium">{course.instructorName}</span>
                  </p>
                )}
              </div>

              <div className="mt-5 border-t border-border pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`${basePath}/my-courses/${course.id}`)}
                  className="w-full justify-between text-xs hover:border-primary hover:text-primary"
                >
                  <span>{role === 'INSTRUCTOR' ? t('Manage Course') : t('View Course')}</span>
                  <ArrowRight className="size-3.5 rtl:rotate-180" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
