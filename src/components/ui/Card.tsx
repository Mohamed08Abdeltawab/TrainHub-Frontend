import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & { interactive?: boolean };

export function Card({ interactive = false, className = '', ...props }: CardProps) {
  return <div {...props} className={`rounded-xl border border-zinc-800 bg-zinc-900/50 ${interactive ? 'transition-colors hover:border-zinc-700' : ''} ${className}`} />;
}

export function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`flex flex-col gap-1.5 p-4 sm:p-5 ${className}`} />;
}

export function CardTitle({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 {...props} className={`text-sm font-semibold text-white ${className}`} />;
}

export function CardDescription({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={`text-xs leading-5 text-zinc-400 ${className}`} />;
}

export function CardContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`px-4 pb-4 sm:px-5 sm:pb-5 ${className}`} />;
}

export function CardFooter({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`flex items-center gap-2 border-t border-zinc-800 px-4 py-3 sm:px-5 ${className}`} />;
}
