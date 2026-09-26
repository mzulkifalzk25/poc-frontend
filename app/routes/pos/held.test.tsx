import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import {
  CurrentBillProvider,
  useCurrentBill,
} from "~/components/pos/bill/CurrentBillProvider";
import { db } from "~/infrastructure/db/database";
import type { HeldBillRow } from "~/infrastructure/db/rows";
import { shiftStore } from "~/infrastructure/db/shift-store";
import { saveDeviceMeta } from "~/infrastructure/session/device-store";

import HeldRoute, { clientLoader } from "./held";

function BillProbe() {
  const { state } = useCurrentBill();
  return (
    <div>
      Billing with{" "}
      {state.lines
        .map((line) => `${String(line.qty)} × ${line.name}`)
        .join(", ")}
    </div>
  );
}

const Stub = createRoutesStub([
  {
    Component: () => (
      <CurrentBillProvider>
        <HeldRoute />
      </CurrentBillProvider>
    ),
    path: "/pos/held",
    loader: clientLoader,
  },
  {
    path: "/pos",
    Component: () => (
      <CurrentBillProvider>
        <BillProbe />
      </CurrentBillProvider>
    ),
  },
]);

function heldBill(
  id: string,
  overrides: Partial<HeldBillRow> = {},
): HeldBillRow {
  return {
    id,
    shiftId: "shift-1",
    cashierId: 12,
    title: "Customer in blue kurta",
    lines: [
      {
        productId: 1,
        barcode: "8961001200011",
        name: "Basmati Rice 5kg",
        unitPrice: "1650.00",
        qty: "1",
      },
      {
        productId: 2,
        barcode: "8961002300022",
        name: "Cooking Oil 1L",
        unitPrice: "620.00",
        qty: "1",
      },
      {
        productId: 5,
        barcode: "8961005600055",
        name: "Sugar 1kg",
        unitPrice: "180.00",
        qty: "2",
      },
      {
        productId: 7,
        barcode: "8961007800077",
        name: "Bread Loaf",
        unitPrice: "150.00",
        qty: "3",
      },
    ],
    itemCount: 7,
    total: "3270.00",
    heldAt: new Date(Date.now() - 14 * 60_000).toISOString(),
    ...overrides,
  };
}

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
  localStorage.clear();
  await saveDeviceMeta({
    token: "device-token",
    counter: { id: 2, name: "Counter 2", code: "002" },
    activatedAt: "2026-09-26T03:00:00Z",
    revokedAt: null,
  });
  await shiftStore.save({
    id: "shift-1",
    counterId: 2,
    cashierId: 12,
    cashierName: "Zainab Khan",
    openedAt: "2026-09-26T03:00:00Z",
    openingCash: "5000.00",
    status: "open",
    closedAt: null,
    countedCash: null,
    syncState: "open_synced",
  });
});

describe("Held bills", () => {
  it("lists this shift's held bills with tag, meta, preview and total", async () => {
    await db.held_bills.bulkPut([
      heldBill("h1"),
      heldBill("h2", {
        title: "",
        itemCount: 2,
        total: "440.00",
        heldAt: new Date().toISOString(),
        lines: [],
      }),
      heldBill("old", { shiftId: "shift-0" }),
    ]);

    render(<Stub initialEntries={["/pos/held"]} />);

    const first = await screen.findByRole("article", {
      name: "H1 Customer in blue kurta",
    });
    expect(first).toHaveTextContent("7 items · held");
    expect(first).toHaveTextContent("(14 min ago)");
    expect(first).toHaveTextContent(
      "Basmati Rice 5kg, Cooking Oil 1L, Sugar 1kg and 1 more",
    );
    expect(first).toHaveTextContent("Rs 3,270");
    const second = screen.getByRole("article", { name: "H2 Held bill" });
    expect(second).toHaveTextContent("(just now)");
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(
      screen.getByText(
        "Held bills stay on this counter until the end of the shift.",
      ),
    ).toBeInTheDocument();
  });

  it("recalls a bill into the current bill and removes it from the list", async () => {
    const user = userEvent.setup();
    await db.held_bills.put(heldBill("h1"));
    render(<Stub initialEntries={["/pos/held"]} />);

    const card = await screen.findByRole("article", {
      name: "H1 Customer in blue kurta",
    });
    await user.click(within(card).getByRole("button", { name: "Recall" }));

    expect(
      await screen.findByText(/Billing with 1 × Basmati Rice 5kg/),
    ).toHaveTextContent("3 × Bread Loaf");
    expect(await db.held_bills.count()).toBe(0);
  });

  it("will not recall while another bill is being scanned", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "martdesk.currentBill",
      JSON.stringify({
        lines: [
          {
            productId: 9,
            barcode: "1",
            name: "Salt",
            unitPrice: "60.00",
            qty: 1,
          },
        ],
      }),
    );
    await db.held_bills.put(heldBill("h1"));
    render(<Stub initialEntries={["/pos/held"]} />);

    await user.click(await screen.findByRole("button", { name: "Recall" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Finish, hold or clear the current bill",
    );
    expect(await db.held_bills.count()).toBe(1);
  });

  it("shows the empty state and closes back to billing", async () => {
    const user = userEvent.setup();
    render(<Stub initialEntries={["/pos/held"]} />);

    expect(await screen.findByText("No bills on hold")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(await screen.findByText(/Billing with/)).toBeInTheDocument();
  });
});

describe("Deleting a held bill", () => {
  it("asks first, removes the bill and queues the audit event", async () => {
    const user = userEvent.setup();
    await db.held_bills.put(heldBill("h1"));
    render(<Stub initialEntries={["/pos/held"]} />);

    await user.click(
      await screen.findByRole("button", { name: "Delete held bill H1" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Delete held bill H1?" });
    expect(dialog).toHaveTextContent("The owner sees it in the activity log.");
    await user.click(
      within(dialog).getByRole("button", { name: "Delete bill" }),
    );

    expect(await screen.findByText("No bills on hold")).toBeInTheDocument();
    const events = await db.audit_outbox.toArray();
    expect(events).toHaveLength(1);
    expect(events[0]?.payload).toMatchObject({
      action: "held_bill_deleted",
      entity_type: "held_bill",
      entity_id: "h1",
      detail: {
        title: "Customer in blue kurta",
        total: "3270.00",
        item_count: 7,
      },
    });
  });

  it("keeps the bill when the cashier cancels", async () => {
    const user = userEvent.setup();
    await db.held_bills.put(heldBill("h1"));
    render(<Stub initialEntries={["/pos/held"]} />);

    await user.click(
      await screen.findByRole("button", { name: "Delete held bill H1" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.getByRole("article", { name: "H1 Customer in blue kurta" }),
    ).toBeInTheDocument();
    expect(await db.audit_outbox.count()).toBe(0);
  });
});
