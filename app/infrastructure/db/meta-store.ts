import { db as appDb, type MartDeskDatabase } from "./database";

export function createMetaStore(database: MartDeskDatabase) {
  return {
    get: async <T>(key: string): Promise<T | null> => {
      const row = await database.meta.get(key);
      return row ? (row.value as T) : null;
    },
    set: async (key: string, value: unknown): Promise<void> => {
      await database.meta.put({ key, value });
    },
    remove: async (key: string): Promise<void> => {
      await database.meta.delete(key);
    },
  };
}

export type MetaStore = ReturnType<typeof createMetaStore>;

export const metaStore = createMetaStore(appDb);
