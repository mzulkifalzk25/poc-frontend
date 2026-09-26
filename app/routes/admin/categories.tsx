import { PageHeader } from "~/components/admin/PageHeader";
import { CategoryCard } from "~/components/admin/categories/CategoryCard";
import { CategoryForm } from "~/components/admin/categories/CategoryForm";
import { useCategoryEditor } from "~/components/admin/categories/useCategoryEditor";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "~/components/ui/StateBlocks";
import { useToast } from "~/components/ui/ToastProvider";
import { useAsyncData } from "~/components/ui/useAsyncData";
import {
  nextUnusedTint,
  totalProductCount,
  type Category,
} from "~/domain/category";
import { t } from "~/i18n/t";
import { categoryRepository } from "~/infrastructure/api/category-repository";

function PlusIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function InfoNote() {
  return (
    <div className="flex max-w-[720px] items-start gap-3 rounded-lg bg-warning-bg px-[18px] py-3.5 text-sm leading-normal text-[#6E3A06]">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mt-px flex-shrink-0"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
      <p>{t().categories.note}</p>
    </div>
  );
}

interface GridProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onAdd: () => void;
}

function CategoryGrid({ categories, onEdit, onAdd }: GridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onEdit={() => {
            onEdit(category);
          }}
        />
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="flex h-[228px] flex-col items-center justify-center gap-2.5 rounded-card border-2 border-dashed border-border-strong text-[15px] font-semibold text-ink-soft transition hover:bg-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:bg-border"
      >
        <PlusIcon size={28} />
        {t().categories.newCard}
      </button>
    </div>
  );
}

export default function CategoriesRoute() {
  const strings = t().categories;
  const { showToast } = useToast();
  const { state, reload } = useAsyncData(categoryRepository.list);
  const editor = useCategoryEditor({
    repo: categoryRepository,
    onSaved: (category) => {
      showToast(strings.saved(category.name));
      reload();
    },
  });
  const categories = state.status === "ready" ? state.data : [];

  return (
    <div className="flex max-w-[1136px] flex-col gap-6">
      <PageHeader
        title={strings.title}
        subtitle={
          state.status === "ready"
            ? strings.subtitle(categories.length, totalProductCount(categories))
            : undefined
        }
        actions={
          <Button
            onClick={() => {
              editor.start(null);
            }}
          >
            <PlusIcon size={18} />
            {strings.add}
          </Button>
        }
      />
      {state.status === "loading" && (
        <Card>
          <LoadingState />
        </Card>
      )}
      {state.status === "error" && (
        <Card>
          <ErrorState onRetry={reload} />
        </Card>
      )}
      {state.status === "ready" && categories.length === 0 && (
        <Card>
          <EmptyState title={strings.empty.title} hint={strings.empty.hint} />
        </Card>
      )}
      {state.status === "ready" && (
        <CategoryGrid
          categories={categories}
          onEdit={editor.start}
          onAdd={() => {
            editor.start(null);
          }}
        />
      )}
      <InfoNote />
      {editor.open && (
        <CategoryForm
          category={editor.category}
          defaultTint={nextUnusedTint(categories)}
          pending={editor.pending}
          error={editor.error}
          fieldErrors={editor.fieldErrors}
          onSubmit={(draft) => void editor.submit(draft)}
          onClose={editor.close}
        />
      )}
    </div>
  );
}
