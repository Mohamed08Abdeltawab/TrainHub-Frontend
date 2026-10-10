import { useState } from 'react';
import { Settings, Shield, Lock, Bell, CheckCircle2, Save, Database, Server } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';

export default function PlatformSettingsView() {
  const { t } = useLanguage();
  const [isolationStrict, setIsolationStrict] = useState(true);
  const [rateLimiting, setRateLimiting] = useState(true);
  const [smtpHost, setSmtpHost] = useState('smtp.sendgrid.net');
  const [tokenLifetime, setTokenLifetime] = useState('60');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t('Platform')}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{t('Platform Settings')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('Configure global SaaS security policies, multi-tenancy enforcement, and infrastructure parameters.')}
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          {/* Tenant Security & Isolation */}
          <Card className="border-border bg-card/70">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Shield className="size-4 text-primary" />
                {t('Multi-Tenancy & Data Security')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{t('Strict Tenant Query Filtering')}</p>
                  <p className="text-muted-foreground text-[11px]">
                    {t('Enforce server-side tenant isolation on all EF Core queries.')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isolationStrict}
                  onChange={(e) => setIsolationStrict(e.target.checked)}
                  className="size-4 accent-primary"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div>
                  <p className="font-medium text-foreground">{t('API Rate Limiting & Throttling')}</p>
                  <p className="text-muted-foreground text-[11px]">
                    {t('Limit requests to 100 req/min per IP to mitigate brute force.')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={rateLimiting}
                  onChange={(e) => setRateLimiting(e.target.checked)}
                  className="size-4 accent-primary"
                />
              </div>

              <div className="border-t border-border pt-3">
                <label className="block font-medium text-foreground mb-1">
                  {t('JWT Access Token Lifetime (Minutes)')}
                </label>
                <Input
                  value={tokenLifetime}
                  onChange={(e) => setTokenLifetime(e.target.value)}
                  className="max-w-[140px] text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure & Notifications */}
          <Card className="border-border bg-card/70">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Server className="size-4 text-primary" />
                {t('Infrastructure & Delivery')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-2 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">{t('System Database Host')}</label>
                <Input value="SQL Server 2022 (LocalDB / Dedicated)" disabled className="bg-muted/30 text-xs" />
              </div>
              <div>
                <label className="block font-medium text-foreground mb-1">{t('SMTP Relay Endpoint')}</label>
                <Input
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-[11px] text-primary">
                {t('Current Platform Version: TrainHub SaaS MVP v1.0.0 (Release Candidate)')}
              </div>
            </CardContent>
          </Card>
        </div>

        {saved && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            {t('Platform settings successfully saved.')}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" leadingIcon={<Save className="size-4" />}>
            {t('Save settings')}
          </Button>
        </div>
      </form>
    </div>
  );
}
