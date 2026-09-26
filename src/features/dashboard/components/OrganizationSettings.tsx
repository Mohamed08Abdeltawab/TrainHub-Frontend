import { useEffect, useState, type FormEvent } from 'react';
import { Bell, CheckCircle2, Languages, Save, ShieldCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageContext';

type Settings = { defaultLanguage: 'en' | 'ar'; timezone: string; enrollmentApproval: boolean; emailNotifications: boolean; weeklySummary: boolean };
const defaults: Settings = { defaultLanguage: 'en', timezone: 'Africa/Cairo', enrollmentApproval: true, emailNotifications: true, weeklySummary: false };

function SettingToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  const { t } = useLanguage();
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border p-4"><span><span className="block text-sm font-medium text-foreground">{t(title)}</span><span className="mt-1 block text-xs text-muted-foreground">{t(description)}</span></span><input type="checkbox" className="size-4 accent-primary" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={t(title)} /></label>;
}

export default function OrganizationSettings() {
  const { orgId = 'demo' } = useParams();
  const { t, setLanguage } = useLanguage();
  const storageKey = `trainhub.organization.${orgId}.settings`;
  const [settings, setSettings] = useState<Settings>(defaults);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setSettings({ ...defaults, ...parsed as Partial<Settings> });
      }
    } catch { setError(true); }
  }, [storageKey]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(false);
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
      setLanguage(settings.defaultLanguage);
      setSaved(true);
    } catch { setSaved(false); setError(true); }
  };

  const update = <Key extends keyof Settings>(key: Key, value: Settings[Key]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  return <div className="space-y-5">
    <header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t('Organization settings')}</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{t('Workspace preferences')}</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('Choose how your organization manages enrollment, communication, and regional preferences.')}</p></header>
    <form onSubmit={submit} className="max-w-4xl space-y-5">
      <Card className="border-border bg-card/70"><CardHeader className="border-b border-border px-5 py-4"><CardTitle className="flex items-center gap-2 text-sm"><Languages className="size-4 text-primary" />{t('Regional preferences')}</CardTitle><CardDescription>{t('Set the default language and time zone for your organization.')}</CardDescription></CardHeader><CardContent className="grid gap-4 px-5 py-5 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-medium text-foreground">{t('Default language')}<select value={settings.defaultLanguage} onChange={(event) => update('defaultLanguage', event.target.value as Settings['defaultLanguage'])} className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm text-foreground"><option value="en">English</option><option value="ar">العربية</option></select></label>
        <label className="space-y-1.5 text-xs font-medium text-foreground">{t('Time zone')}<select value={settings.timezone} onChange={(event) => update('timezone', event.target.value)} className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm text-foreground"><option value="Africa/Cairo">Cairo (UTC+02:00)</option><option value="Europe/London">London (UTC+00:00)</option><option value="America/New_York">New York (UTC−05:00)</option></select></label>
      </CardContent></Card>
      <Card className="border-border bg-card/70"><CardHeader className="border-b border-border px-5 py-4"><CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="size-4 text-primary" />{t('Enrollment and access')}</CardTitle><CardDescription>{t('Control how learners join your training center.')}</CardDescription></CardHeader><CardContent className="space-y-3 px-5 py-5"><SettingToggle title="Require approval for new enrollments" description="Review learner requests before they join a course." checked={settings.enrollmentApproval} onChange={(value) => update('enrollmentApproval', value)} /></CardContent></Card>
      <Card className="border-border bg-card/70"><CardHeader className="border-b border-border px-5 py-4"><CardTitle className="flex items-center gap-2 text-sm"><Bell className="size-4 text-primary" />{t('Notifications')}</CardTitle><CardDescription>{t('Choose which organization updates are sent to administrators.')}</CardDescription></CardHeader><CardContent className="space-y-3 px-5 py-5"><SettingToggle title="Email notifications" description="Receive important enrollment and course updates by email." checked={settings.emailNotifications} onChange={(value) => update('emailNotifications', value)} /><SettingToggle title="Weekly activity summary" description="Get a weekly summary of learner and course activity." checked={settings.weeklySummary} onChange={(value) => update('weeklySummary', value)} /></CardContent></Card>
      {(saved || error) && <p role="status" className={`flex items-center gap-2 text-xs ${saved ? 'text-emerald-500' : 'text-destructive'}`}>{saved ? <CheckCircle2 className="size-4" /> : null}{t(saved ? 'Organization settings saved.' : 'Could not save your changes. Check browser storage and try again.')}</p>}
      <div className="flex justify-end"><Button type="submit" leadingIcon={<Save className="size-4" />}>{t('Save settings')}</Button></div>
    </form>
  </div>;
}
