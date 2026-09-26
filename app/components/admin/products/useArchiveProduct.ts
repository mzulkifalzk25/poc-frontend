import { useState } from "react";

import {
  setProductArchived,
  type ArchiveAction,
  type ProductRepository,
} from "~/use_cases/manage-products";

import { writeErrorMessage } from "../writeError";

interface ArchiveTarget {
  id: number;
  name: string;
}

interface ArchiveOptions {
  repo: ProductRepository;
  onDone: (target: ArchiveTarget, action: ArchiveAction) => void;
}

export function useArchiveProduct({ repo, onDone }: ArchiveOptions) {
  const [target, setTarget] = useState<ArchiveTarget | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(product: ArchiveTarget, action: ArchiveAction) {
    setPending(true);
    setError(null);
    const outcome = await setProductArchived(repo, product.id, action);
    setPending(false);
    if (outcome.status === "done") {
      setTarget(null);
      onDone(product, action);
    } else {
      setError(writeErrorMessage(outcome));
    }
  }

  return {
    target,
    pending,
    error,
    ask: (product: ArchiveTarget) => {
      setError(null);
      setTarget(product);
    },
    cancel: () => {
      setTarget(null);
    },
    confirm: () => (target ? run(target, "archive") : Promise.resolve()),
    restore: (product: ArchiveTarget) => run(product, "restore"),
  };
}
