import type { DashboardContent } from '@/types/nav';
import LayoutIcon from '@/components/layout/LayoutIcon';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  type DataTableColumn,
} from '@/components/ui';
import { ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

type DashboardRow = { title: string; detail: string; status: string };

type DashboardOverviewProps = {
  content: DashboardContent;
  onOpenPrimarySection: (targetLabel?: string) => void;
};

export default function DashboardOverview({
  content,
  onOpenPrimarySection,
}: DashboardOverviewProps) {
  const { t } = useLanguage();

  const tableColumns: DataTableColumn<DashboardRow>[] = [
    {
      key: 'title',
      header: t('Course or organization'),
      sortValue: (row) => row.title,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{row.title}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{t(row.detail)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      sortValue: (row) => row.status,
      cell: (row) => (
        <Badge
          variant={
            /upcoming|review/i.test(row.status)
              ? 'warning'
              : /complete/i.test(row.status)
              ? 'default'
              : 'success'
          }
        >
          {t(row.status)}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <section
        aria-label="Key metrics"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {content.metrics.map((metric, index) => (
          <Card
            key={metric.label}
            className="flex flex-col justify-between border-border bg-card/60 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {t(metric.label)}
              </span>
              <span
                className={`grid size-8 place-items-center rounded-lg ${
                  [
                    'bg-primary/15 text-primary',
                    'bg-sky-500/15 text-sky-400',
                    'bg-emerald-500/15 text-emerald-400',
                    'bg-amber-500/15 text-amber-400',
                  ][index]
                }`}
              >
                <LayoutIcon
                  icon={
                    ['overview', 'courses', 'reports', 'assignments'][
                      index
                    ] as 'overview' | 'courses' | 'reports' | 'assignments'
                  }
                />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {metric.value}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{t(metric.note)}</p>
            </div>
          </Card>
        ))}
      </section>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
        <Card className="border-border bg-card/60 p-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between px-5 pt-5 pb-3">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {t(content.tableTitle)}
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs text-muted-foreground">
                {t(content.subtitle)}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenPrimarySection(content.action)}>
              {t('View all')} <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Button>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <DataTable
              columns={tableColumns}
              rows={content.rows}
              rowKey={(row) => row.title}
              caption={t(content.tableTitle)}
              pageSize={5}
              emptyTitle={t('No activity yet')}
              emptyDescription={t('New activity will appear here.')}
            />
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{t('Your workspace')}</h2>
            <Badge variant="success">{t('Active')}</Badge>
          </div>
          <p className="mt-3 text-xs font-semibold text-primary">{t(content.scope)}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t('Your access and tools are organized around your role.')}
          </p>
          <ul className="mt-4 space-y-3">
            {content.capabilities.map((capability) => (
              <li key={capability} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                <span className="text-foreground/90">{t(capability)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
