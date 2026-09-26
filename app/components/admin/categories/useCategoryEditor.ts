import { useState } from "react";

import type { Category, CategoryDraft } from "~/domain/category";
import {
  saveCategory,
  type CategoryRepository,
} from "~/use_cases/manage-categories";

import { writeErrorMessage } from "../writeError";

interface EditorOptions {
  repo: CategoryRepository;
  onSaved: (category: Category) => void;
}

export function useCategoryEditor({ repo, onSaved }: EditorOptions) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function start(next: Category | null) {
    setCategory(next);
    setError(null);
    setFieldErrors({});
    setOpen(true);
  }

  async function submit(draft: CategoryDraft) {
    setPending(true);
    setError(null);
    const outcome = await saveCategory(repo, category?.id ?? null, draft);
    setPending(false);
    if (outcome.status === "done") {
      setOpen(false);
      onSaved(outcome.value);
      return;
    }
    setError(writeErrorMessage(outcome));
    setFieldErrors(outcome.status === "invalid" ? outcome.fields : {});
  }

  return {
    open,
    category,
    pending,
    error,
    fieldErrors,
    start,
    close: () => {
      setOpen(false);
    },
    submit,
  };
}
