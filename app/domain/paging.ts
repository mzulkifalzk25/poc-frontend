export interface PageWindow {
  from: number;
  to: number;
  pageCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function pageWindow(
  page: number,
  pageSize: number,
  total: number,
): PageWindow {
  if (page < 1 || pageSize < 1 || total < 0) {
    throw new Error(
      `Invalid page window: page ${String(page)}, size ${String(pageSize)}, total ${String(total)}`,
    );
  }
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);
  return {
    from,
    to,
    pageCount,
    hasPrevious: page > 1,
    hasNext: page < pageCount,
  };
}
