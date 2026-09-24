import type { HTMLAttributes, ReactNode } from 'react';

type Props = HTMLAttributes<HTMLElement> & { title: string; description?: string; children: ReactNode; footer?: ReactNode };

export default function FormSection({ title, description, children, footer, className = '', ...props }: Props) {
  return <section {...props} className={`overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 ${className}`}>
    <div className="border-b border-zinc-800 px-4 py-4 sm:px-5"><h2 className="text-sm font-semibold text-white">{title}</h2>{description && <p className="mt-1 text-xs leading-5 text-zinc-400">{description}</p>}</div>
    <div className="space-y-4 p-4 sm:p-5">{children}</div>
    {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-800 px-4 py-3 sm:px-5">{footer}</div>}
  </section>;
}
