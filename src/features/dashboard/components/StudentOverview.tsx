import type { DashboardContent } from '@/types/nav';
import DashboardOverview from './DashboardOverview';

type StudentOverviewProps = {
  content: DashboardContent;
  onOpenPrimarySection: (targetLabel?: string) => void;
};

export default function StudentOverview({
  content,
  onOpenPrimarySection,
}: StudentOverviewProps) {
  return (
    <div className="space-y-6">
      <DashboardOverview
        content={content}
        onOpenPrimarySection={onOpenPrimarySection}
      />
    </div>
  );
}
