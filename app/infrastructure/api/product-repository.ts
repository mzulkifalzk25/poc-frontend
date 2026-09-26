import type {
  PriceChange,
  ProductCategoryRef,
  ProductDetail,
  ProductQuery,
  ProductSummary,
  StockStatus,
} from "~/domain/product";
import type { ProductEditPayload } from "~/domain/product-draft";
import {
  PRODUCT_PAGE_SIZE,
  type ProductRepository,
} from "~/use_cases/manage-products";

import { apiClient } from "./client";

export interface ProductSummaryDto {
  id: number;
  barcode: string;
  name: string;
  category: ProductCategoryRef | null;
  unit: string;
  price: string;
  cost?: string;
  stock: string;
  status: StockStatus;
}

interface ProductDetailDto extends ProductSummaryDto {
  category_id: number | null;
  low_stock_alert: string;
  is_archived: boolean;
}

interface PriceChangeDto {
  when: string;
  who: string;
  old: string;
  new: string;
}

interface ProductPageDto {
  count: number;
  results: ProductSummaryDto[];
}

export function toProductSummary(dto: ProductSummaryDto): ProductSummary {
  return {
    id: dto.id,
    barcode: dto.barcode,
    name: dto.name,
    category: dto.category,
    unit: dto.unit,
    price: dto.price,
    cost: dto.cost ?? null,
    stock: dto.stock,
    status: dto.status,
  };
}

function toProductDetail(dto: ProductDetailDto): ProductDetail {
  return {
    ...toProductSummary(dto),
    categoryId: dto.category_id,
    lowStockAlert: dto.low_stock_alert,
    isArchived: dto.is_archived,
  };
}

function toEditBody(payload: ProductEditPayload) {
  return {
    name: payload.name,
    category_id: payload.categoryId,
    unit: payload.unit,
    price: payload.price,
    cost: payload.cost,
    low_stock_alert: payload.lowStockAlert,
  };
}

export function productListPath(query: ProductQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(PRODUCT_PAGE_SIZE),
    stock: query.filter === "archived" ? "all" : query.filter,
    archived: String(query.filter === "archived"),
  });
  if (query.search.trim() !== "") {
    params.set("search", query.search.trim());
  }
  if (query.categoryId !== null) {
    params.set("category", String(query.categoryId));
  }
  return `/products?${params.toString()}`;
}

export const productRepository: ProductRepository = {
  list: async (query) => {
    const page = await apiClient.get<ProductPageDto>(productListPath(query));
    return { count: page.count, results: page.results.map(toProductSummary) };
  },
  get: async (id) =>
    toProductDetail(
      await apiClient.get<ProductDetailDto>(`/products/${String(id)}`),
    ),
  priceHistory: async (id) => {
    const rows = await apiClient.get<PriceChangeDto[]>(
      `/products/${String(id)}/price-history`,
    );
    return rows.map((row): PriceChange => ({
      when: row.when,
      who: row.who,
      oldPrice: row.old,
      newPrice: row.new,
    }));
  },
  update: async (id, payload) =>
    toProductDetail(
      await apiClient.patch<ProductDetailDto>(
        `/products/${String(id)}`,
        toEditBody(payload),
      ),
    ),
};
