import { getErrorPresentation } from '../../utils/errorPresentation';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '../../i18n/LanguageContext';

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
  retryLabel,
  className = '',
}: Props) {
  const { t } = useLanguage();
  const fallback = getErrorPresentation(error);
  const canRetry = Boolean(onRetry);
  const resolvedTitle = title ?? t(fallback.title);
  const resolvedDescription = description ?? t(fallback.description);
  const resolvedRetryLabel = retryLabel ?? t('Try again');

  return (
    <Card
      role="alert"
      aria-live="assertive"
      className={cn('border-destructive/30 bg-destructive/5 p-0', className)}
    >
      <CardContent className="mx-auto flex max-w-lg flex-col items-center py-8 text-center">
        <span className="grid size-11 place-items-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive shadow-sm">
          <AlertCircle className="size-6" />
        </span>
        {fallback.statusCode && (
          <Badge variant="destructive" className="mt-3 text-[10px] font-mono">
            {fallback.statusCode}
          </Badge>
        )}
        <h2 className="mt-3 text-sm font-semibold text-foreground">
          {resolvedTitle}
        </h2>
        <p className="mt-1.5 max-w-md text-xs leading-5 text-muted-foreground">
          {resolvedDescription}
        </p>
        {canRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            leadingIcon={<RotateCcw className="size-3.5" />}
          >
            {resolvedRetryLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
