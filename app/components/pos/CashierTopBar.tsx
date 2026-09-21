import type { ReactNode } from "react";

import { Logo } from "~/components/ui/Logo";
import { getDeviceCounter } from "~/infrastructure/session/device-store";
import { useSession } from "~/infrastructure/session/use-session";

interface CashierTopBarProps {
  title: string;
  actions?: ReactNode;
}

export function CashierTopBar({ title, actions }: CashierTopBarProps) {
  const session = useSession();
  const counter = getDeviceCounter();
  const online = typeof navigator === "undefined" ? true : navigator.onLine;

  const context = [
    "Fresh Basket Mart",
    counter?.name,
    session?.role === "cashier" ? session.fullName : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="flex h-16 flex-shrink-0 items-center gap-4 bg-navy px-6 text-white">
      <div className="flex items-center gap-3">
        <Logo variant="gold" size={30} />
        <span className="font-heading text-lg font-bold">{title}</span>
      </div>
      <span className="text-sm text-[#9FB0C4]">{context}</span>
      <div className="ml-auto flex items-center gap-3">
        <span
          className={`flex h-9 items-center gap-2 rounded-pill px-3.5 text-sm font-semibold ${
            online
              ? "bg-[#1B3F63] text-[#B5EBD2]"
              : "bg-[#4A3512] text-[#FFD89A]"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${online ? "bg-success" : "bg-gold-dark"}`}
          />
          {online ? "Online" : "Offline"}
        </span>
        {actions}
      </div>
    </header>
  );
}
