import { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle, Users } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/auth/AuthContext';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import apiClient from '@/api/apiClient';

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  twoFactor: boolean;
  lastLogin?: string | null;
  status: string;
}

const defaultPlatformUsers: PlatformUser[] = [
  {
    id: 'p-1',
    name: 'Jordan Lee',
    email: 'jordan.lee@trainhub.io',
    role: 'Platform Super Admin',
    twoFactor: true,
    lastLogin: 'Today, 10:15 AM',
    status: 'Active',
  },
  {
    id: 'p-2',
    name: 'Samira Vance',
    email: 'samira.vance@trainhub.io',
    role: 'Security & Compliance Officer',
    twoFactor: true,
    lastLogin: 'Yesterday, 4:20 PM',
    status: 'Active',
  },
  {
    id: 'p-3',
    name: 'Alex Rivera',
    email: 'alex.rivera@trainhub.io',
    role: 'Platform Site Reliability Engineer',
    twoFactor: true,
    lastLogin: 'Oct 8, 2026',
    status: 'Active',
  },
  {
    id: 'p-4',
    name: 'Leila Chen',
    email: 'leila.chen@trainhub.io',
    role: 'Operations & Tenant Support Lead',
    twoFactor: true,
    lastLogin: 'Oct 9, 2026',
    status: 'Active',
  },
];

export default function PlatformUsersView() {
  const { t } = useLanguage();
  const { user: authUser } = useAuth();
  const isDemo = Boolean(authUser?.demo);

  const [users, setUsers] = useState<PlatformUser[]>(isDemo ? defaultPlatformUsers : []);
  const [loading, setLoading] = useState(!isDemo);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await apiClient.get<PlatformUser[]>('/roles/users');
      setUsers(response.data || []);
    } catch {
      if (isDemo) {
        setErrorMessage(t('Unable to load live platform operations users. Displaying offline directory.'));
        setUsers(defaultPlatformUsers);
      } else {
        setErrorMessage(t('Unable to load platform operations users. Please check your connection and retry.'));
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isDemo) {
      void fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isDemo]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t('Platform')}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{t('Platform Users & Operations')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('Internal platform administrators and security engineers managing the multi-tenant system.')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          leadingIcon={<RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={() => void fetchUsers()}
        >
          {t('Refresh')}
        </Button>
      </header>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{errorMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
            onClick={() => void fetchUsers()}
          >
            {t('Retry')}
          </Button>
        </div>
      )}

      <Card className="border-border bg-card/70">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-semibold">{t('Platform Operations Team')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="border-b border-border bg-muted/40 text-[11px] font-medium text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-start">{t('User')}</th>
                  <th className="px-4 py-3 text-start">{t('Role')}</th>
                  <th className="px-4 py-3 text-center">{t('2FA Status')}</th>
                  <th className="px-4 py-3 text-center">{t('Last Active')}</th>
                  <th className="px-5 py-3 text-end">{t('Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="size-6 text-muted-foreground/60" />
                        <p>{errorMessage ? t('No user data available due to error.') : t('No platform operations users found.')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-[11px] text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-primary">{user.role}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="size-3.5" /> Enforced
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-muted-foreground">{user.lastLogin || 'N/A'}</td>
                      <td className="px-5 py-3.5 text-end">
                        <Badge variant="success">{t(user.status)}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
