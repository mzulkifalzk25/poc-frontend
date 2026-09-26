import type { ReactNode } from "react";
import { Link } from "react-router";

import { Logo } from "~/components/ui/Logo";
import { useOnlineStatus } from "~/components/ui/useOnlineStatus";
import { t } from "~/i18n/t";

const arrowIcon = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

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
  const strings = t().activate;
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-navy-deep px-4 py-24 text-white">
      <div className="absolute start-8 top-7 flex items-center gap-2.5">
        <Logo variant="gold" size={36} />
        <span className="font-heading text-[21px] font-bold">
          Mart<span className="text-gold">Desk</span>
        </span>
        <span className="ms-0.5 flex h-[26px] items-center rounded-pill bg-blue-mid px-2.5 text-[11px] font-bold tracking-[0.06em] text-[#C3D0DF] uppercase">
          {strings.portalTag}
        </span>
      </div>
      <div className="absolute end-8 top-7">
        <OnlinePill />
      </div>
      {children}
      <Link
        to="/"
        className="absolute start-1/2 bottom-[30px] flex -translate-x-1/2 items-center gap-2 rounded text-sm text-[#9FB0C4] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none rtl:translate-x-1/2"
      >
        {strings.ownerPrompt}
        <span className="flex items-center gap-1.5 font-semibold text-[#F9D27F]">
          {strings.ownerLink}
          {arrowIcon}
        </span>
      </Link>
    </div>
  );
}
