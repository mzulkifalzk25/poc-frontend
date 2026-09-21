import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router";

import { Logo } from "~/components/ui/Logo";
import { getInitials } from "~/domain/initials";
import { setSession } from "~/infrastructure/session/session-store";
import { useSession } from "~/infrastructure/session/use-session";

interface NavItem {
  label: string;
  to: string;
  end?: boolean;
  icon: ReactNode;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        to: "/admin",
        end: true,
        icon: (
          <svg {...iconProps}>
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Catalogue",
    items: [
      {
        label: "Products",
        to: "/admin/products",
        icon: (
          <svg {...iconProps}>
            <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
            <path d="M3 8l9 5 9-5M12 13v8" />
          </svg>
        ),
      },
      {
        label: "Categories",
        to: "/admin/categories",
        icon: (
          <svg {...iconProps}>
            <rect x="3" y="3" width="8" height="8" rx="2" />
            <rect x="13" y="3" width="8" height="8" rx="2" />
            <rect x="3" y="13" width="8" height="8" rx="2" />
            <rect x="13" y="13" width="8" height="8" rx="2" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Stock",
    items: [
      {
        label: "Inventory",
        to: "/admin/inventory",
        badge: "146",
        icon: (
          <svg {...iconProps}>
            <path d="M12 3l9 5-9 5-9-5 9-5z" />
            <path d="M3 13l9 5 9-5" />
          </svg>
        ),
      },
      {
        label: "Receive stock",
        to: "/admin/receive",
        icon: (
          <svg {...iconProps}>
            <path d="M3 7h13v10H3zM16 10h3l2 3v4h-5" />
            <circle cx="7" cy="18" r="1.6" />
            <circle cx="17" cy="18" r="1.6" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Sales and insights",
    items: [
      {
        label: "Sales",
        to: "/admin/sales",
        icon: (
          <svg {...iconProps}>
            <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
            <path d="M9 8h6M9 12h6" />
          </svg>
        ),
      },
      {
        label: "Reports",
        to: "/admin/reports",
        icon: (
          <svg {...iconProps}>
            <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
          </svg>
        ),
      },
      {
        label: "Money trail",
        to: "/admin/money-trail",
        icon: (
          <svg {...iconProps}>
            <path d="M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            <path d="M3 7l12-3v3M16.5 14h2" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Manage",
    items: [
      {
        label: "Staff",
        to: "/admin/staff",
        icon: (
          <svg {...iconProps}>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
            <path d="M16 4.5a3.5 3.5 0 010 7M18 14.5c2 .7 3.5 2.5 3.5 5.5" />
          </svg>
        ),
      },
      {
        label: "Activity log",
        to: "/admin/activity-log",
        icon: (
          <svg {...iconProps}>
            <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        ),
      },
      {
        label: "Settings",
        to: "/admin/settings",
        icon: (
          <svg {...iconProps}>
            <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
            <circle cx="16" cy="6" r="2" />
            <circle cx="10" cy="12" r="2" />
            <circle cx="18" cy="18" r="2" />
          </svg>
        ),
      },
    ],
  },
];

export function AdminSidebar() {
  const session = useSession();
  const navigate = useNavigate();

  function handleSignOut() {
    setSession(null);
    void navigate("/");
  }

  return (
    <div className="flex h-screen w-60 flex-shrink-0 flex-col border-r border-blue-mid bg-navy text-white">
      <div className="flex items-center gap-2.5 px-[18px] pt-[22px] pb-4">
        <Logo variant="gold" size={36} />
        <div className="flex flex-col leading-tight">
          <span className="font-heading text-xl font-bold">
            Mart<span className="text-gold">Desk</span>
          </span>
          <span className="text-[11px] font-semibold tracking-wide text-[#8FA0B5] uppercase">
            Owner console
          </span>
        </div>
      </div>

      <div className="mx-3.5 mb-1.5 flex items-center gap-2.5 rounded-card border border-[#24405F] bg-[#16304F] px-3 py-2.5">
        <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[9px] bg-category-bakery-bg text-sm font-bold text-[#7A5A05]">
          FB
        </div>
        <div className="flex min-w-0 flex-grow flex-col">
          <span className="text-sm font-semibold">Fresh Basket Mart</span>
          <span className="text-xs text-[#9FB0C4]">Your store</span>
        </div>
      </div>

      <nav
        aria-label="Admin navigation"
        className="flex flex-grow flex-col gap-0.5 px-3.5"
      >
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-2 pt-3.5 pb-1.5 text-[11px] font-bold tracking-wider text-[#8FA0B5] uppercase">
              {group.label}
            </div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex h-10 items-center gap-2.5 rounded-card px-2.5 text-sm ${
                    isActive
                      ? "bg-blue-mid font-semibold text-white"
                      : "font-medium text-[#B8C4D3] hover:bg-[#16304F]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-gold text-navy"
                          : "bg-[#16304F] text-[#9FB0C4]"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-grow">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-pill bg-[#4A3512] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#FFD89A]">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <NavLink
        to="/admin"
        className="mx-3.5 mt-2.5 flex flex-col gap-2 rounded-card border border-blue-mid-2 bg-[#14355A] px-3.5 py-3"
      >
        <span className="text-[11px] font-bold tracking-wider text-[#F9D27F] uppercase">
          Today so far
        </span>
        <div className="flex items-baseline justify-between">
          <span className="font-heading text-2xl leading-none font-bold">
            Rs 40.1M
          </span>
          <span className="text-xs text-[#B6C8DA]">37,742 bills</span>
        </div>
        <span className="text-xs text-[#B6C8DA]">
          Tap to open the dashboard
        </span>
      </NavLink>

      <div className="flex items-center gap-2.5 px-[18px] pt-2.5 pb-3.5">
        <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-category-bakery-bg text-sm font-bold text-[#7A5A05]">
          {getInitials(session?.fullName ?? "")}
        </div>
        <div className="flex flex-grow flex-col">
          <span className="text-sm font-semibold">{session?.fullName}</span>
          <span className="text-xs text-[#9FB0C4] capitalize">
            {session?.role}
          </span>
        </div>
        <button
          type="button"
          aria-label="Sign out"
          onClick={handleSignOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#16304F] text-[#B8C4D3] hover:bg-[#1D3D60]"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4M16 8l4 4-4 4M20 12H9" />
          </svg>
        </button>
      </div>
    </div>
  );
}
