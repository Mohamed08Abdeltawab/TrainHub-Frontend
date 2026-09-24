import { useEffect, useState } from 'react';
import type { NavItem } from '../../types/nav';
import LayoutIcon from './LayoutIcon';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui';
import { Search } from 'lucide-react';

export default function HeaderSearch({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate: (label: string) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((curr) => !curr);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const choose = (label: string) => {
    onNavigate(label);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card/60 px-3 text-xs text-muted-foreground shadow-sm transition hover:border-border/80 hover:bg-muted/50 hover:text-foreground md:flex"
      >
        <Search className="size-3.5" aria-hidden="true" />
        <span>Search sections...</span>
        <kbd className="ml-2 rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          Ctrl K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search workspace sections"
        description="Navigate to workspace sections available for your role."
      >
        <CommandInput placeholder="Search available sections..." />
        <CommandList>
          <CommandEmpty>No sections match your search.</CommandEmpty>
          <CommandGroup heading="Available Sections">
            {items.map((item) => (
              <CommandItem
                key={item.label}
                value={item.label}
                onSelect={() => choose(item.label)}
                className="cursor-pointer gap-3 py-2.5"
              >
                <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
                  <LayoutIcon icon={item.icon} className="size-3.5" />
                </span>
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">Open</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
