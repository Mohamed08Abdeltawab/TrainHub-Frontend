import type { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'outline';

const styles: Record<BadgeVariant, string> = {
  default: 'border-indigo-500/30 bg-indigo-500/15 text-indigo-300',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  danger: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  outline: 'border-zinc-700 bg-transparent text-zinc-300',
};

export default function Badge({ variant = 'default', className = '', ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span {...props} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-4 ${styles[variant]} ${className}`} />;
}
