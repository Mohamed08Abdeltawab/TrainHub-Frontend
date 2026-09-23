import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Spinner from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary: 'border border-indigo-500 bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:ring-indigo-400',
  secondary: 'border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 focus-visible:ring-zinc-400',
  outline: 'border border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 focus-visible:ring-indigo-400',
  ghost: 'border border-transparent bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:ring-indigo-400',
  danger: 'border border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 focus-visible:ring-rose-400',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-8 gap-1.5 rounded-md px-2.5 text-xs',
  md: 'min-h-10 gap-2 rounded-lg px-3.5 text-sm',
  lg: 'min-h-11 gap-2 rounded-lg px-4 text-sm',
  icon: 'h-9 w-9 rounded-lg p-0',
};

export default function Button({ variant = 'primary', size = 'md', loading = false, loadingLabel = 'Loading', disabled, leadingIcon, trailingIcon, className = '', children, ...props }: Props) {
  return <button {...props} disabled={disabled || loading} aria-busy={loading || undefined} className={`inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}>
    {loading ? <><Spinner size="sm" label={loadingLabel} /><span>{loadingLabel}</span></> : <>{leadingIcon}{children}{trailingIcon}</>}
  </button>;
}
