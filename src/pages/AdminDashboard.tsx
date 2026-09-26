import { useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../auth/AuthContext';

export default function AdminDashboard() {
  const { orgId } = useParams();
  const { user } = useAuth();
  const basePath = `/admin/organizations/${orgId ?? 'demo'}`;
  return (
    <DashboardLayout initialRole={user?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ORG_ADMIN'} basePath={basePath}>
      {orgId && <p className="mt-4 text-[11px] text-muted-foreground/80">Organization ID: {orgId}</p>}
    </DashboardLayout>
  );
}
