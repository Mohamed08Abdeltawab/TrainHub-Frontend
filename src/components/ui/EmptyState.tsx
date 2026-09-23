import type { ReactNode } from 'react';

export default function EmptyState({ title, description, icon, action }: { title: string; description: string; icon?: ReactNode; action?: ReactNode }) {
  return <div className="flex flex-col items-center px-5 py-10 text-center">
    {icon && <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-indigo-300">{icon}</div>}
    <h2 className="text-sm font-semibold text-white">{title}</h2>
    <p className="mt-1.5 max-w-sm text-xs leading-5 text-zinc-400">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>;
}
