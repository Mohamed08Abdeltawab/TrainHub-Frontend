import LayoutIcon from './LayoutIcon';
import { Badge } from '@/components/ui';
import { useLanguage } from '../../i18n/LanguageContext';

export default function OrgBadge({ tenant, plan }: { tenant: string; plan: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card/80 px-2.5 py-1.5 text-xs text-foreground shadow-sm">
      <LayoutIcon icon="organization" className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="max-w-[155px] truncate font-medium text-foreground sm:max-w-[200px]">{t(tenant)}</span>
      <Badge variant="default" className="hidden px-1.5 py-0 text-[10px] uppercase tracking-wider sm:inline-flex">
        {t(plan)}
      </Badge>
    </div>
  );
}
