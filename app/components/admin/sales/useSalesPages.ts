import { useCallback } from "react";

import type { SalesQuery } from "~/domain/sale";
import {
  salesRepository,
  type SalesRepository,
} from "~/infrastructure/api/sales-repository";

import { useCursorPages } from "../useCursorPages";

export function useSalesPages(
  query: SalesQuery,
  repo: SalesRepository = salesRepository,
) {
  const { date, cashierId, payment, search } = query;
  const load = useCallback(
    async (cursor: string | null) => {
      const page = await repo.list(
        { date, cashierId, payment, search },
        cursor,
      );
      return {
        rows: page.bills,
        nextCursor: page.nextCursor,
        extra: { count: page.count, total: page.total },
      };
    },
    [repo, date, cashierId, payment, search],
  );
  return useCursorPages(
    JSON.stringify([date, cashierId, payment, search]),
    load,
  );
}
