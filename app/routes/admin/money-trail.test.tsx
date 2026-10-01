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

import MoneyTrailRoute from "./money-trail";

function period(day: string, sales: string, extra: object = {}) {
  return {
    period: day,
    sales_total: sales,
    sales_cash: "400.00",
    sales_card: "360.00",
    sales_wallet: "240.00",
    refunds_total: "0.00",
    refunds_count: 0,
    stock_bought: "0.00",
    net: sales,
    gross_profit: "100.00",
    ...extra,
  };
}

const money = {
  group: "day",
  periods: [
    period("2026-09-18", "1000.00"),
    period("2026-09-19", "2000.00", {
      refunds_total: "100.00",
      refunds_count: 2,
      stock_bought: "300.00",
      net: "1600.00",
    }),
  ],
  totals: {
    ...period("", "801400000.00", {
      refunds_total: "1900000.00",
      refunds_count: 760,
      stock_bought: "662000000.00",
      net: "137500000.00",
      gross_profit: "153100000.00",
    }),
    deliveries: 11,
    profit_margin: "19.1",
    refund_rate: "0.2",
  },
};

const year = {
  group: "month",
  periods: [period("2026-08", "5000.00"), period("2026-09", "3000.00")],
  totals: { ...money.totals },
};

const Stub = createRoutesStub([
  {
    path: "/admin/money-trail",
    Component: () => (
      <ToastProvider>
        <MoneyTrailRoute />
      </ToastProvider>
    ),
  },
]);

function install(extra: Record<string, FakeRoute> = {}) {
  return installFakeFetch({
    "GET /reports/money": (_body, url) =>
      jsonResponse(
        200,
        url.searchParams.get("group") === "month" ? year : money,
      ),
    "GET /reports/refunds-by-cashier": () =>
      jsonResponse(200, [
        {
          cashier_id: 1,
          name: "Zainab Khan",
          is_active: true,
          refunds_count: 5,
          refunds_amount: "570.00",
        },
        {
          cashier_id: 2,
          name: "Usman Tariq",
          is_active: false,
          refunds_count: 1,
          refunds_amount: "60.00",
        },
      ]),
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

describe("MoneyTrailRoute", () => {
  it("shows the five cards with their notes", async () => {
    install();
    render(<Stub initialEntries={["/admin/money-trail"]} />);

    expect(await screen.findByText("Rs 801.4M")).toBeInTheDocument();
    expect(screen.getByText("Rs 1.9M")).toBeInTheDocument();
    expect(screen.getByText("760 refunds · 0.2%")).toBeInTheDocument();
    expect(screen.getByText("Rs 662M")).toBeInTheDocument();
    expect(screen.getByText("11 confirmed deliveries")).toBeInTheDocument();
    expect(screen.getByText("Rs 137.5M")).toBeInTheDocument();
    expect(screen.getByText("19.1% on goods sold")).toBeInTheDocument();
  });

  it("splits sales by payment method", async () => {
    install();
    render(<Stub initialEntries={["/admin/money-trail"]} />);

    await screen.findByText("Money in: sales by payment");

    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("36%")).toBeInTheDocument();
    expect(screen.getByText("24%")).toBeInTheDocument();
  });

  it("lists refunds by cashier and marks deactivated ones", async () => {
    install();
    render(<Stub initialEntries={["/admin/money-trail"]} />);

    expect(await screen.findByText("Zainab Khan")).toBeInTheDocument();
    expect(screen.getByText("(deactivated)")).toBeInTheDocument();
    expect(screen.getByText("Rs 570")).toBeInTheDocument();
  });

  it("has a by-day table with net, newest first", async () => {
    install();
    render(<Stub initialEntries={["/admin/money-trail"]} />);

    const table = await screen.findByRole("table", { name: "Money by period" });
    const rows = within(table).getAllByRole("row");

    expect(
      within(rows[1] as HTMLElement).getByText("19 Sept"),
    ).toBeInTheDocument();
    expect(
      within(rows[1] as HTMLElement).getByText("1,600"),
    ).toBeInTheDocument();
  });

  it("loads months for the last 12 months preset", async () => {
    const fetchMock = install();
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/money-trail"]} />);
    await screen.findByText("Rs 801.4M");

    await user.click(screen.getByRole("button", { name: "Last 12 months" }));

    expect(await screen.findByText("By month")).toBeInTheDocument();
    const urls = fetchMock.mock.calls.map((call) => call[0]);
    expect(urls.some((url) => url.includes("group=month"))).toBe(true);
  });

  it("refuses a range that is too long", async () => {
    install();
    render(
      <Stub
        initialEntries={[
          "/admin/money-trail?period=custom&from=2020-01-01&to=2026-09-19",
        ]}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("up to 93 days");
  });
});
