import type { ReactNode } from "react";
import { Link } from "react-router";

import { Logo } from "~/components/ui/Logo";
import { useOnlineStatus } from "~/components/ui/useOnlineStatus";
import { getInitials } from "~/domain/initials";
import { t } from "~/i18n/t";

interface CashierTopBarProps {
  storeName: string;
  counterName: string | null;
  cashierName: string | null;
  statusPill?: ReactNode;
  heldCount?: number;
}

const navClass =
  "flex h-10 items-center rounded-input border border-[#33587F] px-3.5 text-sm font-semibold text-white transition hover:bg-blue-mid focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none active:bg-blue-mid-2";

function DefaultPill() {
  const online = useOnlineStatus();
  return (
    <span
      className={`flex h-9 items-center gap-2 rounded-pill px-3.5 text-[13px] font-semibold ${online ? "bg-[#1B3F63] text-[#B5EBD2]" : "bg-[#4A3512] text-[#FFD89A]"}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-success" : "bg-gold-dark"}`}
      />
      {online ? t().common.online : t().common.offline}
    </span>
  );
}

export function CashierTopBar({
  storeName,
  counterName,
  cashierName,
  statusPill,
  heldCount,
}: CashierTopBarProps) {
  const strings = t().posNav;
  const firstName = cashierName?.split(" ")[0] ?? "";
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between gap-4 bg-navy px-5 text-white">
      <div className="flex items-center gap-4">
        <Link
          to="/pos"
          className="flex items-center gap-2.5 rounded focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          <Logo variant="gold" size={30} />
          <span className="font-heading text-xl font-bold">
            Mart<span className="text-gold">Desk</span>
          </span>
        </Link>
        <span aria-hidden="true" className="h-7 w-px bg-[#294A6E]" />
        <span className="text-sm text-[#C3D0DF]">
          {storeName}
          {counterName && (
            <>
              {" · "}
              <b className="text-white">{counterName}</b>
            </>
          )}
        </span>
      </div>
      <nav aria-label={strings.store} className="flex items-center gap-3.5">
        {statusPill ?? <DefaultPill />}
        <Link to="/pos/returns" className={navClass}>
          {strings.returns}
        </Link>
        <Link to="/pos/held" className={navClass}>
          {heldCount ? strings.heldCount(heldCount) : strings.held}
        </Link>
        {cashierName && (
          <span className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-category-dairy-bg text-[13px] font-bold text-category-dairy-ink"
            >
              {getInitials(cashierName)}
            </span>
            <span className="text-sm font-semibold">{firstName}</span>
          </span>
        )}
        <Link
          to="/pos/shift"
          className="flex h-10 items-center rounded-input bg-blue-mid px-3.5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none active:brightness-125"
        >
          {strings.endShift}
        </Link>
      </nav>
    </header>
  );
}
