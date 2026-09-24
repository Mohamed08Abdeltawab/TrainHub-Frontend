import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

export type SelectOption = { label: string; value: string; disabled?: boolean };
type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & { label: string; options: SelectOption[]; placeholder?: string; description?: string; error?: string };

const Select = forwardRef<HTMLSelectElement, Props>(function Select({ id, label, options, placeholder, description, error, className = '', 'aria-describedby': describedBy, ...props }, ref) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const descriptionId = description ? `${selectId}-description` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedByIds = [describedBy, descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return <div className="space-y-1.5">
    <label htmlFor={selectId} className="block text-xs font-medium text-zinc-300">{label}</label>
    <select {...props} ref={ref} id={selectId} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={describedByIds} className={`h-10 w-full rounded-lg border bg-zinc-900 px-3 text-sm text-white outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${error ? 'border-rose-500/70 focus:border-rose-400 focus:ring-rose-500/20' : 'border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500/20'} ${className}`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
    </select>
    {description && <p id={descriptionId} className="text-[11px] text-zinc-500">{description}</p>}
    {error && <p id={errorId} role="alert" className="text-[11px] text-rose-300">{error}</p>}
  </div>;
});

export default Select;
