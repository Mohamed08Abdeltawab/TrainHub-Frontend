import DashboardLayout from '../layouts/DashboardLayout';

export default function PlatformDashboard() {
  return (
    <DashboardLayout
      initialRole="SUPER_ADMIN"
      basePath="/platform"
      tenantName="TrainHub Platform"
    >
      <p className="mt-4 text-[11px] text-muted-foreground/80">Platform Management System</p>
    </DashboardLayout>
  );
}
