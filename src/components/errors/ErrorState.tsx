import { getErrorPresentation } from '../../utils/errorPresentation';
import { Button, Card, CardContent } from '@/components/ui';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  title?: string;
  description?: string;
  error?: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export default function ErrorState({
  title,
  description,
  error,
  onRetry,
  retryLabel = 'Try again',
  className = '',
}: Props) {
  const fallback = getErrorPresentation(error);
  const canRetry = Boolean(onRetry) && fallback.retryable;

  return (
    <Card
      role="alert"
      aria-live="assertive"
      className={cn('border-destructive/30 bg-destructive/5 p-0', className)}
    >
      <CardContent className="mx-auto flex max-w-lg flex-col items-center py-8 text-center">
        <span className="grid size-11 place-items-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" />
        </span>
        <h2 className="mt-4 text-sm font-semibold text-foreground">
          {title ?? fallback.title}
        </h2>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          {description ?? fallback.description}
        </p>
        {canRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            {retryLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
