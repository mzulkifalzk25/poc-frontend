import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import { CurrentBillProvider } from "~/components/pos/bill/CurrentBillProvider";
import { db } from "~/infrastructure/db/database";
import { META_KEYS } from "~/infrastructure/db/meta-keys";
import { metaStore } from "~/infrastructure/db/meta-store";
import { productRow } from "~/infrastructure/db/test-database";

import BillingRoute from "./billing";

const Stub = createRoutesStub([
  {
    path: "/pos",
    Component: () => (
      <CurrentBillProvider>
        <BillingRoute />
      </CurrentBillProvider>
    ),
  },
]);

async function seedCatalogue() {
  await db.products.bulkPut([
    productRow(1, {
      name: "Fresh Milk 1L",
      barcode: "8961004500044",
      price: "290.00",
      categoryId: 2,
    }),
    productRow(2, {
      name: "Sugar 1kg",
      barcode: "8961005600055",
      price: "180.00",
      categoryId: 1,
    }),
    productRow(3, {
      name: "Bread Loaf",
      barcode: "8961007800077",
      price: "150.00",
      categoryId: 7,
    }),
  ]);
}

async function openDesk() {
  const user = userEvent.setup();
  render(<Stub initialEntries={["/pos"]} />);
  const scanBox = await screen.findByLabelText(
    "Scan barcode or search product",
  );
  return { user, scanBox };
}

function rows() {
  return within(screen.getByRole("table", { name: "Current bill items" }))
    .queryAllByRole("row")
    .slice(1);
}

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
  localStorage.clear();
  await seedCatalogue();
});

describe("Billing desk: scanning", () => {
  it("shows the empty bill and focuses the scan box", async () => {
    const { scanBox } = await openDesk();

    expect(scanBox).toHaveFocus();
    expect(screen.getByText("Ready for the next customer")).toBeInTheDocument();
  });

  it("adds the same product twice to ONE row with quantity 2", async () => {
    const { user, scanBox } = await openDesk();

    await user.type(scanBox, "8961005600055{Enter}");
    await user.type(scanBox, "8961005600055{Enter}");

    expect(await screen.findByLabelText("Quantity of Sugar 1kg")).toHaveValue(
      "2",
    );
    expect(rows()).toHaveLength(1);
    expect(
      within(rows()[0] as HTMLElement).getByText("360"),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Sugar 1kg · Rs 180");
  });

  it("types a quantity and applies it on Enter", async () => {
    const { user, scanBox } = await openDesk();
    await user.type(scanBox, "8961004500044{Enter}");
    const qty = await screen.findByLabelText("Quantity of Fresh Milk 1L");

    await user.clear(qty);
    expect(rows()).toHaveLength(1);
    await user.type(qty, "12{Enter}");

    expect(qty).toHaveValue("12");
    expect(
      within(rows()[0] as HTMLElement).getByText("3,480"),
    ).toBeInTheDocument();
  });

  it("steps the quantity with minus and plus and removes a row", async () => {
    const { user, scanBox } = await openDesk();
    await user.type(scanBox, "8961007800077{Enter}");
    await user.type(scanBox, "8961004500044{Enter}");

    await user.click(
      await screen.findByRole("button", { name: "Increase Bread Loaf" }),
    );
    expect(screen.getByLabelText("Quantity of Bread Loaf")).toHaveValue("2");
    await user.click(
      screen.getByRole("button", { name: "Decrease Bread Loaf" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Decrease Bread Loaf" }),
    );
    expect(
      screen.queryByLabelText("Quantity of Bread Loaf"),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Remove Fresh Milk 1L" }),
    );
    expect(screen.getByText("Ready for the next customer")).toBeInTheDocument();
  });

  it("warns about a barcode that is not in the catalogue", async () => {
    const { user, scanBox } = await openDesk();

    await user.type(scanBox, "8961099900123{Enter}");

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Barcode 8961099900123 is not in the catalogue.",
    );
    expect(rows()).toHaveLength(0);
  });

  it("blocks an out of stock item when the owner asked for it", async () => {
    await metaStore.set(META_KEYS.settings, { blockWhenOutOfStock: true });
    await db.stock.put({ productId: 2, qty: "0.000" });
    const { user, scanBox } = await openDesk();

    await user.type(scanBox, "8961005600055{Enter}");

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Sugar 1kg is out of stock.",
    );
  });

  it("keeps the bill after a reload", async () => {
    const { user, scanBox } = await openDesk();
    await user.type(scanBox, "8961005600055{Enter}");
    await screen.findByLabelText("Quantity of Sugar 1kg");

    expect(
      JSON.parse(localStorage.getItem("martdesk.currentBill") ?? "{}"),
    ).toMatchObject({
      lines: [{ productId: 2, qty: 1 }],
    });
  });
});
