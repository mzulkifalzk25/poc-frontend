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
