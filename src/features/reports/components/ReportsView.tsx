import { useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  GraduationCap,
  TrendingUp,
  Users,
  Award,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function ReportsView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [downloadNotice, setDownloadNotice] = useState(false);

  const kpis = [
    { label: 'Overall Attendance Rate', value: '92.4%', note: '+3.1% vs last month', icon: CheckCircle2 },
    { label: 'Course Completion Rate', value: '86.4%', note: 'Target: 80%', icon: Award },
    { label: 'Active Learners Enrolled', value: '1,248', note: '+12.5% increase', icon: Users },
    { label: 'Average Satisfaction Score', value: '4.8 / 5', note: 'Based on 420 reviews', icon: TrendingUp },
  ];

  const cohortReports = [
    {
      cohort: 'Cohort A - Fullstack Web Development',
      instructor: 'Sarah Jenkins',
      learners: 30,
      attendanceRate: '94.2%',
      completionProgress: '68%',
      status: 'On track',
    },
    {
      cohort: 'Cohort B - Modern UI/UX Design',
      instructor: 'Mona Zaki',
      learners: 25,
      attendanceRate: '91.8%',
      completionProgress: '52%',
      status: 'On track',
    },
    {
      cohort: 'Cohort C - Agile & Git Team Workflows',
      instructor: 'Omar Hassan',
      learners: 20,
      attendanceRate: '96.0%',
      completionProgress: '85%',
      status: 'High performance',
    },
    {
      cohort: 'Cohort D - JavaScript Essentials',
      instructor: 'Sarah Jenkins',
      learners: 24,
      attendanceRate: '88.5%',
      completionProgress: '42%',
      status: 'Review needed',
    },
  ];

  const handleExport = () => {
    setDownloadNotice(true);
    setTimeout(() => setDownloadNotice(false), 3000);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t('Analytics')}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{t('Reports & Performance')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('Operational performance, attendance statistics, and learning outcome metrics.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            leadingIcon={<Download className="size-4" />}
          >
            {t('Export CSV')}
          </Button>
        </div>
      </header>

      {downloadNotice && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
          {t('Performance report downloaded successfully.')}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="border-border bg-card/70 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t(kpi.label)}</p>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{kpi.value}</p>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{t(kpi.note)}</p>
            </Card>
          );
        })}
      </div>

      {/* Cohort Breakdown Table */}
      <Card className="border-border bg-card/70">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-semibold">{t('Cohort Performance Breakdown')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="border-b border-border bg-muted/40 text-[11px] font-medium text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-start">{t('Cohort')}</th>
                  <th className="px-4 py-3 text-start">{t('Instructor')}</th>
                  <th className="px-4 py-3 text-center">{t('Learners')}</th>
                  <th className="px-4 py-3 text-center">{t('Attendance')}</th>
                  <th className="px-4 py-3 text-center">{t('Progress')}</th>
                  <th className="px-5 py-3 text-end">{t('Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cohortReports.map((row) => (
                  <tr key={row.cohort} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground">{row.cohort}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{row.instructor}</td>
                    <td className="px-4 py-3.5 text-center font-semibold text-foreground">{row.learners}</td>
                    <td className="px-4 py-3.5 text-center font-medium text-emerald-600 dark:text-emerald-400">
                      {row.attendanceRate}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="mx-auto flex max-w-[100px] items-center gap-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: row.completionProgress }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{row.completionProgress}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-end">
                      <Badge
                        variant={
                          row.status === 'High performance'
                            ? 'success'
                            : row.status === 'On track'
                            ? 'secondary'
                            : 'warning'
                        }
                      >
                        {t(row.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
