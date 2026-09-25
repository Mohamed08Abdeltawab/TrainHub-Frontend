import { useEffect, useState, useMemo } from 'react';
import type { NavItem } from '../../types/nav';
import LayoutIcon from './LayoutIcon';
import {
  Button,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui';
import { Search, CornerDownLeft, Compass } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

type Props = {
  items: NavItem[];
  onNavigate: (label: string) => void;
};

export default function HeaderSearch({ items, onNavigate }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  // Detect platform for appropriate keyboard shortcut label (Mac vs Windows/Linux)
  const isMac = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /macintosh|mac os x/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((curr) => !curr);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (label: string) => {
    onNavigate(label);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile Trigger Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={t('Search sections...')}
        className="size-9 text-muted-foreground hover:text-foreground md:hidden"
      >
        <Search className="size-4" aria-hidden="true" />
      </Button>

      {/* Desktop Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="group hidden h-9 items-center gap-2 rounded-lg border border-border bg-card/60 px-3 text-xs text-muted-foreground shadow-sm transition hover:border-border/80 hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
      >
        <Search className="size-3.5 transition-colors group-hover:text-primary" aria-hidden="true" />
        <span className="font-normal">{t('Search sections...')}</span>
        <kbd className="pointer-events-none ms-2 inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted/70 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </button>

      {/* Command Palette Modal */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t('Quick Navigation')}
        description={t('Search and jump to workspace sections available for your role.')}
      >
        <CommandInput placeholder={t('Search workspace sections...')} />
        <CommandList>
          <CommandEmpty className="flex flex-col items-center justify-center gap-2 py-8 text-center text-xs text-muted-foreground">
            <Compass className="size-6 text-muted-foreground/60" />
            <p>{t('No matching workspace sections found.')}</p>
          </CommandEmpty>

          <CommandGroup heading={t('Available Sections')}>
            {items.map((item) => (
              <CommandItem
                key={item.label}
                value={item.label}
                onSelect={() => handleSelect(item.label)}
                className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-muted"
              >
                <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <LayoutIcon icon={item.icon} className="size-3.5" />
                </span>
                <span className="flex-1 font-medium text-foreground">{t(item.label)}</span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground opacity-0 transition group-hover:opacity-100">
                  {t('Select')} <CornerDownLeft className="size-3" />
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>

        <CommandSeparator />

        <div className="flex items-center justify-between px-3 py-2 text-[10px] text-muted-foreground">
          <span>{t('Sections accessible based on active role')}</span>
          <div className="hidden items-center gap-2 sm:flex">
            <span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px]">ESC</kbd> {t('to close')}
            </span>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}
