import { getErrorPresentation } from '../../utils/errorPresentation';
import Button from '../ui/Button';

type Props = {
  title?: string;
  description?: string;
  error?: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export default function ErrorState({ title, description, error, onRetry, retryLabel = 'Try again', className = '' }: Props) {
  const fallback = getErrorPresentation(error);
  const canRetry = Boolean(onRetry) && fallback.retryable;

  return <section role="alert" aria-live="assertive" className={`rounded-xl border border-rose-500/25 bg-rose-500/5 p-6 sm:p-8 ${className}`}>
    <div className="mx-auto flex max-w-lg flex-col items-center py-5 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3h.01"/></svg></span>
      <h2 className="mt-4 text-sm font-semibold text-white">{title ?? fallback.title}</h2>
      <p className="mt-1.5 text-xs leading-5 text-zinc-400">{description ?? fallback.description}</p>
      {canRetry && <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">{retryLabel}</Button>}
    </div>
  </section>;
}
