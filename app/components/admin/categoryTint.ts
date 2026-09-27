import { isCategoryTint, type CategoryTint } from "~/domain/category";

const tintClasses: Record<CategoryTint, string> = {
  green: "bg-category-grocery-bg text-category-grocery-ink",
  blue: "bg-category-dairy-bg text-category-dairy-ink",
  orange: "bg-category-beverages-bg text-category-beverages-ink",
  pink: "bg-category-snacks-bg text-category-snacks-ink",
  purple: "bg-category-personal-care-bg text-category-personal-care-ink",
  teal: "bg-category-household-bg text-category-household-ink",
  yellow: "bg-category-bakery-bg text-category-bakery-ink",
};

export function tintClass(tint: string): string {
  return isCategoryTint(tint)
    ? tintClasses[tint]
    : "bg-border text-text-secondary";
}
