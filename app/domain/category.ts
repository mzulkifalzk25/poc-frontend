export const CATEGORY_TINTS = [
  "grocery",
  "dairy",
  "beverages",
  "snacks",
  "personal_care",
  "household",
  "bakery",
] as const;

export type CategoryTint = (typeof CATEGORY_TINTS)[number];

export interface Category {
  id: number;
  name: string;
  tint: string;
  productCount: number;
}

export interface CategoryDraft {
  name: string;
  tint: CategoryTint;
}

export function isCategoryTint(value: string): value is CategoryTint {
  return (CATEGORY_TINTS as readonly string[]).includes(value);
}

export function categoryLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export function totalProductCount(categories: Category[]): number {
  return categories.reduce((sum, category) => sum + category.productCount, 0);
}

export function cleanCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function nextUnusedTint(categories: Category[]): CategoryTint {
  const used = new Set(categories.map((category) => category.tint));
  return CATEGORY_TINTS.find((tint) => !used.has(tint)) ?? CATEGORY_TINTS[0];
}
