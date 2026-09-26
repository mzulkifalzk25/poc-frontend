import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "~/infrastructure/db/database";
import { META_KEYS } from "~/infrastructure/db/meta-keys";
import { metaStore } from "~/infrastructure/db/meta-store";
import { shiftStore } from "~/infrastructure/db/shift-store";
import { productRow } from "~/infrastructure/db/test-database";
import { saveDeviceMeta } from "~/infrastructure/session/device-store";
import { setSession } from "~/infrastructure/session/session-store";

import ReturnsRoute, { clientLoader } from "./returns";

const Stub = createRoutesStub([
  { path: "/pos/returns", Component: ReturnsRoute, loader: clientLoader },
  { path: "/pos", Component: () => <div>Billing desk</div> },
]);

async function openReturns() {
  const user = userEvent.setup();
  render(<Stub initialEntries={["/pos/returns"]} />);
  const scanBox = await screen.findByLabelText(
    "Scan a returned item or search by name",
  );
  return { user, scanBox };
}

function rows() {
  return within(screen.getByRole("table", { name: "Returned items" }))
    .queryAllByRole("row")
    .slice(1);
}

beforeEach(async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
  await Promise.all(db.tables.map((table) => table.clear()));
  localStorage.clear();
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
    openedAt: "2026-09-26T03:00:00Z",
    openingCash: "5000.00",
    status: "open",
    closedAt: null,
    countedCash: null,
    syncState: "open_synced",
  });
  await db.products.bulkPut([
    productRow(2, {
      name: "Cooking Oil 1L",
      barcode: "8961002300022",
      price: "620.00",
    }),
    productRow(6, {
      name: "Eggs (dozen)",
      barcode: "8961006700066",
      price: "420.00",
    }),
  ]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Returns: scanning", () => {
  it("starts empty with the refund note", async () => {
    const { scanBox } = await openReturns();

    expect(scanBox).toHaveFocus();
    expect(screen.getByText("Nothing to return yet")).toBeInTheDocument();
    expect(
      screen.getByText(/Refunds use today's selling price/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Pay back to customer" }),
    ).toHaveTextContent("Rs 0");
  });

  it("adds a second scan to the same row at today's price", async () => {
    const { user, scanBox } = await openReturns();

    await user.type(scanBox, "8961006700066{Enter}");
    await user.type(scanBox, "8961006700066{Enter}");

    expect(
      await screen.findByLabelText("Quantity of Eggs (dozen)"),
    ).toHaveValue("2");
    expect(rows()).toHaveLength(1);
    expect(
      within(rows()[0] as HTMLElement).getByText("Today's price"),
    ).toBeInTheDocument();
    expect(
      within(rows()[0] as HTMLElement).getByText("840"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Pay back to customer" }),
    ).toHaveTextContent("Rs 840");
    expect(screen.getByText("2 items")).toBeInTheDocument();
  });

  it("types a quantity, steps it and removes the row", async () => {
    const { user, scanBox } = await openReturns();
    await user.type(scanBox, "8961002300022{Enter}");
    const qty = await screen.findByLabelText("Quantity of Cooking Oil 1L");

    await user.clear(qty);
    await user.type(qty, "3{Enter}");
    expect(
      screen.getByRole("status", { name: "Pay back to customer" }),
    ).toHaveTextContent("Rs 1,860");
    await user.click(
      screen.getByRole("button", { name: "Decrease Cooking Oil 1L" }),
    );
    expect(qty).toHaveValue("2");
    await user.click(
      screen.getByRole("button", { name: "Remove Cooking Oil 1L" }),
    );

    expect(screen.getByText("Nothing to return yet")).toBeInTheDocument();
  });

  it("takes an item back even when the owner blocks out of stock sales", async () => {
    await metaStore.set(META_KEYS.settings, { blockWhenOutOfStock: true });
    await db.stock.put({ productId: 2, qty: "0.000" });
    const { user, scanBox } = await openReturns();

    await user.type(scanBox, "8961002300022{Enter}");

    expect(
      await screen.findByLabelText("Quantity of Cooking Oil 1L"),
    ).toHaveValue("1");
  });

  it("searches by name and opens the banner for an unknown barcode", async () => {
    const { user, scanBox } = await openReturns();

    await user.type(scanBox, "8961099900123{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Barcode 8961099900123 is not in the catalogue.",
    );
    await user.type(screen.getByLabelText("Search product"), "egg");
    await user.click(
      await screen.findByRole("option", { name: /Eggs \(dozen\)/ }),
    );

    expect(
      await screen.findByLabelText("Quantity of Eggs (dozen)"),
    ).toHaveValue("1");
  });
});
