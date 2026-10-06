import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Clock3, RefreshCw } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge, Button, Card, CardContent } from '@/components/ui';
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

  useEffect(() => { void load(); }, [load]);

  return <section className="space-y-5">
    <header>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t(role === 'STUDENT' ? 'Learning' : 'Teaching')}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{t('My courses')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t(role === 'STUDENT' ? 'Courses you are enrolled in.' : 'Courses assigned to your instructor account.')}</p>
    </header>
    {loading ? <p role="status" className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">{t('Loading courses...')}</p>
      : error ? <Card><CardContent className="flex flex-col items-center gap-3 p-8 text-center"><p role="alert" className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => void load()} leadingIcon={<RefreshCw className="size-4" />}>{t('Try again')}</Button></CardContent></Card>
      : courses.length === 0 ? <Card><CardContent className="p-8 text-center"><BookOpen className="mx-auto size-9 text-muted-foreground"/><h2 className="mt-3 font-medium">{t('No courses yet')}</h2><p className="mt-1 text-sm text-muted-foreground">{t(role === 'STUDENT' ? 'Your enrolled courses will appear here.' : 'Courses assigned to you will appear here.')}</p></CardContent></Card>
      : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <article key={course.id} className="rounded-xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><BookOpen className="size-5"/></span><Badge variant={course.status === 'Active' ? 'success' : course.status === 'Draft' ? 'warning' : 'secondary'}>{t(course.status)}</Badge></div><h2 className="mt-4 font-semibold">{course.title}</h2><p className="mt-1 text-xs text-muted-foreground">{course.category} · {t(course.level)}</p><p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">{course.description || t('No course description.')}</p><div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5"/>{course.durationHours} {t('hours')}</span>{role === 'STUDENT' && typeof course.progressPercent === 'number' && <span>{Math.min(100, Math.max(0, course.progressPercent))}% {t('complete')}</span>}</div>{role === 'STUDENT' && course.instructorName && <p className="mt-2 text-xs text-muted-foreground">{t('Instructor')}: {course.instructorName}</p>}</article>)}</div>}
  </section>;
}
