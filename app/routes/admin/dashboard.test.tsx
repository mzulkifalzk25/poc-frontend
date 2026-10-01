import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installFakeFetch,
  jsonResponse,
  type FakeRoute,
} from "~/infrastructure/api/fake-fetch";

import DashboardRoute from "./dashboard";

function series(days: number) {
  return Array.from({ length: days }, (_, index) => ({
    date: `2026-09-${String(index + 1).padStart(2, "0")}`,
    sales: String((index + 1) * 1000),
  }));
}

const dashboard = {
  date: "2026-09-19",
  today: {
    sales: "40100000.00",
    bills: 37742,
    items: "222450.000",
    refunds: { count: 38, amount: "96400.00" },
    sales_change: "6.2",
    bills_change: "-4.1",
    items_change: null,
  },
  low_stock_count: 146,
  series_7: series(7),
  series_30: series(30),
  categories: [
    { name: "Grocery", tint: "green", revenue: "380", share: "38.0" },
  ],
  category_total: "1000.00",
  top_products: [
    {
      product_id: 1,
      name: "Basmati Rice 5kg",
      units: "2880.000",
      revenue: "4752000.00",
    },
  ],
  low_stock: [
    { product_id: 2, name: "Biscuits Pack", stock: "0.000" },
    { product_id: 3, name: "Shampoo 180ml", stock: "4.000" },
  ],
};

const Stub = createRoutesStub([{ path: "/admin", Component: DashboardRoute }]);

function install(extra: Record<string, FakeRoute> = {}) {
  return installFakeFetch({
    "GET /reports/dashboard": () => jsonResponse(200, dashboard),
    "GET /tenant/settings": () =>
      jsonResponse(200, {
        store_name: "Fresh Basket Mart",
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
    ...extra,
  });
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("DashboardRoute", () => {
  it("shows today's figures with the change and refunds line", async () => {
    install();
    render(<Stub initialEntries={["/admin"]} />);

    expect(await screen.findByText("Rs 40.1M")).toBeInTheDocument();
    expect(screen.getByText("+6.2%")).toBeInTheDocument();
    expect(screen.getByText("-4.1%")).toBeInTheDocument();
    expect(screen.getByText("37,742")).toBeInTheDocument();
    expect(screen.getByText("Rs 96,400 · 38 refunds")).toBeInTheDocument();
    expect(screen.getByText("146")).toBeInTheDocument();
    expect(await screen.findByText(/Fresh Basket Mart/)).toBeInTheDocument();
  });

  it("lists top products and low stock with restock links", async () => {
    install();
    render(<Stub initialEntries={["/admin"]} />);

    expect(await screen.findByText("Basmati Rice 5kg")).toBeInTheDocument();
    expect(screen.getByText("Rs 4,752,000")).toBeInTheDocument();
    expect(screen.getByText("Out")).toBeInTheDocument();
    expect(screen.getByText("4 left")).toBeInTheDocument();
    expect(screen.getByText("2 of 146 shown")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Restock" })).toHaveLength(2);
    expect(screen.getByText("38%")).toBeInTheDocument();
  });

  it("switches the sales chart between 7 and 30 days", async () => {
    install();
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin"]} />);

    expect(await screen.findByText("Sales, last 7 days")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "30 days" }));

    expect(screen.getByText("Sales, last 30 days")).toBeInTheDocument();
    expect(
      within(screen.getByRole("img", { name: "Daily sales" })).getAllByText(
        "Today",
      ),
    ).toHaveLength(1);
  });

  it("shows an error with retry when the figures cannot load", async () => {
    install({
      "GET /reports/dashboard": () =>
        jsonResponse(500, { error: { code: "x", message: "x" } }),
    });
    render(<Stub initialEntries={["/admin"]} />);

    expect(
      await screen.findByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});
