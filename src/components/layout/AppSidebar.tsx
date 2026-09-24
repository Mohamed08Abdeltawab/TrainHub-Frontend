import { roleLabels } from '../../config/navigation';
import type { DashboardRole, NavItem } from '../../types/nav';
import LayoutIcon from './LayoutIcon';

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

export default function AppSidebar({ role, section, items, active, collapsed = false, mobile = false, onCollapse, onNavigate }: Props) {
  const showLabels = mobile || !collapsed;
  const brandMark = <span className={`grid shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-700 font-extrabold tracking-tight text-white shadow-lg shadow-indigo-600/25 ring-1 ring-white/10 transition-transform duration-200 ${collapsed && !mobile ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-base'}`}>TH</span>;
  return <>
    <div className={`flex h-16 shrink-0 items-center border-b border-zinc-800/80 ${collapsed && !mobile ? 'justify-center px-2' : 'gap-3 px-4'}`}>
      {collapsed && !mobile
        ? <button type="button" onClick={onCollapse} aria-label="Expand sidebar" title="Expand sidebar" className="group grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors hover:bg-zinc-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">{brandMark}<span className="sr-only">Expand sidebar</span></button>
        : brandMark}
      {showLabels && <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><span className="text-sm font-semibold text-white">TrainHub</span><span className="rounded border border-indigo-500/30 bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-300">SaaS</span></div><p className="truncate text-[11px] text-zinc-500">Training Center Engine</p></div>}
      {!mobile && !collapsed && <button type="button" onClick={onCollapse} aria-label="Collapse sidebar" title="Collapse sidebar" className="group ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-800/80 bg-zinc-900/70 text-zinc-400 shadow-sm transition duration-200 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
        <svg className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 18-6-6 6-6"/><path d="M20 5v14"/></svg>
      </button>}
    </div>
    <nav aria-label="Main navigation" className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {showLabels && <h2 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{section}</h2>}
      {items.map((item) => <button type="button" key={item.label} onClick={() => onNavigate(item.label)} title={!showLabels ? item.label : undefined} aria-current={active === item.label ? 'page' : undefined} className={`group flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-xs font-medium transition ${active === item.label ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'} ${!showLabels ? 'justify-center px-0' : ''}`}>
        <LayoutIcon icon={item.icon} className={`h-4 w-4 shrink-0 ${active === item.label ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`} />{showLabels && <span className="truncate">{item.label}</span>}
      </button>)}
    </nav>
    {showLabels && <div className="shrink-0 border-t border-zinc-800/80 p-3"><div className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/80 p-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-indigo-500/10 text-indigo-300"><LayoutIcon icon={role === 'STUDENT' ? 'learners' : 'organization'} /></span>
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Active context</p><p className="truncate text-xs font-semibold text-zinc-200">{roleLabels[role]}</p></div>
    </div></div>}
  </>;
}
