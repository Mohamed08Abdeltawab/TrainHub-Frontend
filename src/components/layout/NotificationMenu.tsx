import { useState } from 'react';
import type { NavItem } from '../../types/nav';
import { Popover, PopoverContent, PopoverTrigger, Button } from '@/components/ui';
import { Bell } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function NotificationMenu({
  open,
  onToggle,
  items,
  onNavigate,
}: {
  open: boolean;
  onToggle: () => void;
  items: NavItem[];
  onNavigate: (label: string) => void;
}) {
  const { t } = useLanguage();
  const [cleared, setCleared] = useState(false);
  const activityItem =
    items.find((item) => /assignments|reports|courses/i.test(item.label)) ?? items[0];
  const notices = [
    {
      id: 'activity',
      title: 'Workspace activity',
      detail: 'There are recent updates to review.',
      target: activityItem,
    },
    {
      id: 'summary',
      title: 'Your overview is ready',
      detail: 'Check the latest workspace summary.',
      target: items.find((item) => item.label === 'Overview'),
    },
  ].filter((notice) => notice.target);

  return (
    <Popover open={open} onOpenChange={(nextOpen) => { if (nextOpen !== open) onToggle(); }}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid size-9 place-items-center rounded-lg border border-transparent text-muted-foreground transition hover:border-border hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Bell className="size-4" />
            {!cleared && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full border border-background bg-primary" />
            )}
          </button>
        }
      />
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-2 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-2.5 py-2">
          <div>
            <h2 className="text-xs font-semibold text-foreground">{t('Notifications')}</h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{t('Workspace updates')}</p>
          </div>
          {!cleared && (
            <button
              type="button"
              onClick={() => setCleared(true)}
              className="text-[10px] font-medium text-primary hover:underline"
            >
              {t('Mark all read')}
            </button>
          )}
        </div>
        {!cleared && notices.length > 0 ? (
          <div className="py-1">
            {notices.map((notice) => (
              <button
                type="button"
                key={notice.id}
                onClick={() => {
                  if (notice.target) {
                    onNavigate(notice.target.label);
                    onToggle();
                  }
                }}
                className="flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-start transition hover:bg-muted"
              >
                <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                <span>
                  <span className="block text-xs font-medium text-foreground">
                    {notice.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">
                    {notice.detail}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            {t('You’re all caught up.')}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
