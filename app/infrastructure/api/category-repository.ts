import type { Category } from "~/domain/category";
import type { CategoryRepository } from "~/use_cases/manage-categories";

import { apiClient } from "./client";

interface CategoryDto {
  id: number;
  name: string;
  tint: string;
  product_count?: number;
}

function toCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    tint: dto.tint,
    productCount: dto.product_count ?? 0,
  };
}

export const categoryRepository: CategoryRepository = {
  list: async () => {
    const response = await apiClient.get<CategoryDto[]>("/categories");
    return response.map(toCategory);
  },
  create: async (draft) =>
    toCategory(await apiClient.post<CategoryDto>("/categories", draft)),
  update: async (id, draft) =>
    toCategory(
      await apiClient.patch<CategoryDto>(`/categories/${String(id)}`, draft),
    ),
  remove: async (id) => {
    await apiClient.delete(`/categories/${String(id)}`);
  },
  moveProducts: async (fromId, toId) => {
    await apiClient.post(`/categories/${String(fromId)}/move-products`, {
      to_category_id: toId,
    });
  },
};
