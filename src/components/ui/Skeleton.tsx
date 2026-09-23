import type { HTMLAttributes } from 'react';

export default function Skeleton({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} aria-hidden="true" className={`animate-pulse rounded-md bg-zinc-800/80 ${className}`} />;
}
