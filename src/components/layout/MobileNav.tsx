import AppSidebar from './AppSidebar';
import type { DashboardRole, NavItem } from '../../types/nav';

type Props = {
  open: boolean;
  role: DashboardRole;
  section: string;
  items: NavItem[];
  active: string;
  onClose: () => void;
  onNavigate: (label: string) => void;
};

export default function MobileNav({ open, role, section, items, active, onClose, onNavigate }: Props) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden" onMouseDown={onClose}>
    <aside role="dialog" aria-modal="true" aria-label="Mobile navigation" className="flex h-full w-72 -translate-x-0 flex-col border-r border-zinc-800 bg-zinc-950 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">TH</span><span className="text-sm font-semibold text-white">TrainHub</span></div>
        <button type="button" onClick={onClose} aria-label="Close navigation" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white">×</button>
      </div>
      <AppSidebar role={role} section={section} items={items} active={active} mobile onNavigate={onNavigate} />
      <div className="border-t border-zinc-800 px-4 py-3 text-[11px] text-zinc-500"><p className="text-zinc-300">Multi-Tenant Training Suite</p><p>TrainHub workspace</p></div>
    </aside>
  </div>;
}
