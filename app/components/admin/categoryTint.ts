import { isCategoryTint, type CategoryTint } from "~/domain/category";

const tintClasses: Record<CategoryTint, string> = {
  grocery: "bg-category-grocery-bg text-category-grocery-ink",
  dairy: "bg-category-dairy-bg text-category-dairy-ink",
  beverages: "bg-category-beverages-bg text-category-beverages-ink",
  snacks: "bg-category-snacks-bg text-category-snacks-ink",
  personal_care: "bg-category-personal-care-bg text-category-personal-care-ink",
  household: "bg-category-household-bg text-category-household-ink",
  bakery: "bg-category-bakery-bg text-category-bakery-ink",
};

export function tintClass(tint: string): string {
  return isCategoryTint(tint)
    ? tintClasses[tint]
    : "bg-border text-text-secondary";
}
