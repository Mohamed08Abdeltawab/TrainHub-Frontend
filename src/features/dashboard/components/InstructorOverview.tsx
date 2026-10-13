import type { DashboardContent } from '@/types/nav';
import DashboardOverview from './DashboardOverview';

type InstructorOverviewProps = {
  content: DashboardContent;
  onOpenPrimarySection: (targetLabel?: string) => void;
};

export default function InstructorOverview({
  content,
  onOpenPrimarySection,
}: InstructorOverviewProps) {
  return (
    <div className="space-y-6">
      <DashboardOverview
        content={content}
        onOpenPrimarySection={onOpenPrimarySection}
      />
    </div>
  );
}
