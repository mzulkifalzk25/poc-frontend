import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installFakeFetch,
  jsonResponse,
} from "~/infrastructure/api/fake-fetch";
import { toBillUpload } from "~/infrastructure/api/bill-upload";
import { db } from "~/infrastructure/db/database";
import { billsOutbox } from "~/infrastructure/db/outbox-store";
import { recentBillStore } from "~/infrastructure/db/recent-bill-store";
import { shiftStore } from "~/infrastructure/db/shift-store";
import {
  completedBill,
  recentBillRow,
} from "~/infrastructure/db/test-database";
import { saveDeviceMeta } from "~/infrastructure/session/device-store";
import { setSession } from "~/infrastructure/session/session-store";

import ShiftRoute, { clientLoader } from "./shift";

const Stub = createRoutesStub([
  { path: "/pos/shift", Component: ShiftRoute, loader: clientLoader },
]);

const cashBill = completedBill("b-cash");
const cardBill = completedBill("b-card", {
  totals: { itemCount: 1, subtotal: 65000, tax: 0, rounding: 0, total: 65000 },
  payment: {
    id: "p2",
    method: "card",
    amount: 65000,
    tendered: null,
    change: null,
  },
});

beforeEach(async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
  await Promise.all(db.tables.map((table) => table.clear()));
  await saveDeviceMeta({
    token: "device-token",
    counter: { id: 2, name: "Counter 2", code: "002" },
    activatedAt: "2026-09-26T03:00:00Z",
    revokedAt: null,
  });
  setSession({
    role: "cashier",
    accessToken: "a",
    refreshToken: "r",
    userId: 12,
    fullName: "Zainab Khan",
  });
  await shiftStore.save({
    id: "shift-1",
    counterId: 2,
    cashierId: 12,
    cashierName: "Zainab Khan",
    openedAt: "2026-09-19T09:00:00Z",
    openingCash: "5000.00",
    status: "open",
    closedAt: null,
    countedCash: null,
    syncState: "open_synced",
  });
  await recentBillStore.save(recentBillRow(cashBill));
  await recentBillStore.save(recentBillRow(cardBill));
  await recentBillStore.save(
    recentBillRow(completedBill("other-shift", { shiftId: "shift-0" })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function openScreen() {
  render(<Stub initialEntries={["/pos/shift"]} />);
  return screen.findByRole("heading", { name: "End of shift" });
}

describe("End of shift", () => {
  it("shows this shift's bills, sales by method and the expected cash", async () => {
    await openScreen();

    expect(
      screen.getByText("Saturday, 19 September · Shift started 14:00"),
    ).toBeInTheDocument();
    const summary = screen.getByRole("region", { name: "Your shift" });
    expect(summary).toHaveTextContent("Bills2");
    expect(summary).toHaveTextContent("Total salesRs 2,880");
    expect(summary).toHaveTextContent("CashRs 2,230");
    expect(summary).toHaveTextContent("CardRs 650");
    expect(summary).toHaveTextContent("WalletRs 0");
    const drawer = screen.getByRole("region", { name: "Count the drawer" });
    expect(drawer).toHaveTextContent("Opening cashRs 5,000");
    expect(drawer).toHaveTextContent("Expected in drawerRs 7,230");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the difference as balanced, over or short", async () => {
    const user = userEvent.setup();
    await openScreen();
    const counted = screen.getByLabelText("Cash you counted");

    await user.type(counted, "7,230");
    expect(screen.getByRole("status")).toHaveTextContent("Rs 0 · Balanced");

    await user.clear(counted);
    await user.type(counted, "7380");
    expect(screen.getByRole("status")).toHaveTextContent("Rs 150 over");

    await user.clear(counted);
    await user.type(counted, "7000");
    expect(screen.getByRole("status")).toHaveTextContent("Rs 230 short");
  });

  it("warns about unsynced sales and syncs them on request", async () => {
    const user = userEvent.setup();
    await billsOutbox.add(toBillUpload(cashBill), 1);
    await billsOutbox.add(toBillUpload(cardBill), 2);
    installFakeFetch({
      "POST /bills/batch": (body) => {
        const { bills } = body as { bills: { id: string }[] };
        return jsonResponse(200, {
          results: bills.map((bill) => ({ id: bill.id, status: "created" })),
        });
      },
    });
    await openScreen();

    const banner = screen.getByRole("alert");
    expect(banner).toHaveTextContent("2 sales are still waiting to sync.");
    await user.click(within(banner).getByRole("button", { name: "Sync now" }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
    expect(await db.bills_outbox.count()).toBe(0);
  });
});
