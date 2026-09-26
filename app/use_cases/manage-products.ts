import type { ProductPage, ProductQuery } from "~/domain/product";

export const PRODUCT_PAGE_SIZE = 10;

export interface ProductRepository {
  list: (query: ProductQuery) => Promise<ProductPage>;
}
