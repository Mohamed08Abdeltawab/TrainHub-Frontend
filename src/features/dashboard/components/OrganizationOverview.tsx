import { useEffect, useState } from 'react';
import { ArrowUpRight, BookOpenCheck, CalendarDays, ClipboardCheck, UsersRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { DashboardContent } from '@/types/nav';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageContext';

const metricIcons = [UsersRound, BookOpenCheck, ArrowUpRight, ClipboardCheck];
const engagement = [
  { label: 'Course completion', value: 86, color: 'bg-primary' },
  { label: 'Learner attendance', value: 92, color: 'bg-emerald-500' },
  { label: 'Assignment reviews', value: 68, color: 'bg-amber-500' },
];

export default function OrganizationOverview({ content, onOpenPrimarySection }: { content: DashboardContent; onOpenPrimarySection: () => void }) {
  const { t } = useLanguage();
  const { orgId = 'demo' } = useParams();
  const [organization, setOrganization] = useState({ name: content.tenant, email: '' });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`trainhub.organization.${orgId}.profile`);
      if (!raw) {
        setOrganization({ name: content.tenant, email: '' });
        return;
      }
      const profile: unknown = JSON.parse(raw);
      if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
        const stored = profile as { name?: unknown; email?: unknown };
        setOrganization({
          name: typeof stored.name === 'string' && stored.name.trim() ? stored.name : content.tenant,
          email: typeof stored.email === 'string' ? stored.email : '',
        });
      }
    } catch {
      setOrganization({ name: content.tenant, email: '' });
    }
  }, [content.tenant, orgId]);

  return (
    <div className="space-y-5">
      <Card className="border-border bg-card/70 px-5 py-4 shadow-sm">
        <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-start">
            <p className="text-xs font-medium text-muted-foreground">{t('Organization summary')}</p>
            <h2 className="mt-1 break-words text-lg font-bold text-foreground">{organization.name}</h2>
            <p className="mt-1 break-words text-xs text-muted-foreground">{organization.email || t('Add a contact email to your organization profile.')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
            <Badge variant="secondary">{t(content.plan)}</Badge>
            <Link to={`/admin/organizations/${orgId}/organization-profile`} className="text-start text-xs font-semibold text-primary hover:underline">{t('Edit organization profile')}</Link>
          </div>
        </div>
      </Card>
      <section aria-label={t('Organization performance')} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {content.metrics.map((metric, index) => {
          const Icon = metricIcons[index] ?? ArrowUpRight;
          return <Card key={metric.label} className="border-border bg-card/70 p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-muted-foreground">{t(metric.label)}</p><p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{metric.value}</p></div><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span></div><p className="mt-2 text-[11px] text-muted-foreground">{t(metric.note)}</p></Card>;
        })}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <Card className="border-border bg-card/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between px-5 pb-2 pt-5"><div><CardTitle className="text-sm">{t('Training center health')}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{t('A quick view of learner engagement this month.')}</p></div><Badge variant="success">{t('On track')}</Badge></CardHeader>
          <CardContent className="space-y-5 px-5 pb-5 pt-3">
            {engagement.map((item) => <div key={item.label}><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">{t(item.label)}</span><span className="font-semibold text-foreground">{item.value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} /></div></div>)}
          </CardContent>
        </Card>
        <Card className="border-border bg-card/70 shadow-sm">
          <CardHeader className="px-5 pb-2 pt-5"><CardTitle className="text-sm">{t('Needs your attention')}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{t('Keep your academy operations moving.')}</p></CardHeader>
          <CardContent className="space-y-3 px-5 pb-5 pt-2">
            <button onClick={onOpenPrimarySection} className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-start transition hover:bg-muted/50"><span className="grid size-9 place-items-center rounded-lg bg-amber-500/10 text-amber-500"><ClipboardCheck className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-foreground">{t('Assignments to review')}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{t('6 assignments need attention')}</span></span><ArrowUpRight className="size-4 text-muted-foreground" /></button>
            <button onClick={onOpenPrimarySection} className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-start transition hover:bg-muted/50"><span className="grid size-9 place-items-center rounded-lg bg-sky-500/10 text-sky-500"><CalendarDays className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-foreground">{t('Upcoming cohort starts')}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{t('3 starting this week')}</span></span><ArrowUpRight className="size-4 text-muted-foreground" /></button>
            <Button className="mt-1 w-full" variant="outline" onClick={onOpenPrimarySection}>{t('View courses and cohorts')}</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/70 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between px-5 pb-2 pt-5"><div><CardTitle className="text-sm">{t(content.tableTitle)}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{t(content.subtitle)}</p></div><Button variant="ghost" size="sm" onClick={onOpenPrimarySection}>{t('View all')} <ArrowUpRight className="size-3.5" /></Button></CardHeader>
        <CardContent className="space-y-1 px-5 pb-5">
          {content.rows.map((row) => <div key={row.title} className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{t(row.title)}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{t(row.detail)}</p></div><Badge variant={/upcoming|review/i.test(row.status) ? 'warning' : 'success'}>{t(row.status)}</Badge></div>)}
        </CardContent>
      </Card>
    </div>
  );
}
