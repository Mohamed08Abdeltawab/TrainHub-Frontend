import { Skeleton } from './Skeleton';

export type TableSkeletonProps = {
  columns?: number;
  rows?: number;
  className?: string;
};

export function TableSkeleton({
  columns = 5,
  rows = 5,
  className = '',
}: TableSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading table data"
      aria-busy="true"
      className={`overflow-x-auto ${className}`}
    >
      <div className="min-w-full divide-y divide-border">
        {/* Table header skeleton */}
        <div className="flex items-center gap-4 bg-muted/30 px-3 py-3 border-b border-border">
          {Array.from({ length: columns }, (_, colIndex) => (
            <div
              key={`head-${colIndex}`}
              className={colIndex === 0 ? 'flex-1' : 'w-24 sm:w-32 shrink-0'}
            >
              <Skeleton className="h-3.5 w-3/4 rounded" />
            </div>
          ))}
        </div>
        {/* Table rows skeleton */}
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="flex items-center gap-4 px-3 py-4 border-b border-border/70 last:border-0"
          >
            {Array.from({ length: columns }, (_, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className={colIndex === 0 ? 'flex-1 space-y-1.5' : 'w-24 sm:w-32 shrink-0'}
              >
                <Skeleton
                  className={
                    colIndex === 0
                      ? 'h-4 w-4/5 rounded'
                      : colIndex === columns - 1
                      ? 'h-6 w-16 ms-auto rounded'
                      : 'h-3.5 w-full rounded'
                  }
                />
                {colIndex === 0 && <Skeleton className="h-3 w-1/2 rounded" />}
              </div>
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading records...</span>
    </div>
  );
}

export default TableSkeleton;
