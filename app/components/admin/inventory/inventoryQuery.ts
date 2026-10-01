import type { StockListFilter, StockQuery } from "~/domain/stock";

const FILTERS: readonly StockListFilter[] = ["all", "low", "out"];

export function queryFromParams(params: URLSearchParams): StockQuery {
  const page = Number(params.get("page"));
  return {
    filter: FILTERS.find((item) => item === params.get("stock")) ?? "all",
    search: params.get("search") ?? "",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function paramsFromQuery(query: StockQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.filter !== "all") {
    params.set("stock", query.filter);
  }
  if (query.search !== "") {
    params.set("search", query.search);
  }
  if (query.page > 1) {
    params.set("page", String(query.page));
  }
  return params;
}
