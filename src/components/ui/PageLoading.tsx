import { Loader2 } from 'lucide-react';

export default function PageLoading({ label = 'Loading page...' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[240px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card/40 p-8 text-sm text-muted-foreground"
    >
      <Loader2 className="size-8 animate-spin text-primary" />
      <span>{label}</span>
    </div>
  );
}
