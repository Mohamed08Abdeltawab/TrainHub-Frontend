import LayoutIcon from './LayoutIcon';

export default function OrgBadge({ tenant, plan }: { tenant: string; plan: string }) {
  return <div className="flex min-w-0 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1.5 text-xs text-zinc-200">
    <LayoutIcon icon="organization" className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
    <span className="max-w-[155px] truncate font-medium text-white sm:max-w-[200px]">{tenant}</span>
    <span className="hidden rounded border border-indigo-500/30 bg-indigo-500/15 px-1.5 py-0.5 text-[10px] text-indigo-300 sm:inline-block">{plan}</span>
  </div>;
}
