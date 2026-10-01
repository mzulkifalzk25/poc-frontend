import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installFakeFetch,
  jsonResponse,
  type FakeRoute,
} from "~/infrastructure/api/fake-fetch";

import SalesRoute from "./sales";

function bill(n: number, extra: object = {}) {
  return {
    id: `b${String(n)}`,
    bill_no: `00200074${String(n)}`,
    time: "2026-09-19T12:47:03Z",
    cashier: "Zainab Khan",
    items: "3.000",
    payment: "cash",
    total: "1350.00",
    status: "paid",
    ...extra,
  };
}

const list = {
  summary: { bills: 2, total: "2700.00" },
  results: [bill(2), bill(1, { status: "refunded", payment: "card" })],
  next_cursor: null,
};

const detail = {
  ...bill(2),
  cashier: { id: 4, name: "Zainab Khan" },
  counter: { id: 2, name: "Counter 2", code: "002" },
  payment: {
    method: "cash",
    amount: "1350.00",
    tendered: "2000.00",
    change_given: "650.00",
  },
  items: [
    {
      line_no: 1,
      name: "Basmati Rice 5kg",
      barcode: "896",
      qty: "2.000",
      unit_price: "675.00",
      line_total: "1350.00",
    },
  ],
  totals: {
    subtotal: "1350.00",
    tax: "0.00",
    rounding: "0.00",
    total: "1350.00",
  },
  flags: [],
  returns: [
    {
      id: "r1",
      returned_at: "2026-09-19T14:00:00Z",
      refund_total: "675.00",
      refund_method: "cash",
      reason: "changed_mind",
      items: 1,
    },
  ],
};

const Stub = createRoutesStub([
  { path: "/admin/sales", Component: SalesRoute },
]);

function install(extra: Record<string, FakeRoute> = {}) {
  return installFakeFetch({
    "GET /bills": () => jsonResponse(200, list),
    "GET /bills/b2": () => jsonResponse(200, detail),
    "GET /users": () =>
      jsonResponse(200, {
        count: 1,
        results: [
          {
            id: 4,
            full_name: "Zainab Khan",
            initials: "ZK",
            role: "cashier",
            email: null,
            username: null,
            default_counter_id: 2,
            is_active: true,
            last_active_at: null,
          },
        ],
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

describe("SalesRoute", () => {
  it("lists the day's bills with the summary", async () => {
    install();
    render(<Stub initialEntries={["/admin/sales?date=2026-09-19"]} />);

    const table = await screen.findByRole("table", { name: "Bills" });

    expect(screen.getByText("2 bills · Rs 2,700")).toBeInTheDocument();
    expect(within(table).getByText("002-000742")).toBeInTheDocument();
    expect(within(table).getByText("Refunded")).toBeInTheDocument();
    expect(within(table).getByText("Card")).toBeInTheDocument();
  });

  it("opens a bill with its items, payment, refunds and a reprint link", async () => {
    install();
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/sales?date=2026-09-19"]} />);

    await user.click(
      await screen.findByRole("button", { name: "Open bill 002-000742" }),
    );

    const panel = await screen.findByLabelText("Bill");
    expect(
      await within(panel).findByText("Basmati Rice 5kg"),
    ).toBeInTheDocument();
    expect(within(panel).getByText("Counter 2")).toBeInTheDocument();
    expect(within(panel).getByText("Rs 2,000")).toBeInTheDocument();
    expect(within(panel).getByText("Rs 675 · cash")).toBeInTheDocument();
    expect(
      within(panel).getByRole("link", { name: "Reprint receipt" }),
    ).toHaveAttribute("href", "/admin/receipt?bill=b2");
  });

  it("sends the chosen filters to the server", async () => {
    const fetchMock = install();
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/sales?date=2026-09-19"]} />);
    await screen.findByRole("table", { name: "Bills" });

    await user.selectOptions(await screen.findByLabelText("Payment"), "card");

    await vi.waitFor(() => {
      const urls = fetchMock.mock.calls.map((call) => call[0]);
      expect(
        urls.some(
          (url) =>
            url.includes("payment=card") && url.includes("date=2026-09-19"),
        ),
      ).toBe(true);
    });
  });

  it("loads the next page when asked", async () => {
    let calls = 0;
    install({
      "GET /bills": () => {
        calls += 1;
        return jsonResponse(
          200,
          calls === 1
            ? { ...list, results: [bill(2)], next_cursor: "abc" }
            : { ...list, results: [bill(1)], next_cursor: null },
        );
      },
    });
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/sales?date=2026-09-19"]} />);

    await user.click(await screen.findByRole("button", { name: "Load more" }));

    expect(await screen.findByText("002-000741")).toBeInTheDocument();
    expect(screen.getByText("002-000742")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Load more" }),
    ).not.toBeInTheDocument();
  });

  it("says when the day has no bills", async () => {
    install({
      "GET /bills": () =>
        jsonResponse(200, {
          summary: { bills: 0, total: "0.00" },
          results: [],
          next_cursor: null,
        }),
    });
    render(<Stub initialEntries={["/admin/sales?date=2026-09-19"]} />);

    expect(await screen.findByText("No bills found")).toBeInTheDocument();
  });
});
