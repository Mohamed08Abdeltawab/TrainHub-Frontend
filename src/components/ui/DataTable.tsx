import { useMemo, useState, type ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from './table';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import Skeleton from './Skeleton';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
};

type Props<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  caption: string;
  loading?: boolean;
  error?: string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
};

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  loading = false,
  error,
  pageSize = 8,
  emptyTitle = 'No records yet',
  emptyDescription = 'Records will appear here when they are available.',
}: Props<T>) {
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(0);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((candidate) => candidate.key === sort.key);
    if (!column?.sortValue) return rows;
    return [...rows].sort((first, second) => {
      const left = column.sortValue?.(first) ?? '';
      const right = column.sortValue?.(second) ?? '';
      const result =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
      return sort.direction === 'asc' ? result : -result;
    });
  }, [columns, rows, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const visibleRows = sortedRows.slice(
    Math.min(page, pageCount - 1) * pageSize,
    (Math.min(page, pageCount - 1) + 1) * pageSize
  );

  const toggleSort = (column: DataTableColumn<T>) => {
    if (!column.sortValue) return;
    setSort((current) =>
      current?.key === column.key
        ? { key: column.key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key: column.key, direction: 'asc' }
    );
    setPage(0);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/60 shadow-sm">
      {error ? (
        <div role="alert" className="p-6 text-center">
          <p className="text-sm font-medium text-destructive">Could not load {caption.toLowerCase()}</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        </div>
      ) : !loading && rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <Table>
            <TableCaption className="sr-only">{caption}</TableCaption>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border hover:bg-transparent">
                {columns.map((column) => {
                  const active = sort?.key === column.key;
                  return (
                    <TableHead key={column.key} className={cn('text-[11px] font-semibold uppercase tracking-wider text-muted-foreground', column.className)}>
                      {column.sortValue ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(column)}
                          aria-label={`Sort by ${String(column.header)}`}
                          aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                          className="inline-flex items-center gap-1.5 text-start transition hover:text-foreground"
                        >
                          {column.header}
                          <span aria-hidden="true" className="text-muted-foreground">
                            {active ? (
                              sort.direction === 'asc' ? <ArrowUp className="size-3 text-primary" /> : <ArrowDown className="size-3 text-primary" />
                            ) : (
                              <ArrowUpDown className="size-3 opacity-60" />
                            )}
                          </span>
                        </button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading
                ? Array.from({ length: Math.min(pageSize, 5) }, (_, index) => (
                    <TableRow key={`loading-${index}`} className="border-border">
                      {columns.map((column) => (
                        <TableCell key={column.key} className={column.className}>
                          <Skeleton className="h-4 w-3/4 rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : visibleRows.map((row) => (
                    <TableRow key={rowKey(row)} className="border-border transition-colors hover:bg-muted/40">
                      {columns.map((column) => (
                        <TableCell key={column.key} className={column.className}>
                          {column.cell(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {!loading && rows.length > 0 && (
            <Pagination
              currentPage={page + 1}
              totalItems={rows.length}
              pageSize={pageSize}
              onPageChange={(nextPage) => setPage(nextPage - 1)}
            />
          )}
        </>
      )}
    </div>
  );
}
