import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode; description?: string; error?: string };

const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox({ id, label, description, error, className = '', ...props }, ref) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return <div className="space-y-1.5">
    <label htmlFor={inputId} className="flex cursor-pointer items-start gap-2.5 text-xs text-zinc-300">
      <input {...props} ref={ref} id={inputId} type="checkbox" aria-invalid={error ? true : props['aria-invalid']} aria-describedby={describedBy} className={`mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-700 bg-zinc-900 accent-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${className}`} />
      <span>{label}</span>
    </label>
    {description && <p id={descriptionId} className="pl-6 text-[11px] text-zinc-500">{description}</p>}
    {error && <p id={errorId} role="alert" className="pl-6 text-[11px] text-rose-300">{error}</p>}
  </div>;
});

export default Checkbox;
