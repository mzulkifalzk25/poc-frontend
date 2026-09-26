import type { ProductQuery, StockFilter } from "~/domain/product";

const FILTERS: readonly StockFilter[] = ["all", "low", "out", "archived"];

function positiveInt(value: string | null): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function toFilter(value: string | null): StockFilter {
  return FILTERS.find((filter) => filter === value) ?? "all";
}

export function queryFromParams(params: URLSearchParams): ProductQuery {
  return {
    search: params.get("search") ?? "",
    categoryId: positiveInt(params.get("category")),
    filter: toFilter(params.get("stock")),
    page: positiveInt(params.get("page")) ?? 1,
  };
}

export function paramsFromQuery(query: ProductQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search !== "") {
    params.set("search", query.search);
  }
  if (query.categoryId !== null) {
    params.set("category", String(query.categoryId));
  }
  if (query.filter !== "all") {
    params.set("stock", query.filter);
  }
  if (query.page > 1) {
    params.set("page", String(query.page));
  }
  return params;
}
