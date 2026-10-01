import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "~/components/ui/ToastProvider";
import {
  installFakeFetch,
  jsonResponse,
  type FakeRoute,
} from "~/infrastructure/api/fake-fetch";

import InventoryRoute from "./inventory";
import InventoryAdjustRoute from "./inventory-adjust";

function row(id: number, name: string, stock: string, status: string) {
  return {
    id,
    name,
    barcode: `896100000000${String(id)}`,
    unit: "pcs",
    price: "100.00",
    cost: "80.00",
    stock,
    status,
    low_stock_alert: "10.000",
    category: { id: 1, name: "Grocery", tint: "grocery" },
  };
}

const page = {
  count: 2,
  results: [
    row(1, "Cooking Oil 1L", "9.000", "low"),
    row(2, "Sugar 1kg", "0.000", "out"),
  ],
  summary: {
    units_in_stock: "1284.000",
    stock_value: "186400.00",
    low_count: 1,
    out_count: 1,
  },
};

const movements = {
  results: [
    {
      id: 5,
      occurred_at: "2026-09-19T10:00:00Z",
      product: { id: 1, name: "Cooking Oil 1L" },
      type: "adjust_add",
      qty_delta: "60.000",
      reason: "received",
      note: "",
      user: "Sana Ahmed",
    },
  ],
  next_cursor: null,
};

const Stub = createRoutesStub([
  {
    path: "/admin/inventory",
    Component: () => (
      <ToastProvider>
        <InventoryRoute />
      </ToastProvider>
    ),
    children: [{ path: "adjust", Component: InventoryAdjustRoute }],
  },
]);

function install(extra: Record<string, FakeRoute> = {}) {
  return installFakeFetch({
    "GET /stock": () => jsonResponse(200, page),
    "GET /stock/movements": () => jsonResponse(200, movements),
    "GET /products/1": () =>
      jsonResponse(200, {
        ...row(1, "Cooking Oil 1L", "9.000", "low"),
        is_archived: false,
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

describe("InventoryRoute", () => {
  it("shows the figures, the stock table and recent adjustments", async () => {
    install();
    render(<Stub initialEntries={["/admin/inventory"]} />);

    const table = await screen.findByRole("table", { name: "Stock levels" });

    expect(within(table).getByText("Cooking Oil 1L")).toBeInTheDocument();
    expect(within(table).getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("Rs 186,400")).toBeInTheDocument();
    expect(screen.getByText("1,284")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Low · 1/ })).toBeInTheDocument();
    expect(screen.getByText("+60")).toBeInTheDocument();
    expect(screen.getByText(/Received · Sana Ahmed/)).toBeInTheDocument();
  });

  it("asks the server for the low-stock rows when the chip is chosen", async () => {
    const fetchMock = install();
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/inventory"]} />);
    await screen.findByRole("table", { name: "Stock levels" });

    await user.click(screen.getByRole("button", { name: /Low · 1/ }));

    await vi.waitFor(() => {
      const urls = fetchMock.mock.calls.map((call) => call[0]);
      expect(
        urls.some(
          (url) => url.includes("/stock?") && url.includes("status=low"),
        ),
      ).toBe(true);
    });
  });

  it("adjusts stock with a reason and an idempotency key", async () => {
    const sent: { body: unknown; key: string | null }[] = [];
    const fetchMock = install({
      "POST /stock/adjust": (body) => {
        sent.push({ body, key: null });
        return jsonResponse(200, { before: "9.000", after: "69.000" });
      },
    });
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/inventory/adjust?product=1"]} />);

    await user.type(await screen.findByLabelText("Quantity"), "60");
    expect(screen.getByText(/9 → 69/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Reason"), "damaged");
    await user.click(screen.getByRole("button", { name: "Save adjustment" }));

    expect(
      await screen.findByText("Stock of Cooking Oil 1L updated"),
    ).toBeInTheDocument();
    expect(sent[0]?.body).toEqual({
      product_id: 1,
      mode: "add",
      qty: "60.000",
      reason: "damaged",
      note: "",
    });
    const call = fetchMock.mock.calls.find((c) =>
      c[0].endsWith("/stock/adjust"),
    );
    const headers = (call?.[1] as RequestInit).headers as Record<
      string,
      string
    >;
    expect(headers["Idempotency-Key"]).toMatch(/[0-9a-f-]{36}/);
  });

  it("will not save without a quantity", async () => {
    install();
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/inventory/adjust?product=1"]} />);

    await user.click(
      await screen.findByRole("button", { name: "Save adjustment" }),
    );

    expect(screen.getByText("Enter a quantity.")).toBeInTheDocument();
  });
});
