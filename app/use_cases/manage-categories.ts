import {
  cleanCategoryName,
  type Category,
  type CategoryDraft,
} from "~/domain/category";

import { runAdminWrite, type WriteOutcome } from "./admin-write";

export interface CategoryRepository {
  list: () => Promise<Category[]>;
  create: (draft: CategoryDraft) => Promise<Category>;
  update: (id: number, draft: CategoryDraft) => Promise<Category>;
  remove: (id: number) => Promise<void>;
  moveProducts: (fromId: number, toId: number) => Promise<void>;
}

export function saveCategory(
  repo: CategoryRepository,
  id: number | null,
  draft: CategoryDraft,
): Promise<WriteOutcome<Category>> {
  const clean = { ...draft, name: cleanCategoryName(draft.name) };
  return runAdminWrite(() =>
    id === null ? repo.create(clean) : repo.update(id, clean),
  );
}

export const CATEGORY_HAS_PRODUCTS = "category_has_products";

export type DeleteCategoryOutcome =
  WriteOutcome<undefined> | { status: "has_products" };

export async function deleteCategory(
  repo: CategoryRepository,
  id: number,
): Promise<DeleteCategoryOutcome> {
  const outcome = await runAdminWrite(async () => {
    await repo.remove(id);
    return undefined;
  });
  if (outcome.status === "conflict" && outcome.code === CATEGORY_HAS_PRODUCTS) {
    return { status: "has_products" };
  }
  return outcome;
}

export async function moveProductsAndDelete(
  repo: CategoryRepository,
  fromId: number,
  toId: number,
): Promise<DeleteCategoryOutcome> {
  if (fromId === toId) {
    throw new Error("Products must move to a different category");
  }
  const moved = await runAdminWrite(() => repo.moveProducts(fromId, toId));
  if (moved.status !== "done") {
    return moved;
  }
  return deleteCategory(repo, fromId);
}
