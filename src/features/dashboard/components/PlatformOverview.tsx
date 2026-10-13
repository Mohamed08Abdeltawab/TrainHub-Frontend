import type { DashboardContent } from '@/types/nav';
import DashboardOverview from './DashboardOverview';

type PlatformOverviewProps = {
  content: DashboardContent;
  onOpenPrimarySection: (targetLabel?: string) => void;
};

export default function PlatformOverview({
  content,
  onOpenPrimarySection,
}: PlatformOverviewProps) {
  return (
    <div className="space-y-6">
      <DashboardOverview
        content={content}
        onOpenPrimarySection={onOpenPrimarySection}
      />
    </div>
  );
}
