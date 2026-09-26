import { useState, type FormEvent } from 'react';
import { CheckCircle2, Mail, Save, UserRound } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea } from '@/components/ui';
import { useAuth } from '@/auth/AuthContext';
import { roleLabels } from '@/config/navigation';
import { useLanguage } from '@/i18n/LanguageContext';

export default function UserProfile() {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name ?? '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [timezone, setTimezone] = useState(user?.timezone ?? 'Africa/Cairo');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(false);
    const success = updateProfile({ name: name.trim(), jobTitle: jobTitle.trim(), phone: phone.trim(), timezone, bio: bio.trim() });
    setSaved(success);
    setError(!success);
  };

  return <div className="space-y-5">
    <header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t('Account')}</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{t('User profile')}</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('Manage your personal details and how you appear in TrainHub.')}</p></header>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <Card className="border-border bg-card/70"><CardHeader className="border-b border-border px-5 py-4"><CardTitle className="flex items-center gap-2 text-sm"><UserRound className="size-4 text-primary" />{t('Personal information')}</CardTitle><CardDescription>{t('Your name and contact details are visible to your organization.')}</CardDescription></CardHeader><CardContent className="px-5 py-5">
        <form onSubmit={submit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('Full name')} required minLength={2} maxLength={80} value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} />
          <Input label={t('Email address')} type="email" value={user?.email ?? ''} disabled description={t('Email address cannot be changed here.')} />
          <Input label={t('Job title')} maxLength={80} value={jobTitle} onChange={(event) => { setJobTitle(event.target.value); setSaved(false); }} placeholder={t('For example, Training manager')} />
          <Input label={t('Phone number')} type="tel" maxLength={30} value={phone} onChange={(event) => { setPhone(event.target.value); setSaved(false); }} placeholder="+20 100 000 0000" />
        </div>
        <label className="block space-y-1.5 text-xs font-medium text-foreground">{t('Time zone')}<select value={timezone} onChange={(event) => { setTimezone(event.target.value); setSaved(false); }} className="h-10 w-full rounded-lg border border-border bg-input/40 px-3 text-sm text-foreground"><option value="Africa/Cairo">Cairo (UTC+02:00)</option><option value="Europe/London">London (UTC+00:00)</option><option value="America/New_York">New York (UTC−05:00)</option></select></label>
        <div className="space-y-1.5"><label htmlFor="user-bio" className="block text-xs font-medium text-foreground">{t('About me')}</label><Textarea id="user-bio" rows={4} maxLength={300} value={bio} onChange={(event) => { setBio(event.target.value); setSaved(false); }} placeholder={t('Add a short introduction')} /><p className="text-end text-[11px] text-muted-foreground">{bio.length}/300</p></div>
        {(saved || error) && <p role="status" className={`flex items-center gap-2 text-xs ${saved ? 'text-emerald-500' : 'text-destructive'}`}>{saved ? <CheckCircle2 className="size-4" /> : null}{t(saved ? 'Profile changes saved.' : 'Could not save your profile. Check browser storage and try again.')}</p>}
        <div className="flex justify-end border-t border-border pt-4"><Button type="submit" leadingIcon={<Save className="size-4" />}>{t('Save profile')}</Button></div>
        </form>
      </CardContent></Card>
      <Card className="h-fit border-border bg-card/70"><CardHeader className="px-5 pb-3 pt-5"><div className="grid size-12 place-items-center rounded-full bg-primary/15 text-primary"><UserRound className="size-5" /></div><CardTitle className="mt-3 text-base">{name || t('Your profile')}</CardTitle><CardDescription>{user ? t(roleLabels[user.role]) : ''}</CardDescription></CardHeader><CardContent className="space-y-3 px-5 pb-5 text-xs text-muted-foreground"><div className="flex items-center gap-2"><Mail className="size-3.5" />{user?.email}</div>{jobTitle && <p className="text-foreground">{jobTitle}</p>}<p className="border-t border-border pt-3 leading-5">{bio || t('Your introduction will appear here.')}</p></CardContent></Card>
    </div>
  </div>;
}
