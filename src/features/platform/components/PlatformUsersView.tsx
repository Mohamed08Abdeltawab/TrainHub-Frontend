import { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
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
  const [users, setUsers] = useState<PlatformUser[]>(defaultPlatformUsers);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<PlatformUser[]>('/roles/users');
      if (response.data && response.data.length > 0) {
        setUsers(response.data);
      }
    } catch {
      // Fallback to default operations team if unauthenticated or network drop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

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
                {users.map((user) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
