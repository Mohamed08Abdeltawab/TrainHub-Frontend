import { useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';

export default function AdminDashboard() {
  const { orgId } = useParams();
  return (
    <DashboardLayout initialRole="ORG_ADMIN">
      {orgId && <p className="mt-4 text-[11px] text-muted-foreground/80">Organization ID: {orgId}</p>}
    </DashboardLayout>
  );
}
