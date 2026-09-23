import { forwardRef, useId, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string;
  description?: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(function Input({ id, label, description, error, className = '', 'aria-describedby': describedBy, ...props }, ref) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedByIds = [describedBy, descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return <div className="space-y-1.5">
    <label htmlFor={inputId} className="block text-xs font-medium text-zinc-300">{label}</label>
    <input {...props} ref={ref} id={inputId} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={describedByIds} className={`h-10 w-full rounded-lg border bg-zinc-900 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${error ? 'border-rose-500/70 focus:border-rose-400 focus:ring-rose-500/20' : 'border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500/20'} ${className}`} />
    {description && <p id={descriptionId} className="text-[11px] text-zinc-500">{description}</p>}
    {error && <p id={errorId} role="alert" className="text-[11px] text-rose-300">{error}</p>}
  </div>;
});

export default Input;
