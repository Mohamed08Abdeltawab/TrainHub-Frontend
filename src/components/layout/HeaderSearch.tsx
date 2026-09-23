import { useEffect, useRef, useState } from 'react';
import type { NavItem } from '../../types/nav';
import LayoutIcon from './LayoutIcon';

export default function HeaderSearch({ items, onNavigate }: { items: NavItem[]; onNavigate: (label: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const results = normalizedQuery
    ? items.filter((item) => item.label.toLocaleLowerCase().includes(normalizedQuery))
    : items;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const choose = (label: string) => {
    onNavigate(label);
    setOpen(false);
    setQuery('');
  };

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="hidden h-9 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 text-xs text-zinc-400 shadow-sm transition hover:border-zinc-700 hover:text-zinc-200 md:flex">
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
      <span>Search sections...</span><kbd className="ml-2 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px]">Ctrl K</kbd>
    </button>
    {open && <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 px-4 pt-[15vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
      <section role="dialog" aria-modal="true" aria-label="Search workspace sections" className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/50" onMouseDown={(event) => event.stopPropagation()}>
        <label className="flex items-center gap-3 border-b border-zinc-800 px-4">
          <svg className="h-4 w-4 shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search available sections..." className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500" />
          <kbd className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500">ESC</kbd>
        </label>
        <div className="max-h-72 overflow-y-auto p-2">
          {results.length > 0 ? results.map((item) => <button type="button" key={item.label} onClick={() => choose(item.label)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-zinc-900 text-indigo-300"><LayoutIcon icon={item.icon} /></span><span className="flex-1">{item.label}</span><span className="text-xs text-zinc-600">Open</span>
          </button>) : <p className="px-3 py-8 text-center text-sm text-zinc-500">No sections match “{query.trim()}”. Try another search.</p>}
        </div>
        <div className="border-t border-zinc-800 px-4 py-2 text-[10px] text-zinc-600">Results are limited to sections available for your role.</div>
      </section>
    </div>}
  </>;
}
