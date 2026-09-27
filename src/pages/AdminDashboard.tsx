import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../auth/AuthContext';

export default function AdminDashboard() {
  const { orgId } = useParams();
  const { user } = useAuth();
  const basePath = `/admin/organizations/${orgId ?? 'demo'}`;
  const [tenantName, setTenantName] = useState('');

  useEffect(() => {
    if (user?.role !== 'ORG_ADMIN' || !orgId) {
      setTenantName('');
      return;
    }
    const readName = () => {
      try {
        const profile = JSON.parse(localStorage.getItem(`trainhub.organization.${orgId}.profile`) ?? 'null') as { name?: unknown } | null;
        setTenantName(typeof profile?.name === 'string' && profile.name.trim() ? profile.name.trim() : orgId === 'demo' ? 'Al-Amal Training Center' : `Training Center (${orgId})`);
      } catch {
        setTenantName(orgId === 'demo' ? 'Al-Amal Training Center' : `Training Center (${orgId})`);
      }
    };
    readName();
    const onProfileUpdate = (event: Event) => {
      if ((event as CustomEvent<{ orgId?: string }>).detail?.orgId === orgId) readName();
    };
    window.addEventListener('trainhub:organization-profile-updated', onProfileUpdate);
    return () => window.removeEventListener('trainhub:organization-profile-updated', onProfileUpdate);
  }, [orgId, user?.role]);

  return (
    <DashboardLayout initialRole={user?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ORG_ADMIN'} basePath={basePath} tenantName={tenantName || undefined}>
      {orgId && <p className="mt-4 text-[11px] text-muted-foreground/80">Organization ID: {orgId}</p>}
    </DashboardLayout>
  );
}
