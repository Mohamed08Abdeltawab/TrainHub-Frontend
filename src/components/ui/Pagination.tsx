import { useMemo } from 'react';
import Button from './button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '../../i18n/LanguageContext';

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
  const { direction, t } = useLanguage();
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

  return (
    <nav aria-label={t('Pagination')} className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
      <p aria-live="polite"><span>{t('Showing')}</span> <bdi>{start}–{end}</bdi> <span>{t('of')}</span> <bdi>{safeTotal}</bdi></p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="xs"
          aria-label={t('Go to first page')}
          disabled={page <= 1}
          onClick={() => changePage(1)}
          className="size-7 p-0"
        >
          {direction === 'rtl' ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          aria-label={t('Go to previous page')}
          disabled={page <= 1}
          onClick={() => changePage(page - 1)}
          className="size-7 p-0"
        >
          {direction === 'rtl' ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </Button>
        {tokens.map((token, index) =>
          typeof token === 'number' ? (
            <Button
              key={token}
              type="button"
              variant={token === page ? 'primary' : 'outline'}
              size="xs"
              aria-label={`${t('Go to page')} ${token}`}
              aria-current={token === page ? 'page' : undefined}
              className={cn('size-7 p-0 font-medium', token === page ? 'shadow-sm' : '')}
              onClick={() => changePage(token)}
            >
              {token}
            </Button>
          ) : (
            <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-muted-foreground/60">
              …
            </span>
          )
        )}
        <Button
          type="button"
          variant="outline"
          size="xs"
          aria-label={t('Go to next page')}
          disabled={pageCount === 0 || page >= pageCount}
          onClick={() => changePage(page + 1)}
          className="size-7 p-0"
        >
          {direction === 'rtl' ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          aria-label={t('Go to last page')}
          disabled={pageCount === 0 || page >= pageCount}
          onClick={() => changePage(pageCount)}
          className="size-7 p-0"
        >
          {direction === 'rtl' ? <ChevronsLeft className="size-3.5" /> : <ChevronsRight className="size-3.5" />}
        </Button>
      </div>
    </nav>
  );
}
