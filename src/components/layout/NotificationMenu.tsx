import { useState } from 'react';
import type { NavItem } from '../../types/nav';

export default function NotificationMenu({ open, onToggle, items, onNavigate }: {
  open: boolean;
  onToggle: () => void;
  items: NavItem[];
  onNavigate: (label: string) => void;
}) {
  const [cleared, setCleared] = useState(false);
  const activityItem = items.find((item) => /assignments|reports|courses/i.test(item.label)) ?? items[0];
  const notices = [
    { id: 'activity', title: 'Workspace activity', detail: 'There are recent updates to review.', target: activityItem },
    { id: 'summary', title: 'Your overview is ready', detail: 'Check the latest workspace summary.', target: items.find((item) => item.label === 'Overview') },
  ].filter((notice) => notice.target);

  return <div className="relative">
    <button type="button" onClick={onToggle} aria-label="Notifications" aria-expanded={open} className="relative grid h-9 w-9 place-items-center rounded-lg border border-transparent text-zinc-400 transition hover:border-zinc-800 hover:bg-zinc-900 hover:text-white">
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
      {!cleared && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-zinc-950 bg-indigo-400" />}
    </button>
    {open && <section aria-label="Notifications" className="absolute right-0 top-11 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-800 px-2.5 py-2"><div><h2 className="text-xs font-semibold text-white">Notifications</h2><p className="mt-0.5 text-[10px] text-zinc-500">Workspace updates</p></div>{!cleared && <button type="button" onClick={() => setCleared(true)} className="text-[10px] text-indigo-300 hover:text-indigo-200">Mark all read</button>}</div>
      {!cleared && notices.length > 0 ? <div className="py-1">{notices.map((notice) => <button type="button" key={notice.id} onClick={() => { if (notice.target) onNavigate(notice.target.label); }} className="flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-zinc-900"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-400"/><span><span className="block text-xs font-medium text-zinc-200">{notice.title}</span><span className="mt-1 block text-[11px] leading-4 text-zinc-500">{notice.detail}</span></span></button>)}</div> : <p className="px-3 py-8 text-center text-xs text-zinc-500">You’re all caught up.</p>}
    </section>}
  </div>;
}
