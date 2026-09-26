import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "~/infrastructure/db/database";
import { META_KEYS } from "~/infrastructure/db/meta-keys";
import { metaStore } from "~/infrastructure/db/meta-store";
import { recentBillStore } from "~/infrastructure/db/recent-bill-store";
import {
  completedBill,
  recentBillRow,
} from "~/infrastructure/db/test-database";
import { printPage } from "~/infrastructure/print";
import { saveDeviceMeta } from "~/infrastructure/session/device-store";
import { setSession } from "~/infrastructure/session/session-store";

import ReceiptRoute, { clientLoader } from "./receipt";

const Stub = createRoutesStub([
  { path: "/pos/receipt", Component: ReceiptRoute, loader: clientLoader },
  { path: "/pos", Component: () => <div>Billing desk</div> },
]);

const settings = {
  storeName: "Fresh Basket Mart",
  phone: "042 111 222",
  address: "Main Boulevard, Lahore",
  taxRate: "0.00",
  pricesIncludeTax: false,
  blockWhenOutOfStock: false,
  receiptPaperMm: 80,
  receiptHeader: "Welcome to Fresh Basket",
  receiptFooter: "Thank you, come again",
  receiptShowBarcode: true,
};

vi.mock("~/infrastructure/print", () => ({ printPage: vi.fn() }));

const print = vi.mocked(printPage);

beforeEach(async () => {
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
  await metaStore.set(META_KEYS.settings, settings);
  print.mockClear();
});

describe("80 mm receipt", () => {
  it("prints the bill once with the store, lines, cash and bill barcode", async () => {
    await recentBillStore.save(
      recentBillRow(
        completedBill("bill-1", { soldAt: "2026-09-19T12:47:03.000Z" }),
      ),
    );

    render(<Stub initialEntries={["/pos/receipt?bill=bill-1"]} />);

    const receipt = await screen.findByRole("article", {
      name: "Bill 002-000743",
    });
    expect(receipt).toHaveTextContent("Fresh Basket Mart");
    expect(receipt).toHaveTextContent("Main Boulevard, Lahore");
    expect(receipt).toHaveTextContent("Welcome to Fresh Basket");
    expect(receipt).toHaveTextContent("Counter 2");
    expect(receipt).toHaveTextContent("19 Sep 2026");
    expect(receipt).toHaveTextContent("17:47");
    expect(receipt).toHaveTextContent("Cashier: Zainab");
    expect(receipt).toHaveTextContent("2 × 290580");
    expect(receipt).toHaveTextContent("TOTALRs 2,230");
    expect(receipt).toHaveTextContent("Cash received5,000");
    expect(receipt).toHaveTextContent("Change2,770");
    expect(
      screen.getByRole("img", { name: "Bill number barcode 002-000743" }),
    ).toBeInTheDocument();
    expect(receipt).toHaveTextContent("Thank you, come again");
    await waitFor(() => {
      expect(print).toHaveBeenCalledTimes(1);
    });
  });

  it("prints card payments without cash lines and hides the barcode when turned off", async () => {
    await metaStore.set(META_KEYS.settings, {
      ...settings,
      receiptShowBarcode: false,
    });
    await recentBillStore.save(
      recentBillRow(
        completedBill("bill-2", {
          payment: {
            id: "p",
            method: "card",
            amount: 223000,
            tendered: null,
            change: null,
          },
        }),
      ),
    );

    render(<Stub initialEntries={["/pos/receipt?bill=bill-2"]} />);

    const receipt = await screen.findByRole("article");
    expect(receipt).toHaveTextContent("Paid by Card");
    expect(receipt).not.toHaveTextContent("Cash received");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows tax and rounding when the bill has them", async () => {
    await recentBillStore.save(
      recentBillRow(
        completedBill("bill-3", {
          taxRate: "17.00",
          totals: {
            itemCount: 3,
            subtotal: 15000,
            tax: 2550,
            rounding: 50,
            total: 17600,
          },
        }),
      ),
    );

    render(<Stub initialEntries={["/pos/receipt?bill=bill-3"]} />);

    const receipt = await screen.findByRole("article");
    expect(receipt).toHaveTextContent("Tax (17%)26");
    expect(receipt).toHaveTextContent("Rounding0.50");
  });

  it("prints again and goes back to billing", async () => {
    const user = userEvent.setup();
    await recentBillStore.save(recentBillRow(completedBill("bill-1")));
    render(<Stub initialEntries={["/pos/receipt?bill=bill-1"]} />);

    const again = await screen.findByRole("button", { name: "Print again" });
    await waitFor(() => {
      expect(print).toHaveBeenCalledTimes(1);
    });
    await user.click(again);
    expect(print).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole("link", { name: "Back to billing" }));

    expect(await screen.findByText("Billing desk")).toBeInTheDocument();
  });

  it("says when the bill is not on this PC and does not print", async () => {
    render(<Stub initialEntries={["/pos/receipt?bill=missing"]} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This bill is not on this PC any more.",
    );
    expect(print).not.toHaveBeenCalled();
  });
});
