import { Link } from "react-router";

import { categoryLetter, type Category } from "~/domain/category";
import { t } from "~/i18n/t";

import { tintClass } from "../categoryTint";

interface CategoryCardProps {
  category: Category;
  onEdit: () => void;
}

const outlineClass =
  "flex h-11 items-center justify-center rounded-input border border-border-strong text-sm font-semibold transition hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:bg-border";

export function CategoryCard({ category, onEdit }: CategoryCardProps) {
  const strings = t().categories;
  return (
    <article className="flex h-[228px] flex-col justify-between rounded-card border border-border bg-white p-5">
      <div className="flex flex-col gap-4">
        <span
          aria-hidden="true"
          className={`flex h-[52px] w-[52px] items-center justify-center rounded-card font-heading text-[22px] font-bold ${tintClass(category.tint)}`}
        >
          {categoryLetter(category.name)}
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-bold tracking-[-0.01em]">
            {category.name}
          </h2>
          <p className="text-sm text-text-secondary">
            <span className="font-mono font-semibold text-text">
              {category.productCount.toLocaleString("en-US")}
            </span>{" "}
            {strings.products}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          to={`/admin/products?category=${String(category.id)}`}
          className={`${outlineClass} flex-grow`}
        >
          {strings.viewProducts}
        </Link>
        <button
          type="button"
          aria-label={strings.edit(category.name)}
          onClick={onEdit}
          className={`${outlineClass} w-11 text-ink-soft`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 20h4L19 9l-4-4L4 16v4z" />
          </svg>
        </button>
      </div>
    </article>
  );
}
