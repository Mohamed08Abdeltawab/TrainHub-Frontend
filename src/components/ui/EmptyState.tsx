import type { ReactNode } from 'react';

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-5 py-10 text-center">
      {icon && (
        <div className="mb-4 grid size-11 place-items-center rounded-xl border border-border bg-card/80 text-primary shadow-sm">
          {icon}
        </div>
      )}
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-1.5 max-w-sm text-xs leading-5 text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
