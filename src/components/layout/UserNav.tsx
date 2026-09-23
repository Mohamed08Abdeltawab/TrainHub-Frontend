import { roleLabels } from '../../config/navigation';
import type { DashboardRole } from '../../types/nav';

const roles: DashboardRole[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'INSTRUCTOR', 'STUDENT'];

type Props = {
  role: DashboardRole;
  roleMenuOpen: boolean;
  profileMenuOpen: boolean;
  onToggleRoleMenu: () => void;
  onToggleProfileMenu: () => void;
  onSelectRole: (role: DashboardRole) => void;
};

export default function UserNav({ role, roleMenuOpen, profileMenuOpen, onToggleRoleMenu, onToggleProfileMenu, onSelectRole }: Props) {
  return <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
    <div className="relative">
      <button type="button" onClick={onToggleRoleMenu} aria-expanded={roleMenuOpen} aria-haspopup="menu" className="flex h-9 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-200 shadow-sm transition hover:border-zinc-700 hover:bg-zinc-800">
        <span className="text-indigo-400" aria-hidden="true">☷</span><span className="hidden font-mono text-[11px] text-zinc-400 sm:inline">Role:</span>
        <span className="font-semibold text-indigo-300">{role}</span><span className="text-zinc-500" aria-hidden="true">⌄</span>
      </button>
      {roleMenuOpen && <div role="menu" className="absolute right-0 top-11 z-40 w-60 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl">
        <p className="border-b border-zinc-800 px-2.5 py-2 text-[11px] text-zinc-500">Switch role context (demo)</p>
        {roles.map((option) => <button type="button" role="menuitemradio" aria-checked={role === option} key={option} onClick={() => onSelectRole(option)} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-zinc-300 transition hover:bg-zinc-900 hover:text-white">
          <span>{roleLabels[option]}</span><span className="text-indigo-300">{role === option ? '✓' : ''}</span>
        </button>)}
      </div>}
    </div>
    <div className="relative">
      <button type="button" onClick={onToggleProfileMenu} aria-label="Open user profile" aria-expanded={profileMenuOpen} aria-haspopup="dialog" className="grid h-9 w-9 place-items-center rounded-full bg-indigo-600 text-xs font-semibold text-white ring-2 ring-indigo-500/15 transition hover:ring-indigo-400/50">AM</button>
      {profileMenuOpen && <section aria-label="User profile" className="absolute right-0 top-11 z-40 w-64 rounded-xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-600 text-xs font-semibold text-white">AM</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-white">Alex Morgan</p><p className="truncate text-[11px] text-zinc-500">alex.morgan@example.com</p></div></div>
        <div className="pt-3"><p className="text-[10px] uppercase tracking-wider text-zinc-500">Current role</p><p className="mt-1 text-xs font-medium text-indigo-300">{roleLabels[role]}</p><p className="mt-2 text-[10px] leading-4 text-zinc-600">Profile details are demo content until authentication is connected.</p></div>
      </section>}
    </div>
  </div>;
}
