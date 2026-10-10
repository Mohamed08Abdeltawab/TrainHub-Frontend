import { useState } from 'react';
import { CreditCard, DollarSign, Building, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function PlatformSubscriptionsView() {
  const { t } = useLanguage();

  const plans = [
    { name: 'Starter', price: '$99 / mo', orgsCount: 14, learnersLimit: '500 learners', share: '11%' },
    { name: 'Growth', price: '$249 / mo', orgsCount: 54, learnersLimit: '2,000 learners', share: '42%' },
    { name: 'Pro', price: '$499 / mo', orgsCount: 42, learnersLimit: '5,000 learners', share: '33%' },
    { name: 'Enterprise', price: '$999 / mo', orgsCount: 18, learnersLimit: 'Unlimited', share: '14%' },
  ];

  const tenantSubscriptions = [
    { id: 'sub-1', org: 'Al-Amal Training Center', plan: 'Growth', mrr: '$249', renewal: '2026-11-01', status: 'Active' },
    { id: 'sub-2', org: 'Nile Skills Academy', plan: 'Pro', mrr: '$499', renewal: '2026-11-15', status: 'Active' },
    { id: 'sub-3', org: 'Future Makers Center', plan: 'Starter', mrr: '$99', renewal: '2026-10-22', status: 'Review' },
    { id: 'sub-4', org: 'Delta Tech Institute', plan: 'Enterprise', mrr: '$999', renewal: '2026-12-01', status: 'Active' },
    { id: 'sub-5', org: 'Horizon Professional Academy', plan: 'Growth', mrr: '$249', renewal: '2026-11-20', status: 'Active' },
  ];

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t('Platform')}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{t('Subscriptions & Billing')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('Monitor SaaS subscription tiers, tenant MRR, and platform billing status.')}
        </p>
      </header>

      {/* Subscription KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => (
          <Card key={p.name} className="border-border bg-card/70 p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{p.name} {t('Plan')}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{p.orgsCount}</p>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <CreditCard className="size-4" />
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-2">
              <span>{p.price}</span>
              <span className="font-semibold text-foreground">{p.share} of total</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Tenant Subscriptions */}
      <Card className="border-border bg-card/70">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-semibold">{t('Tenant Billing Roster')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="border-b border-border bg-muted/40 text-[11px] font-medium text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-start">{t('Organization')}</th>
                  <th className="px-4 py-3 text-start">{t('Plan')}</th>
                  <th className="px-4 py-3 text-center">{t('Monthly Recurring')}</th>
                  <th className="px-4 py-3 text-center">{t('Next Renewal')}</th>
                  <th className="px-5 py-3 text-end">{t('Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenantSubscriptions.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground">{row.org}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{row.plan}</td>
                    <td className="px-4 py-3.5 text-center font-semibold text-foreground">{row.mrr}</td>
                    <td className="px-4 py-3.5 text-center text-muted-foreground">{row.renewal}</td>
                    <td className="px-5 py-3.5 text-end">
                      <Badge variant={row.status === 'Active' ? 'success' : 'warning'}>
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
