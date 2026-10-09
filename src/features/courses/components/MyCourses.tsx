import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Clock3, RefreshCw } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge, Button, Card, CardContent, CourseCardSkeletonGrid, EmptyState } from '@/components/ui';
import { getErrorPresentation } from '@/utils/errorPresentation';
import { myCoursesApi, type LearnerCourse } from '../api/myCoursesApi';

export default function MyCourses() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';
  const [courses, setCourses] = useState<LearnerCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCourses(await myCoursesApi.list(role));
    } catch (cause) {
      setError(t(getErrorPresentation(cause).description));
    } finally {
      setLoading(false);
    }
  }, [role, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {t(role === 'STUDENT' ? 'Learning' : 'Teaching')}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{t('My courses')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(role === 'STUDENT' ? 'Courses you are enrolled in.' : 'Courses assigned to your instructor account.')}
        </p>
      </header>

      {loading ? (
        <CourseCardSkeletonGrid count={6} />
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <p role="alert" className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => void load()} leadingIcon={<RefreshCw className="size-4" />}>
              {t('Try again')}
            </Button>
          </CardContent>
        </Card>
      ) : courses.length === 0 ? (
        <Card className="border-border bg-card/60">
          <CardContent className="p-4 sm:p-6">
            <EmptyState
              icon={<BookOpen className="size-5 text-primary" />}
              title={t('No courses yet')}
              description={
                role === 'STUDENT'
                  ? t('Your enrolled courses will appear here.')
                  : t('Courses assigned to you will appear here.')
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article key={course.id} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/80">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="size-5" />
                </span>
                <Badge variant={course.status === 'Active' ? 'success' : course.status === 'Draft' ? 'warning' : 'secondary'}>
                  {t(course.status)}
                </Badge>
              </div>
              <h2 className="mt-4 font-semibold text-foreground line-clamp-1">{course.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{course.category} · {t(course.level)}</p>
              <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">
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
              </div>
              {role === 'STUDENT' && course.instructorName && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('Instructor')}: <span className="text-foreground">{course.instructorName}</span>
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

