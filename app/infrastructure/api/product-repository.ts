import type {
  ProductCategoryRef,
  ProductQuery,
  ProductSummary,
  StockStatus,
} from "~/domain/product";
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
};
