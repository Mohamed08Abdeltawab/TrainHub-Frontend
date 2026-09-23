import type { HTMLAttributes, ReactNode } from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';
const styles: Record<AlertVariant, string> = {
  info: 'border-sky-500/25 bg-sky-500/10 text-sky-200',
  success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
  error: 'border-rose-500/25 bg-rose-500/10 text-rose-200',
};

export default function Alert({ variant = 'info', title, children, className = '', ...props }: HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant; title?: string; children: ReactNode }) {
  return <div {...props} role={variant === 'error' ? 'alert' : 'status'} className={`rounded-lg border p-3 text-xs leading-5 ${styles[variant]} ${className}`}>
    {title && <p className="mb-0.5 font-semibold">{title}</p>}{children}
  </div>;
}
