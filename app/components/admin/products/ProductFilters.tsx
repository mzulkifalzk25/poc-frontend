import { useEffect, useEffectEvent, useState } from "react";

import type { Category } from "~/domain/category";
import type { ProductQuery, StockFilter } from "~/domain/product";
import { t } from "~/i18n/t";

const SEARCH_DELAY_MS = 300;
const VISIBLE_CHIPS = 4;

interface ProductFiltersProps {
  query: ProductQuery;
  categories: Category[];
  onChange: (changes: Partial<ProductQuery>) => void;
}

const chipBase =
  "flex h-9 items-center rounded-pill px-3.5 text-[13px] transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none";
const chipIdle = `${chipBase} border border-border bg-white font-medium hover:bg-off-white active:bg-border`;
const chipActive = `${chipBase} bg-navy font-semibold text-white`;

export function ProductFilters({
  query,
  categories,
  onChange,
}: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchBox
        value={query.search}
        onSearch={(search) => {
          onChange({ search });
        }}
      />
      <CategoryChips
        categories={categories}
        selected={query.categoryId}
        onSelect={(categoryId) => {
          onChange({ categoryId });
        }}
      />
      <StockSelect
        value={query.filter}
        onSelect={(filter) => {
          onChange({ filter });
        }}
      />
    </div>
  );
}

function SearchBox(props: {
  value: string;
  onSearch: (value: string) => void;
}) {
  const { value, onSearch } = props;
  const [text, setText] = useState(value);
  const commit = useEffectEvent((next: string) => {
    if (next !== value) {
      onSearch(next);
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      commit(text);
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [text]);

  return (
    <label className="flex h-11 w-[340px] items-center gap-2 rounded-input border border-border bg-white px-3.5 text-text-secondary focus-within:ring-2 focus-within:ring-blue">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </svg>
      <input
        type="search"
        aria-label={t().products.search}
        placeholder={t().products.search}
        value={text}
        className="h-full min-w-0 flex-grow bg-transparent text-sm text-text outline-none"
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
    </label>
  );
}

interface CategoryChipsProps {
  categories: Category[];
  selected: number | null;
  onSelect: (categoryId: number | null) => void;
}

function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  const strings = t().products;
  const visible = categories.slice(0, VISIBLE_CHIPS);
  const rest = categories.slice(VISIBLE_CHIPS);
  const restSelected = rest.some((category) => category.id === selected);
  return (
    <div
      role="group"
      aria-label={strings.categories}
      className="flex flex-grow flex-wrap gap-2"
    >
      <button
        type="button"
        aria-pressed={selected === null}
        className={selected === null ? chipActive : chipIdle}
        onClick={() => {
          onSelect(null);
        }}
      >
        {strings.allCategories}
      </button>
      {visible.map((category) => (
        <button
          key={category.id}
          type="button"
          aria-pressed={selected === category.id}
          className={selected === category.id ? chipActive : chipIdle}
          onClick={() => {
            onSelect(category.id);
          }}
        >
          {category.name}
        </button>
      ))}
      {rest.length > 0 && (
        <select
          aria-label={strings.more}
          value={restSelected ? String(selected) : ""}
          className={`${restSelected ? chipActive : chipIdle} cursor-pointer appearance-none`}
          onChange={(event) => {
            onSelect(event.target.value ? Number(event.target.value) : null);
          }}
        >
          <option value="">{strings.more}</option>
          {rest.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function StockSelect(props: {
  value: StockFilter;
  onSelect: (filter: StockFilter) => void;
}) {
  const strings = t().products;
  const options: StockFilter[] = ["all", "low", "out", "archived"];
  return (
    <select
      aria-label={strings.stockFilter}
      value={props.value}
      className="h-11 cursor-pointer rounded-input border border-border bg-white px-3.5 text-sm font-medium text-text transition hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none"
      onChange={(event) => {
        const filter = options.find((option) => option === event.target.value);
        props.onSelect(filter ?? "all");
      }}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {strings.filters[option]}
        </option>
      ))}
    </select>
  );
}
