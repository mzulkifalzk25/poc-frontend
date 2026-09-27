import type { ReactNode } from "react";

import { Logo } from "~/components/ui/Logo";
import { useOnlineStatus } from "~/components/ui/useOnlineStatus";
import { t } from "~/i18n/t";

function OnlinePill() {
  const online = useOnlineStatus();
  return (
    <span
      className={`flex h-9 items-center gap-2 rounded-pill px-3.5 text-[13px] font-semibold ${
        online ? "bg-[#1B3F63] text-[#B5EBD2]" : "bg-[#4A3512] text-[#FFD89A]"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-success" : "bg-gold-dark"}`}
      />
      {online ? t().common.online : t().common.offline}
    </span>
  );
}

export function CashierPortalFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-navy-deep px-4 py-24 text-white">
      <div className="absolute start-8 top-7 flex items-center gap-2.5">
        <Logo variant="gold" size={36} />
        <span className="font-heading text-[21px] font-bold">
          Mart<span className="text-gold">Desk</span>
        </span>
      </div>
      <div className="absolute end-8 top-7">
        <OnlinePill />
      </div>
      {children}
    </div>
  );
}
