import { useMemo } from 'react';

type Props = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
};

type PageToken = number | 'start-ellipsis' | 'end-ellipsis';

function getPageTokens(currentPage: number, pageCount: number, siblingCount: number): PageToken[] {
  if (pageCount <= 1) return pageCount === 1 ? [1] : [];
  const left = Math.max(currentPage - siblingCount, 1);
  const right = Math.min(currentPage + siblingCount, pageCount);
  const tokens: PageToken[] = [1];
  if (left > 2) tokens.push('start-ellipsis');
  for (let page = Math.max(2, left); page <= Math.min(pageCount - 1, right); page += 1) tokens.push(page);
  if (right < pageCount - 1) tokens.push('end-ellipsis');
  tokens.push(pageCount);
  return tokens;
}

export default function Pagination({ currentPage, totalItems, pageSize, onPageChange, siblingCount = 1 }: Props) {
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 1;
  const safeTotal = Number.isFinite(totalItems) && totalItems > 0 ? Math.floor(totalItems) : 0;
  const pageCount = Math.ceil(safeTotal / safePageSize);
  const page = pageCount === 0 ? 0 : Math.min(Math.max(Math.floor(currentPage) || 1, 1), pageCount);
  const tokens = useMemo(() => getPageTokens(page, pageCount, Math.max(0, Math.floor(siblingCount))), [page, pageCount, siblingCount]);
  const start = safeTotal === 0 ? 0 : (page - 1) * safePageSize + 1;
  const end = Math.min(page * safePageSize, safeTotal);

  const changePage = (nextPage: number) => {
    if (nextPage >= 1 && nextPage <= pageCount && nextPage !== page) onPageChange(nextPage);
  };

  const buttonClass = 'inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-zinc-700 px-2 text-xs text-zinc-300 transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-40';

  return <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 px-4 py-3 text-[11px] text-zinc-500">
    <p aria-live="polite">Showing {start}–{end} of {safeTotal}</p>
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label="Go to first page" className={buttonClass} disabled={page <= 1} onClick={() => changePage(1)}>First</button>
      <button type="button" aria-label="Go to previous page" className={buttonClass} disabled={page <= 1} onClick={() => changePage(page - 1)}>Previous</button>
      {tokens.map((token) => typeof token === 'number'
        ? <button key={token} type="button" aria-label={`Go to page ${token}`} aria-current={token === page ? 'page' : undefined} className={`${buttonClass} ${token === page ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-200' : ''}`} onClick={() => changePage(token)}>{token}</button>
        : <span key={token} aria-hidden="true" className="px-1 text-zinc-600">…</span>)}
      <button type="button" aria-label="Go to next page" className={buttonClass} disabled={pageCount === 0 || page >= pageCount} onClick={() => changePage(page + 1)}>Next</button>
      <button type="button" aria-label="Go to last page" className={buttonClass} disabled={pageCount === 0 || page >= pageCount} onClick={() => changePage(pageCount)}>Last</button>
    </div>
  </nav>;
}
