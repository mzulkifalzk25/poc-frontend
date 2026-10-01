import type { ProductCategoryRef, StockStatus } from "~/domain/product";
import type { StockMovement, StockRow } from "~/domain/stock";
import {
  STOCK_PAGE_SIZE,
  type StockRepository,
} from "~/use_cases/manage-stock";

import { apiClient } from "./client";

interface StockRowDto {
  id: number;
  name: string;
  barcode: string;
  unit: string;
  stock: string;
  low_stock_alert: string;
  status: StockStatus;
  category: ProductCategoryRef | null;
}

interface StockPageDto {
  count: number;
  results: StockRowDto[];
  summary: {
    units_in_stock: string;
    stock_value: string;
    low_count: number;
    out_count: number;
  };
}

interface MovementDto {
  id: number;
  occurred_at: string;
  product: { id: number; name: string };
  qty_delta: string;
  reason: string;
  user: string | null;
}

function toRow(dto: StockRowDto): StockRow {
  return {
    id: dto.id,
    name: dto.name,
    barcode: dto.barcode,
    unit: dto.unit,
    stock: dto.stock,
    lowStockAlert: dto.low_stock_alert,
    status: dto.status,
    category: dto.category,
  };
}

function toMovement(dto: MovementDto): StockMovement {
  return {
    id: dto.id,
    occurredAt: dto.occurred_at,
    productName: dto.product.name,
    qtyDelta: dto.qty_delta,
    reason: dto.reason,
    userName: dto.user,
  };
}

export const stockRepository: StockRepository = {
  list: async (query) => {
    const params = new URLSearchParams({
      page: String(query.page),
      page_size: String(STOCK_PAGE_SIZE),
    });
    if (query.filter !== "all") {
      params.set("status", query.filter);
    }
    if (query.search !== "") {
      params.set("search", query.search);
    }
    const page = await apiClient.get<StockPageDto>(
      `/stock?${params.toString()}`,
    );
    return {
      count: page.count,
      results: page.results.map(toRow),
      summary: {
        unitsInStock: page.summary.units_in_stock,
        stockValue: page.summary.stock_value,
        lowCount: page.summary.low_count,
        outCount: page.summary.out_count,
      },
    };
  },
  recentAdjustments: async (limit) => {
    const page = await apiClient.get<{ results: MovementDto[] }>(
      `/stock/movements?type=adjust&limit=${String(limit)}`,
    );
    return page.results.map(toMovement);
  },
  adjust: (productId, payload, key) =>
    apiClient.post(
      "/stock/adjust",
      {
        product_id: productId,
        mode: payload.mode,
        qty: payload.qty,
        reason: payload.reason,
        note: payload.note,
      },
      { headers: { "Idempotency-Key": key } },
    ),
};
