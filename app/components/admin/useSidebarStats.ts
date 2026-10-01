import { useEffect, useState } from "react";

import { reportRepository } from "~/infrastructure/api/report-repository";
import { settingsRepository } from "~/infrastructure/api/settings-repository";

export interface SidebarStats {
  storeName: string | null;
  salesToday: string | null;
  billsToday: number | null;
  lowStock: number | null;
}

const EMPTY: SidebarStats = {
  storeName: null,
  salesToday: null,
  billsToday: null,
  lowStock: null,
};

// The store name and today's figures; each stays empty if its request fails.
export function useSidebarStats(): SidebarStats {
  const [stats, setStats] = useState<SidebarStats>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    settingsRepository.load().then(
      (settings) => {
        if (!cancelled) {
          setStats((current) => ({
            ...current,
            storeName: settings.storeName,
          }));
        }
      },
      () => undefined,
    );
    reportRepository.dashboard().then(
      (dashboard) => {
        if (!cancelled) {
          setStats((current) => ({
            ...current,
            salesToday: dashboard.sales,
            billsToday: dashboard.bills,
            lowStock: dashboard.lowStockCount,
          }));
        }
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return stats;
}
