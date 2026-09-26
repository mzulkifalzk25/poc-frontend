import { Button } from "~/components/ui/Button";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { nextUnusedTint, type Category } from "~/domain/category";
import { t } from "~/i18n/t";

import { CategoryForm } from "./CategoryForm";
import { DeleteBlockedNotice } from "./DeleteBlockedNotice";
import { MoveProductsDialog } from "./MoveProductsDialog";
import type { useCategoryDeletion } from "./useCategoryDeletion";
import type { useCategoryEditor } from "./useCategoryEditor";

interface CategoryEditorLayerProps {
  categories: Category[];
  editor: ReturnType<typeof useCategoryEditor>;
  deletion: ReturnType<typeof useCategoryDeletion>;
}

export function CategoryEditorLayer({
  categories,
  editor,
  deletion,
}: CategoryEditorLayerProps) {
  const strings = t().categories.remove;
  const category = editor.category;
  if (!editor.open) {
    return null;
  }
  return (
    <>
      <CategoryForm
        category={category}
        defaultTint={nextUnusedTint(categories)}
        pending={editor.pending}
        error={editor.error}
        fieldErrors={editor.fieldErrors}
        onSubmit={(draft) => void editor.submit(draft)}
        onClose={editor.close}
        notice={
          category &&
          deletion.blocked && (
            <DeleteBlockedNotice
              category={category}
              onMove={deletion.openMove}
            />
          )
        }
        extraActions={
          category && (
            <Button
              variant="destructiveOutline"
              size="lg"
              onClick={() => {
                deletion.requestDelete(category);
              }}
            >
              {strings.button}
            </Button>
          )
        }
      />
      {category && deletion.dialog === "confirm" && (
        <ConfirmDialog
          title={strings.confirmTitle(category.name)}
          confirmLabel={strings.confirm}
          pending={deletion.pending}
          error={deletion.error}
          onConfirm={() => void deletion.confirmDelete(category)}
          onCancel={deletion.closeDialog}
        >
          <p>{strings.confirmBody}</p>
        </ConfirmDialog>
      )}
      {category && deletion.dialog === "move" && (
        <MoveProductsDialog
          category={category}
          categories={categories}
          pending={deletion.pending}
          error={deletion.error}
          onMove={(toId) => void deletion.moveAndDelete(category, toId)}
          onCancel={deletion.closeDialog}
        />
      )}
    </>
  );
}
