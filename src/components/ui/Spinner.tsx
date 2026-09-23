export default function Spinner({ size = 'md', label = 'Loading', className = '' }: { size?: 'sm' | 'md' | 'lg'; label?: string; className?: string }) {
  const sizes = { sm: 'h-3.5 w-3.5 border-2', md: 'h-5 w-5 border-2', lg: 'h-8 w-8 border-[3px]' };
  return <span role="status" aria-live="polite" className={`inline-flex shrink-0 items-center justify-center ${className}`}>
    <span aria-hidden="true" className={`animate-spin rounded-full border-current border-r-transparent ${sizes[size]}`} />
    <span className="sr-only">{label}</span>
  </span>;
}
