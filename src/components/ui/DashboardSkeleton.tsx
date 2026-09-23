import Skeleton from './Skeleton';

export default function DashboardSkeleton() {
  return <section aria-label="Loading dashboard" aria-busy="true" className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"><div className="flex items-center justify-between"><Skeleton className="h-3 w-24"/><Skeleton className="h-8 w-8 rounded-lg"/></div><Skeleton className="h-7 w-20"/><Skeleton className="h-3 w-32"/></div>)}</div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]"><div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"><Skeleton className="h-4 w-40"/><Skeleton className="h-3 w-56"/>{Array.from({ length: 3 }, (_, index) => <div key={index} className="flex items-center gap-3 rounded-lg border border-zinc-800 p-3"><Skeleton className="h-9 w-9 rounded-lg"/><div className="flex-1 space-y-2"><Skeleton className="h-3 w-2/5"/><Skeleton className="h-3 w-3/5"/></div><Skeleton className="h-5 w-16 rounded-full"/></div>)}</div><div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"><Skeleton className="h-4 w-32"/><Skeleton className="h-3 w-48"/>{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-3 w-full"/>)}</div></div>
    <span className="sr-only">Loading dashboard content...</span>
  </section>;
}
