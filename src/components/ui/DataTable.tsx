import { useMemo, useState, type ReactNode } from 'react';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import Skeleton from './Skeleton';

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

export default function DataTable<T>({ columns, rows, rowKey, caption, loading = false, error, pageSize = 8, emptyTitle = 'No records yet', emptyDescription = 'Records will appear here when they are available.' }: Props<T>) {
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(0);
  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((candidate) => candidate.key === sort.key);
    if (!column?.sortValue) return rows;
    return [...rows].sort((first, second) => {
      const left = column.sortValue?.(first) ?? '';
      const right = column.sortValue?.(second) ?? '';
      const result = typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
      return sort.direction === 'asc' ? result : -result;
    });
  }, [columns, rows, sort]);
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const visibleRows = sortedRows.slice(Math.min(page, pageCount - 1) * pageSize, (Math.min(page, pageCount - 1) + 1) * pageSize);

  const toggleSort = (column: DataTableColumn<T>) => {
    if (!column.sortValue) return;
    setSort((current) => current?.key === column.key
      ? { key: column.key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { key: column.key, direction: 'asc' });
    setPage(0);
  };

  return <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
    {error ? <div role="alert" className="p-6 text-center"><p className="text-sm font-medium text-rose-200">Could not load {caption.toLowerCase()}</p><p className="mt-1 text-xs text-zinc-400">{error}</p></div>
      : !loading && rows.length === 0 ? <EmptyState title={emptyTitle} description={emptyDescription} />
        : <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-xs">
              <caption className="sr-only">{caption}</caption>
              <thead className="border-b border-zinc-800 bg-zinc-950/40 text-[10px] font-semibold uppercase tracking-wider text-zinc-500"><tr>{columns.map((column) => {
                const active = sort?.key === column.key;
                return <th key={column.key} scope="col" className={`px-4 py-3 ${column.className ?? ''}`}>
                  {column.sortValue ? <button type="button" onClick={() => toggleSort(column)} aria-label={`Sort by ${String(column.header)}`} aria-sort={active ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'} className="inline-flex items-center gap-1.5 text-left hover:text-zinc-200">{column.header}<span aria-hidden="true">{active ? sort.direction === 'asc' ? '↑' : '↓' : '↕'}</span></button> : column.header}
                </th>;
              })}</tr></thead>
              <tbody className="divide-y divide-zinc-800/70">
                {loading ? Array.from({ length: Math.min(pageSize, 5) }, (_, index) => <tr key={`loading-${index}`}>{columns.map((column) => <td key={column.key} className="px-4 py-3"><Skeleton className="h-3 w-3/4" /></td>)}</tr>)
                  : visibleRows.map((row) => <tr key={rowKey(row)} className="text-zinc-300 transition-colors hover:bg-zinc-800/30">{columns.map((column) => <td key={column.key} className={`px-4 py-3 ${column.className ?? ''}`}>{column.cell(row)}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          {!loading && rows.length > 0 && <Pagination currentPage={page + 1} totalItems={rows.length} pageSize={pageSize} onPageChange={(nextPage) => setPage(nextPage - 1)} />}
        </>}
  </div>;
}
