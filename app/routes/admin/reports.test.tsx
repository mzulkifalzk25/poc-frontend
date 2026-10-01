import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "~/components/ui/ToastProvider";
import {
  installFakeFetch,
  jsonResponse,
  type FakeRoute,
} from "~/infrastructure/api/fake-fetch";

import ReportsRoute from "./reports";

const summary = {
  group: "week",
  kpis: {
    revenue: "1593000000.00",
    gross_profit: "306000000.00",
    bills: 1500000,
    average_bill: "1062.00",
    refund_count: 3,
  },
  periods: [
    {
      period: "2026-08-20",
      end: "2026-08-26",
      revenue: "362000000.00",
      gross_profit: "70000000.00",
      bills: 100,
    },
    {
      period: "2026-08-27",
      end: "2026-09-02",
      revenue: "391000000.00",
      gross_profit: "80000000.00",
      bills: 100,
    },
  ],
};

const Stub = createRoutesStub([
  {
    path: "/admin/reports",
    Component: () => (
      <ToastProvider>
        <ReportsRoute />
      </ToastProvider>
    ),
  },
]);

function install(extra: Record<string, FakeRoute> = {}) {
  return installFakeFetch({
    "GET /reports/summary": () => jsonResponse(200, summary),
    "GET /reports/categories": () =>
      jsonResponse(200, [
        {
          name: "Grocery",
          tint: "green",
          revenue: "605000000.00",
          profit: "97000000.00",
          margin: "16.0",
        },
      ]),
    "GET /reports/cashiers": () =>
      jsonResponse(200, {
        total_cashiers: 48,
        refund_count: 1204,
        results: [
          {
            cashier_id: 1,
            name: "Zainab Khan",
            is_active: true,
            bills: 31410,
            revenue: "33400000.00",
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

describe("ReportsRoute", () => {
  it("shows the figures, cashier performance and profit by category", async () => {
    install();
    render(<Stub initialEntries={["/admin/reports"]} />);

    expect(await screen.findByText("Rs 1,593M")).toBeInTheDocument();
    expect(screen.getByText("Rs 306M")).toBeInTheDocument();
    expect(screen.getByText("1,500,000")).toBeInTheDocument();
    expect(screen.getByText("Rs 1,062")).toBeInTheDocument();
    expect(await screen.findByText("Zainab Khan")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Top 1 of 48 cashiers by revenue. Refunds in this period: 1,204.",
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText("16%")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Revenue and profit by period" }),
    ).toBeInTheDocument();
  });

  it("asks for the chosen period", async () => {
    const fetchMock = install();
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/reports"]} />);
    await screen.findByText("Rs 1,593M");

    await user.click(screen.getByRole("button", { name: "Today" }));

    await vi.waitFor(() => {
      const urls = fetchMock.mock.calls.map((call) => call[0]);
      expect(
        urls.some(
          (url) =>
            url.includes("/reports/summary") && url.includes("group=hour"),
        ),
      ).toBe(true);
    });
  });

  it("refuses a range that ends before it starts", async () => {
    const fetchMock = install();
    render(
      <Stub
        initialEntries={[
          "/admin/reports?period=custom&from=2026-09-19&to=2026-09-01",
        ]}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Choose a range of up to a year",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("says when the period had no sales", async () => {
    install({
      "GET /reports/summary": () =>
        jsonResponse(200, {
          ...summary,
          kpis: { ...summary.kpis, bills: 0, revenue: "0.00" },
          periods: [],
        }),
      "GET /reports/categories": () => jsonResponse(200, []),
      "GET /reports/cashiers": () =>
        jsonResponse(200, { total_cashiers: 0, refund_count: 0, results: [] }),
    });
    render(<Stub initialEntries={["/admin/reports"]} />);

    expect(
      (await screen.findAllByText("No sales in this period.")).length,
    ).toBeGreaterThan(0);
  });
});
