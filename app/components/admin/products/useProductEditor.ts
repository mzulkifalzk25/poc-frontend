import { useState } from "react";

import type { ProductDetail } from "~/domain/product";
import type { ProductEditDraft } from "~/domain/product-draft";
import {
  updateProduct,
  type ProductRepository,
} from "~/use_cases/manage-products";

import { writeErrorMessage } from "../writeError";
import { fieldMessages, type FieldMessages } from "./fieldMessages";

interface EditorOptions {
  repo: ProductRepository;
  productId: number;
  onSaved: (product: ProductDetail) => void;
}

export function useProductEditor({ repo, productId, onSaved }: EditorOptions) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldMessages>({});

  async function submit(draft: ProductEditDraft) {
    setPending(true);
    setError(null);
    const outcome = await updateProduct(repo, productId, draft);
    setPending(false);
    if (outcome.status === "done") {
      setErrors({});
      onSaved(outcome.value);
    } else if (outcome.status === "rejected") {
      setErrors(fieldMessages(outcome.fields));
    } else {
      setError(writeErrorMessage(outcome));
      setErrors(
        outcome.status === "invalid" ? fieldMessages({}, outcome.fields) : {},
      );
    }
  }

  return { pending, error, errors, submit };
}
