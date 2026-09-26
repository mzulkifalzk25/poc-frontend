import { useEffect, useState } from "react";

import { watchHeldCount } from "~/infrastructure/sync/held-bill-deps";

export function useHeldCount(shiftId: string | null): number {
  const [count, setCount] = useState(0);
  useEffect(
    () => (shiftId ? watchHeldCount(shiftId, setCount) : undefined),
    [shiftId],
  );
  return shiftId ? count : 0;
}
