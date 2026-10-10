import { useMemo, useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Search,
  FilterX,
  UploadCloud,
  FileCheck2,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input } from '@/components/ui';

export type Assignment = {
  id: string;
  title: string;
  courseTitle: string;
  cohortName: string;
  dueDate: string;
  status: 'Pending' | 'Submitted' | 'Graded' | 'Overdue';
  score?: number;
  maxScore: number;
  studentName?: string;
  submissionDate?: string;
  feedback?: string;
};

const seedAssignments: Assignment[] = [
  {
    id: 'asg-1',
    title: 'Fullstack React Capstone Architecture & Setup',
    courseTitle: 'Fullstack Web Development',
    cohortName: 'Cohort A',
    dueDate: '2026-10-18',
    status: 'Submitted',
    maxScore: 100,
    studentName: 'David Kim',
    submissionDate: '2026-10-09',
    feedback: 'Code submitted and queued for instructor evaluation.',
  },
  {
    id: 'asg-2',
    title: 'REST API Integration & JWT Authentication',
    courseTitle: 'Fullstack Web Development',
    cohortName: 'Cohort A',
    dueDate: '2026-10-02',
    status: 'Graded',
    score: 95,
    maxScore: 100,
    studentName: 'David Kim',
    submissionDate: '2026-10-01',
    feedback: 'Excellent clean architecture, robust token validation, and error handling.',
  },
  {
    id: 'asg-3',
    title: 'Interactive Design System & Figma Tokens',
    courseTitle: 'Modern UI/UX Design',
    cohortName: 'Cohort B',
    dueDate: '2026-10-22',
    status: 'Pending',
    maxScore: 50,
    studentName: 'David Kim',
  },
  {
    id: 'asg-4',
    title: 'Git Team Branching, Conflict Resolution & CI/CD',
    courseTitle: 'Agile & Git Team Workflows',
    cohortName: 'Cohort C',
    dueDate: '2026-09-25',
    status: 'Graded',
    score: 100,
    maxScore: 100,
    studentName: 'David Kim',
    submissionDate: '2026-09-24',
    feedback: 'Flawless rebase flow and well-documented pull request description.',
  },
  {
    id: 'asg-5',
    title: 'REST API Integration & JWT Authentication',
    courseTitle: 'Fullstack Web Development',
    cohortName: 'Cohort A',
    dueDate: '2026-10-02',
    status: 'Graded',
    score: 90,
    maxScore: 100,
    studentName: 'Nour El-Din',
    submissionDate: '2026-10-01',
    feedback: 'Great execution on the controller and policy configurations.',
  },
  {
    id: 'asg-6',
    title: 'Fullstack React Capstone Architecture & Setup',
    courseTitle: 'Fullstack Web Development',
    cohortName: 'Cohort A',
    dueDate: '2026-10-18',
    status: 'Submitted',
    maxScore: 100,
    studentName: 'Yara Mansour',
    submissionDate: '2026-10-10',
    feedback: 'Awaiting grading review.',
  },
];

export default function AssignmentsList() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const isStudent = user?.role === 'STUDENT';
  const isInstructor = user?.role === 'INSTRUCTOR';

  const assignments = useMemo(() => {
    let list = seedAssignments;
    if (isStudent) {
      list = list.filter((a) => a.studentName === 'David Kim');
    }
    return list;
  }, [isStudent]);

  const filtered = useMemo(() => {
    return assignments.filter((item) => {
      const matchQuery =
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.courseTitle.toLowerCase().includes(query.toLowerCase()) ||
        (item.studentName?.toLowerCase().includes(query.toLowerCase()) ?? false);
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [assignments, query, statusFilter]);

  const statusVariant = (status: Assignment['status']) => {
    switch (status) {
      case 'Graded':
        return 'success';
      case 'Submitted':
        return 'secondary';
      case 'Pending':
        return 'warning';
      case 'Overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {t(isStudent ? 'Learning' : isInstructor ? 'Teaching' : 'Training')}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{t('Assignments')}</h1>
          <p className="text-sm text-muted-foreground">
            {t(
              isStudent
                ? 'Track your course assignments, upcoming deadlines, and grades.'
                : isInstructor
                ? 'Review learner submissions, grade assignments, and provide feedback.'
                : 'Center-wide assignment delivery and submission progress.'
            )}
          </p>
        </div>
      </header>

      {/* Filter toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search assignments...')}
            className="pe-8"
          />
          <Search className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-border bg-input/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">{t('All statuses')}</option>
            <option value="Submitted">{t('Submitted')}</option>
            <option value="Graded">{t('Graded')}</option>
            <option value="Pending">{t('Pending')}</option>
          </select>
          {(query || statusFilter !== 'All') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setStatusFilter('All');
              }}
              leadingIcon={<FilterX className="size-3.5" />}
            >
              {t('Reset')}
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-border bg-card/60">
          <CardContent className="p-8 text-center">
            <EmptyState
              icon={<FileText className="size-5 text-primary" />}
              title={t('No assignments found')}
              description={t('Try adjusting your search query or status filter.')}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <Card key={item.id} className="border-border bg-card/70 transition-colors hover:border-border/80">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium text-primary">
                      {item.courseTitle} · {item.cohortName}
                    </span>
                    <CardTitle className="mt-1 text-base leading-snug">{item.title}</CardTitle>
                  </div>
                  <Badge variant={statusVariant(item.status)}>{t(item.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-2 text-xs text-muted-foreground">
                {!isStudent && item.studentName && (
                  <p className="font-medium text-foreground">
                    {t('Learner')}: {item.studentName}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 border-y border-border py-2.5">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-muted-foreground" />
                    {t('Due')}: {item.dueDate}
                  </span>
                  {item.submissionDate && (
                    <span className="flex items-center gap-1.5">
                      <FileCheck2 className="size-3.5 text-emerald-500" />
                      {t('Submitted')}: {item.submissionDate}
                    </span>
                  )}
                  {typeof item.score === 'number' && (
                    <span className="ms-auto font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.score} / {item.maxScore}
                    </span>
                  )}
                </div>
                {item.feedback && (
                  <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] leading-relaxed text-foreground">
                    <span className="font-semibold text-primary">{t('Feedback')}: </span>
                    {item.feedback}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
