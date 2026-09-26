import { roleLabels } from '../../config/navigation';
import type { DashboardRole, NavItem } from '../../types/nav';
import LayoutIcon from './LayoutIcon';
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '../../i18n/LanguageContext';

type Props = {
  role: DashboardRole;
  section: string;
  items: NavItem[];
  active: string;
  collapsed?: boolean;
  mobile?: boolean;
  onCollapse?: () => void;
  onNavigate: (label: string) => void;
};

export default function AppSidebar({
  role,
  section,
  items,
  active,
  collapsed = false,
  mobile = false,
  onCollapse,
  onNavigate,
}: Props) {
  const { t, direction } = useLanguage();
  const showLabels = mobile || !collapsed;
  const groups = items.reduce<{ label: string; items: NavItem[] }[]>((result, item) => {
    const label = item.group ?? '';
    const previous = result[result.length - 1];
    if (previous?.label === label) previous.items.push(item);
    else result.push({ label, items: [item] });
    return result;
  }, []);
  const brandMark = (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-violet-700 font-extrabold tracking-tight text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/10 transition-transform duration-200',
        collapsed && !mobile ? 'size-8 text-xs' : 'size-9 text-base'
      )}
    >
      TH
    </span>
  );

  return (
    <>
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-border',
          collapsed && !mobile ? 'justify-center px-2' : 'gap-3 px-4'
        )}
      >
        {collapsed && !mobile ? (
          <button
            type="button"
            onClick={onCollapse}
            aria-label={t('Expand sidebar')}
            title={t('Expand sidebar')}
            className="group grid size-10 shrink-0 place-items-center rounded-xl transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {brandMark}
            <span className="sr-only">{t('Expand sidebar')}</span>
          </button>
        ) : (
          brandMark
        )}
        {showLabels && (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">TrainHub</span>
              <Badge variant="default" className="px-1.5 py-0 text-[9px] uppercase tracking-wider">
                SaaS
              </Badge>
            </div>
            <p className="truncate text-[11px] text-muted-foreground">{t('Training Center Engine')}</p>
          </div>
        )}
        {!mobile && !collapsed && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label={t('Collapse sidebar')}
            title={t('Collapse sidebar')}
            className="group ms-auto grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-card/60 text-muted-foreground shadow-sm transition hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className={cn('size-4 transition-transform duration-200 group-hover:-translate-x-0.5', direction === 'rtl' && 'rotate-180')} />
          </button>
        )}
      </div>

      <nav aria-label={t('Main navigation')} className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {showLabels && (
          <h2 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t(section)}
          </h2>
        )}
        {groups.map((group, groupIndex) => (
          <div key={`${group.label || 'default'}-${groupIndex}`} role="group" aria-label={group.label ? t(group.label) : undefined} className={groupIndex ? 'mt-4 border-t border-border/70 pt-3' : ''}>
            {group.label && showLabels && <h3 className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">{t(group.label)}</h3>}
            {group.items.map((item) => {
              const isActive = active === item.label;
              const buttonElement = (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => onNavigate(item.label)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-start text-xs font-medium transition',
                    isActive
                      ? 'bg-muted text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    !showLabels && 'justify-center px-0'
                  )}
                >
                  <LayoutIcon
                    icon={item.icon}
                    className={cn('size-4 shrink-0 transition-colors', isActive ? 'text-primary' : 'group-hover:text-primary')}
                  />
                  {showLabels && <span className="truncate">{t(item.label)}</span>}
                </button>
              );

              if (!showLabels) {
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger render={buttonElement} />
                    <TooltipContent side={direction === 'rtl' ? 'left' : 'right'} className="text-xs">
                      {t(item.label)}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return buttonElement;
            })}
          </div>
        ))}
      </nav>

      {showLabels && (
        <div className="shrink-0 border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card/60 p-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <LayoutIcon icon={role === 'STUDENT' ? 'learners' : 'organization'} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('Active context')}</p>
              <p className="truncate text-xs font-semibold text-foreground">{t(roleLabels[role])}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
