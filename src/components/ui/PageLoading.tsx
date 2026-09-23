import Spinner from './Spinner';

export default function PageLoading({ label = 'Loading page...' }: { label?: string }) {
  return <div role="status" aria-live="polite" className="flex min-h-[240px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-sm text-zinc-400">
    <Spinner size="lg" label={label} /><span>{label}</span>
  </div>;
}
