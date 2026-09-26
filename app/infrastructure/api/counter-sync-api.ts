import type { StoreSettings } from "~/domain/store-settings";
import type { PersonUpdate } from "~/infrastructure/db/people-store";
import type { CategoryRow, ProductRow } from "~/infrastructure/db/rows";
import type { CounterSyncApi } from "~/use_cases/sync-catalogue";

import { apiClient } from "./client";

export const SYNC_PAGE_SIZE = 2000;

interface ProductSyncDto {
  id: number;
  barcode: string;
  name: string;
  category_id: number | null;
  unit: string;
  price: string;
  is_archived: boolean;
}

interface CategorySyncDto {
  id: number;
  name: string;
  tint: string;
}

interface PersonDto {
  id: number;
  full_name: string;
  initials: string;
  pin_verifier: string | null;
  active: boolean;
  unlocked_at: string | null;
}

interface SettingsDto {
  store_name: string;
  phone: string;
  address: string;
  tax_rate: string;
  prices_include_tax: boolean;
  block_when_out_of_stock: boolean;
  receipt_paper_mm: number;
  receipt_header: string;
  receipt_footer: string;
  receipt_show_barcode: boolean;
}

export function toProductRow(dto: ProductSyncDto): ProductRow {
  return {
    id: dto.id,
    barcode: dto.barcode,
    name: dto.name,
    nameLc: dto.name.toLowerCase(),
    categoryId: dto.category_id,
    unit: dto.unit,
    price: dto.price,
    isArchived: dto.is_archived,
  };
}

function toCategoryRow(dto: CategorySyncDto): CategoryRow {
  return { id: dto.id, name: dto.name, tint: dto.tint };
}

function toPerson(dto: PersonDto): PersonUpdate {
  return {
    id: dto.id,
    fullName: dto.full_name,
    initials: dto.initials,
    pinVerifier: dto.pin_verifier,
    active: dto.active,
    unlockedAt: dto.unlocked_at,
  };
}

export function toStoreSettings(dto: SettingsDto): StoreSettings {
  return {
    storeName: dto.store_name,
    phone: dto.phone,
    address: dto.address,
    taxRate: dto.tax_rate,
    pricesIncludeTax: dto.prices_include_tax,
    blockWhenOutOfStock: dto.block_when_out_of_stock,
    receiptPaperMm: dto.receipt_paper_mm,
    receiptHeader: dto.receipt_header,
    receiptFooter: dto.receipt_footer,
    receiptShowBarcode: dto.receipt_show_barcode,
  };
}

const device = { tokenSource: "device" } as const;

function query(since: string, extra: Record<string, string> = {}) {
  return new URLSearchParams({ since, ...extra }).toString();
}

export const counterSyncApi: CounterSyncApi = {
  products: async (since) => {
    const page = await apiClient.get<{
      products: ProductSyncDto[];
      categories: CategorySyncDto[];
      next_since: string | number;
      has_more: boolean;
    }>(
      `/products/sync/?${query(since, { page_size: String(SYNC_PAGE_SIZE) })}`,
      device,
    );
    return {
      products: page.products.map(toProductRow),
      categories: page.categories.map(toCategoryRow),
      nextSince: String(page.next_since),
      hasMore: page.has_more,
    };
  },
  stock: async (since) => {
    const page = await apiClient.get<{
      levels: { product_id: number; qty: string }[];
      next_since: string | number;
    }>(`/stock/sync/?${query(since)}`, device);
    return {
      levels: page.levels.map((level) => ({
        productId: level.product_id,
        qty: level.qty,
      })),
      nextSince: String(page.next_since),
    };
  },
  people: async (since) => {
    const page = await apiClient.get<{
      roster: PersonDto[];
      next_since: string | number;
    }>(`/pos/people/sync/?${query(since)}`, device);
    return {
      people: page.roster.map(toPerson),
      nextSince: String(page.next_since),
    };
  },
  bootstrap: async () => {
    const boot = await apiClient.get<{
      settings: SettingsDto;
      last_bill_seq: number;
      server_time: string;
    }>("/pos/bootstrap", device);
    return {
      settings: toStoreSettings(boot.settings),
      lastBillSeq: boot.last_bill_seq,
      serverTime: boot.server_time,
    };
  },
};
