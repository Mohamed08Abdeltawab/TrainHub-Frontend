import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { demoUsers } from '../config/demoUsers';
import { Alert, Button } from '@/components/ui';
import { useLanguage } from '../i18n/LanguageContext';

export default function OrganizationTenantGuard({ children }: { children: ReactNode }) {
  const { orgId } = useParams();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  const isPlatformAdmin = user?.role === 'SUPER_ADMIN';
  const isDemoTenant = user?.demo === true && orgId === 'demo';
  const hasTenantAccess = isPlatformAdmin || isDemoTenant || Boolean(
    user && !user.demo && user.role === 'ORG_ADMIN' && user.organizationId && user.organizationId === orgId,
  );

  if (hasTenantAccess) return <>{children}</>;

  const homePath = user?.role === 'ORG_ADMIN' && user.organizationId
    ? `/admin/organizations/${encodeURIComponent(user.organizationId)}/overview`
    : demoUsers[user?.role ?? 'ORG_ADMIN'].path;

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <div className="w-full max-w-lg space-y-4">
        <Alert variant="error" title={t('Organization access unavailable')}>
          {user?.role === 'ORG_ADMIN' && !user.organizationId
            ? t('Your account is not linked to an organization. Contact your platform administrator.')
            : t('You do not have access to this organization. Choose an organization assigned to your account.')}
        </Alert>
        <div className="flex items-center gap-3">
          <Link to={homePath} className="inline-flex h-9 items-center rounded-lg border border-border px-3.5 text-xs font-medium text-foreground hover:bg-muted">{t('Return to your workspace')}</Link>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            {t('Sign out')}
          </Button>
        </div>
      </div>
    </main>
  );
}
