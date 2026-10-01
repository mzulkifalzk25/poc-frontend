import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoutesStub } from "react-router";

import { en } from "~/i18n/strings";
import {
  installFakeFetch,
  jsonResponse,
} from "~/infrastructure/api/fake-fetch";
import { setSession } from "~/infrastructure/session/session-store";

import { AdminSidebar } from "./AdminSidebar";

const Stub = createRoutesStub([{ path: "/admin", Component: AdminSidebar }]);

function renderSidebar() {
  render(<Stub initialEntries={["/admin"]} />);
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
  localStorage.clear();
  sessionStorage.clear();
  setSession({
    role: "manager",
    accessToken: "a",
    refreshToken: "r",
    userId: 2,
    fullName: "Bilal Khan",
  });
});

describe("AdminSidebar", () => {
  it("shows every group and page label from the string layer", async () => {
    renderSidebar();

    const nav = await screen.findByRole("navigation", {
      name: en.adminNav.label,
    });
    for (const group of Object.values(en.adminNav.groups)) {
      expect(nav).toHaveTextContent(group);
    }
    expect(
      screen.getByRole("link", { name: en.adminPages.moneyTrail }),
    ).toHaveAttribute("href", "/admin/money-trail");
    expect(
      screen.getByRole("link", { name: en.adminPages.activityLog }),
    ).toHaveAttribute("href", "/admin/activity-log");
  });

  it("shows the role name for the signed-in user", async () => {
    renderSidebar();

    expect(await screen.findByText("Bilal Khan")).toBeInTheDocument();
    expect(screen.getByText(en.adminNav.roles.manager)).toBeInTheDocument();
  });

  it("uses a logical end border so right-to-left can flip it", async () => {
    renderSidebar();

    const nav = await screen.findByRole("navigation", {
      name: en.adminNav.label,
    });
    const sidebar = nav.parentElement;
    expect(sidebar).toHaveClass("border-e");
    expect(sidebar).not.toHaveClass("border-r");
  });

  it("labels the sign out button", async () => {
    renderSidebar();

    expect(
      await screen.findByRole("button", { name: en.common.signOut }),
    ).toBeInTheDocument();
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("AdminSidebar figures", () => {
  it("shows the store name, today's sales and the low stock count", async () => {
    installFakeFetch({
      "GET /tenant/settings": () =>
        jsonResponse(200, {
          store_name: "Al Madina Mart",
          phone: "",
          address: "",
          logo: "",
          currency: "PKR",
          tax_rate: "0.00",
          prices_include_tax: false,
          block_when_out_of_stock: false,
          receipt_paper_mm: 80,
          receipt_header: "",
          receipt_footer: "",
          receipt_show_barcode: true,
        }),
      "GET /reports/dashboard": () =>
        jsonResponse(200, {
          date: "2026-09-19",
          today: {
            sales: "40100000.00",
            bills: 37742,
            items: "1",
            refunds: { count: 0, amount: "0" },
            sales_change: null,
            bills_change: null,
            items_change: null,
          },
          low_stock_count: 12,
          series_7: [],
          series_30: [],
          categories: [],
          category_total: "0",
          top_products: [],
          low_stock: [],
        }),
    });
    renderSidebar();

    expect(await screen.findByText("Al Madina Mart")).toBeInTheDocument();
    expect(await screen.findByText("Rs 40.1M")).toBeInTheDocument();
    expect(
      screen.getByText(en.adminNav.today.bills(37742)),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Inventory/ })).toHaveTextContent(
      "12",
    );
  });

  it("still renders when the figures cannot load", async () => {
    installFakeFetch({});
    renderSidebar();

    expect(await screen.findByText(en.adminNav.yourStore)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Inventory/ }),
    ).not.toHaveTextContent(/\d/);
  });
});

describe("AdminSidebar staff links", () => {
  const StaffStub = createRoutesStub([
    { path: "/admin/staff", Component: AdminSidebar },
  ]);

  it("has an Add cashier link under Staff", async () => {
    installFakeFetch({});
    render(<Stub initialEntries={["/admin"]} />);

    const add = await screen.findByRole("link", { name: "Add cashier" });

    expect(add).toHaveAttribute("href", "/admin/staff?add=1");
    const links = screen.getAllByRole("link").map((link) => link.textContent);
    expect(links.indexOf("Add cashier")).toBe(links.indexOf("Staff") + 1);
  });

  it("highlights only the one that is open", async () => {
    installFakeFetch({});
    render(<StaffStub initialEntries={["/admin/staff?add=1"]} />);

    const add = await screen.findByRole("link", { name: "Add cashier" });

    expect(add).toHaveClass("bg-blue-mid");
    expect(screen.getByRole("link", { name: "Staff" })).not.toHaveClass(
      "bg-blue-mid",
    );
  });

  it("highlights Staff, not Add cashier, on the plain staff page", async () => {
    installFakeFetch({});
    render(<StaffStub initialEntries={["/admin/staff"]} />);

    const staff = await screen.findByRole("link", { name: "Staff" });

    expect(staff).toHaveClass("bg-blue-mid");
    expect(screen.getByRole("link", { name: "Add cashier" })).not.toHaveClass(
      "bg-blue-mid",
    );
  });
});
