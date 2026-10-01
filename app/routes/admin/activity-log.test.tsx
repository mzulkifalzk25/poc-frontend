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

import ActivityLogRoute from "./activity-log";

const page = {
  header: {
    held_bills_deleted_today: 2,
    refunds_today: 5,
    price_changes_today: 1,
  },
  results: [
    {
      id: 9,
      occurred_at: "2026-09-19T12:47:00Z",
      user: "Zainab Khan",
      action: "Refund",
      detail: "cashier Zainab · 2 items · Rs 570",
      flag: "review",
    },
    {
      id: 8,
      occurred_at: "2026-09-19T12:00:00Z",
      user: "Sana Ahmed",
      action: "Price change",
      detail: "Cooking Oil 1L · Rs 600 to Rs 620",
      flag: "info",
    },
  ],
  next_cursor: null,
};

const Stub = createRoutesStub([
  {
    path: "/admin/activity-log",
    Component: () => (
      <ToastProvider>
        <ActivityLogRoute />
      </ToastProvider>
    ),
  },
]);

function install(extra: Record<string, FakeRoute> = {}) {
  return installFakeFetch({
    "GET /activity-log": () => jsonResponse(200, page),
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

describe("ActivityLogRoute", () => {
  it("shows today's counts and the rows with their flags", async () => {
    install();
    render(<Stub initialEntries={["/admin/activity-log"]} />);

    const table = await screen.findByRole("table", { name: "Activity" });

    expect(
      within(table).getByText("cashier Zainab · 2 items · Rs 570"),
    ).toBeInTheDocument();
    expect(within(table).getByText("Review")).toBeInTheDocument();
    expect(within(table).getByText("Info")).toBeInTheDocument();
    expect(screen.getByText("Refunds today").nextSibling).toHaveTextContent(
      "5",
    );
    expect(
      screen.getByText("Held bills deleted today").nextSibling,
    ).toHaveTextContent("2");
  });

  it("asks for the chosen kind of entry", async () => {
    const fetchMock = install();
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/activity-log"]} />);
    await screen.findByRole("table", { name: "Activity" });

    await user.click(screen.getByRole("button", { name: "Refunds" }));

    await vi.waitFor(() => {
      const urls = fetchMock.mock.calls.map((call) => call[0]);
      expect(urls.some((url) => url.includes("type=refund"))).toBe(true);
    });
  });

  it("explains an empty log", async () => {
    install({
      "GET /activity-log": () => jsonResponse(200, { ...page, results: [] }),
    });
    render(<Stub initialEntries={["/admin/activity-log"]} />);

    expect(await screen.findByText("Nothing logged yet")).toBeInTheDocument();
  });

  it("downloads the log as a file for the current filter", async () => {
    const created: Blob[] = [];
    URL.createObjectURL = (blob: Blob) => {
      created.push(blob);
      return "blob:x";
    };
    URL.revokeObjectURL = () => undefined;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );
    const fetchMock = install({
      "GET /activity-log/export": () =>
        new Response("Time (UTC),Who\n", {
          status: 200,
          headers: { "Content-Type": "text/csv" },
        }),
    });
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/activity-log?type=refund"]} />);
    await screen.findByRole("table", { name: "Activity" });

    await user.click(screen.getByRole("button", { name: "Export CSV" }));

    await vi.waitFor(() => {
      expect(created).toHaveLength(1);
    });
    const urls = fetchMock.mock.calls.map((call) => call[0]);
    expect(
      urls.some((url) => url.includes("/activity-log/export?type=refund")),
    ).toBe(true);
  });

  it("shows an error state with retry", async () => {
    install({
      "GET /activity-log": () =>
        jsonResponse(500, { error: { code: "server_error", message: "x" } }),
    });
    render(<Stub initialEntries={["/admin/activity-log"]} />);

    expect(
      await screen.findByRole("button", { name: /try again|retry/i }),
    ).toBeInTheDocument();
  });
});
