import { useEffect, useState, type FormEvent } from 'react';
import { Building2, CheckCircle2, Globe2, MapPin, Save } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageContext';

type Profile = { name: string; email: string; phone: string; website: string; address: string; description: string };
const emptyProfile: Profile = { name: '', email: '', phone: '', website: '', address: '', description: '' };

export default function OrganizationProfile({ defaultName }: { defaultName: string }) {
  const { orgId = 'demo' } = useParams();
  const { t } = useLanguage();
  const storageKey = `trainhub.organization.${orgId}.profile`;
  const [profile, setProfile] = useState<Profile>({ ...emptyProfile, name: defaultName });
  const [saved, setSaved] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    setProfile({ ...emptyProfile, name: defaultName });
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setProfile({ ...emptyProfile, name: defaultName, ...parsed as Partial<Profile> });
        }
      }
    } catch { setStorageError(true); }
  }, [defaultName, storageKey]);

  const update = (key: keyof Profile, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStorageError(false);
    try {
      localStorage.setItem(storageKey, JSON.stringify(profile));
      setSaved(true);
    } catch { setStorageError(true); setSaved(false); }
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t('Organization settings')}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{t('Organization profile')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('Manage the public details and contact information for your training center.')}</p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="border-border bg-card/70">
          <CardHeader className="border-b border-border px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-sm"><Building2 className="size-4 text-primary" />{t('Center information')}</CardTitle>
            <CardDescription>{t('These details help learners identify and contact your organization.')}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 py-5">
            <form className="space-y-5" onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label={t('Organization name')} required minLength={2} maxLength={100} value={profile.name} onChange={(event) => update('name', event.target.value)} placeholder={t('Enter organization name')} />
                <Input label={t('Contact email')} required type="email" maxLength={254} value={profile.email} onChange={(event) => update('email', event.target.value)} placeholder="hello@trainingcenter.com" />
                <Input label={t('Phone number')} type="tel" maxLength={30} value={profile.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+20 100 000 0000" />
                <Input label={t('Website')} type="url" maxLength={200} value={profile.website} onChange={(event) => update('website', event.target.value)} placeholder="https://example.com" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground" htmlFor="organization-address">{t('Address')}</label>
                <div className="relative"><MapPin className="pointer-events-none absolute start-3 top-3 size-4 text-muted-foreground" /><Input id="organization-address" className="ps-9" maxLength={180} value={profile.address} onChange={(event) => update('address', event.target.value)} placeholder={t('Street, city, country')} /></div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground" htmlFor="organization-description">{t('About the center')}</label>
                <Textarea id="organization-description" rows={4} maxLength={500} value={profile.description} onChange={(event) => update('description', event.target.value)} placeholder={t('A short introduction to your training center')} />
                <p className="text-end text-[11px] text-muted-foreground">{profile.description.length}/500</p>
              </div>
              {(saved || storageError) && <p role="status" className={`flex items-center gap-2 text-xs ${saved ? 'text-emerald-500' : 'text-destructive'}`}>{saved ? <CheckCircle2 className="size-4" /> : null}{t(saved ? 'Organization profile saved.' : 'Could not save your changes. Check browser storage and try again.')}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-[11px] text-muted-foreground">{t('Required fields are marked by your browser.')}</p>
                <Button type="submit" leadingIcon={<Save className="size-4" />}>{t('Save changes')}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit border-border bg-card/70">
          <CardHeader className="px-5 pb-3 pt-5"><div className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary"><Building2 className="size-5" /></div><CardTitle className="mt-3 text-base">{profile.name || t('Your training center')}</CardTitle><CardDescription>{t('Organization profile preview')}</CardDescription></CardHeader>
          <CardContent className="space-y-3 px-5 pb-5 text-xs text-muted-foreground">
            <div className="flex items-start gap-2"><Globe2 className="mt-0.5 size-3.5 shrink-0" /><span className="break-all">{profile.website || t('Add a website to your profile')}</span></div>
            <div className="flex items-start gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0" /><span>{profile.address || t('Add your center address')}</span></div>
            <p className="border-t border-border pt-3 leading-5">{profile.description || t('Your center introduction will appear here.')}</p>
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-[11px]">{t('Organization ID')}: <span className="font-mono text-foreground">{orgId}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
