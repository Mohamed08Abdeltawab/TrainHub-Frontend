import AppSidebar from './AppSidebar';
import type { DashboardRole, NavItem } from '../../types/nav';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui';
import { useLanguage } from '../../i18n/LanguageContext';

type Props = {
  open: boolean;
  role: DashboardRole;
  section: string;
  items: NavItem[];
  active: string;
  onClose: () => void;
  onNavigate: (label: string) => void;
};

export default function MobileNav({
  open,
  role,
  section,
  items,
  active,
  onClose,
  onNavigate,
}: Props) {
  const { direction, t } = useLanguage();
  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent
        side={direction === 'rtl' ? 'right' : 'left'}
        className="flex w-72 flex-col gap-0 border-r border-border bg-card p-0 md:hidden rtl:border-l rtl:border-r-0"
      >
        <SheetHeader className="flex h-16 shrink-0 flex-row items-center border-b border-border px-4 py-0 space-y-0">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              TH
            </span>
            <SheetTitle className="text-sm font-semibold text-foreground">TrainHub</SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          <AppSidebar
            role={role}
            section={section}
            items={items}
            active={active}
            mobile
            onNavigate={(label) => {
              onNavigate(label);
              onClose();
            }}
          />
        </div>

        <div className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
          <p className="font-medium text-foreground">{t('Multi-Tenant Training Suite')}</p>
          <p>{t('TrainHub workspace')}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
