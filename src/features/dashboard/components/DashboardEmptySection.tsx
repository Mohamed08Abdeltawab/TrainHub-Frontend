import LayoutIcon from '@/components/layout/LayoutIcon';
import { Button, Card, EmptyState } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageContext';
import type { NavItem } from '@/types/nav';

type DashboardEmptySectionProps = {
  active: string;
  activeItem?: NavItem;
  section: string;
  onNavigateOverview: () => void;
};

export default function DashboardEmptySection({
  active,
  activeItem,
  section,
  onNavigateOverview,
}: DashboardEmptySectionProps) {
  const { t } = useLanguage();

  return (
    <Card aria-live="polite" className="border-border bg-card/60 p-6 sm:p-8">
      <EmptyState
        icon={
          <LayoutIcon
            icon={activeItem?.icon ?? 'overview'}
            className="size-5 text-primary"
          />
        }
        title={t(active)}
        description={`${t('You are viewing the')} ${t(active.toLowerCase())} ${t('section for the')} ${t(section.toLowerCase())} ${t('workspace')}.`}
        action={
          <Button variant="outline" size="sm" onClick={onNavigateOverview}>
            {t('Back to overview')}
          </Button>
        }
      />
    </Card>
  );
}
