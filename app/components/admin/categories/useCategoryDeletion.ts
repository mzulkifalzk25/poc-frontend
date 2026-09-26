import { useState } from "react";

import type { Category } from "~/domain/category";
import {
  deleteCategory,
  moveProductsAndDelete,
  type CategoryRepository,
  type DeleteCategoryOutcome,
} from "~/use_cases/manage-categories";

import { writeErrorMessage } from "../writeError";

type DeletionDialog = "none" | "confirm" | "move";

interface DeletionOptions {
  repo: CategoryRepository;
  onDeleted: (category: Category, moved: boolean) => void;
}

export function useCategoryDeletion({ repo, onDeleted }: DeletionOptions) {
  const [dialog, setDialog] = useState<DeletionDialog>("none");
  const [blocked, setBlocked] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setDialog("none");
    setBlocked(false);
    setError(null);
  }

  async function run(
    category: Category,
    moved: boolean,
    action: () => Promise<DeleteCategoryOutcome>,
  ) {
    setPending(true);
    setError(null);
    const outcome = await action();
    setPending(false);
    if (outcome.status === "done") {
      reset();
      onDeleted(category, moved);
    } else if (outcome.status === "has_products") {
      setDialog("none");
      setBlocked(true);
    } else {
      setError(writeErrorMessage(outcome));
    }
  }

  return {
    dialog,
    blocked,
    pending,
    error,
    reset,
    requestDelete: (category: Category) => {
      setError(null);
      if (category.productCount > 0) {
        setBlocked(true);
      } else {
        setDialog("confirm");
      }
    },
    openMove: () => {
      setError(null);
      setDialog("move");
    },
    closeDialog: () => {
      setDialog("none");
    },
    confirmDelete: (category: Category) =>
      run(category, false, () => deleteCategory(repo, category.id)),
    moveAndDelete: (category: Category, toId: number) =>
      run(category, true, () => moveProductsAndDelete(repo, category.id, toId)),
  };
}
