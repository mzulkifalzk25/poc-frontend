import { pageWindow } from "~/domain/paging";
import { t } from "~/i18n/t";

interface PagingProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

const buttonClass =
  "flex h-9 items-center rounded-lg border border-navy px-3.5 font-semibold text-text transition hover:bg-off-white active:bg-border focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:border-border disabled:text-text-secondary disabled:hover:bg-transparent";

export function Paging({ page, pageSize, total, onPageChange }: PagingProps) {
  const strings = t().admin.paging;
  const range = pageWindow(page, pageSize, total);
  if (total === 0) {
    return null;
  }
  return (
    <nav
      aria-label={strings.label}
      className="flex h-[60px] items-center justify-between px-5 text-[13px] text-text-secondary"
    >
      <span>{strings.showing(range.from, range.to, total)}</span>
      <span className="flex gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={!range.hasPrevious}
          onClick={() => {
            onPageChange(page - 1);
          }}
        >
          {strings.previous}
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={!range.hasNext}
          onClick={() => {
            onPageChange(page + 1);
          }}
        >
          {strings.next}
        </button>
      </span>
    </nav>
  );
}
