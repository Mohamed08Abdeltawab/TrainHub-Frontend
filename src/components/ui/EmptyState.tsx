import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  actionClassName?: string;
};

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  actionClassName,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center px-5 py-10 text-center', className)}
    >
      {icon && (
        <div className="mb-4 grid size-11 place-items-center rounded-xl border border-border bg-card/80 text-primary shadow-sm">
          {icon}
        </div>
      )}
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-1.5 max-w-sm text-xs leading-5 text-muted-foreground">{description}</p>
      {action && <div className={cn('mt-4', actionClassName)}>{action}</div>}
    </div>
  );
}

