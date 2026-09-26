import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import { CurrentBillProvider } from "~/components/pos/bill/CurrentBillProvider";
import { db } from "~/infrastructure/db/database";
import { META_KEYS } from "~/infrastructure/db/meta-keys";
import { metaStore } from "~/infrastructure/db/meta-store";
import { productRow } from "~/infrastructure/db/test-database";
import { saveDeviceMeta } from "~/infrastructure/session/device-store";

import BillingRoute, { clientLoader } from "./billing";

const Stub = createRoutesStub([
  {
    path: "/pos",
    loader: clientLoader,
    Component: () => (
      <CurrentBillProvider>
        <BillingRoute />
      </CurrentBillProvider>
    ),
  },
]);

async function seedCatalogue() {
  await saveDeviceMeta({
    token: "device-token",
    counter: { id: 2, name: "Counter 2", code: "002" },
    activatedAt: "2026-09-26T03:00:00Z",
    revokedAt: null,
  });
  await metaStore.set(META_KEYS.billSeq, 742);
  await db.categories.bulkPut([
    { id: 1, name: "Grocery", tint: "grocery" },
    { id: 2, name: "Dairy & eggs", tint: "dairy" },
    { id: 7, name: "Bakery", tint: "bakery" },
    { id: 9, name: "Household", tint: "household" },
  ]);
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
    productRow(4, {
      name: "Milk Powder 400g",
      barcode: "8961011300121",
      price: "980.00",
      categoryId: 2,
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
    expect(screen.getByText("Sugar 1kg · Rs 180")).toBeInTheDocument();
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

  it("opens search with a banner for a barcode that is not in the catalogue", async () => {
    const { user, scanBox } = await openDesk();

    await user.type(scanBox, "8961099900123{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Barcode 8961099900123 is not in the catalogue. Search by name, or ask the owner to add it.",
    );
    expect(screen.getByLabelText("Search product")).toHaveFocus();
    expect(rows()).toHaveLength(0);
  });

  it("blocks an out of stock item when the owner asked for it", async () => {
    await metaStore.set(META_KEYS.settings, { blockWhenOutOfStock: true });
    await db.stock.put({ productId: 2, qty: "0.000" });
    const { user, scanBox } = await openDesk();

    await user.type(scanBox, "8961005600055{Enter}");

    expect(
      await screen.findByText("Sugar 1kg is out of stock."),
    ).toBeInTheDocument();
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

describe("Billing desk: current bill and quick items", () => {
  it("shows the next bill number, the item count and the total to pay", async () => {
    const { user, scanBox } = await openDesk();
    expect(screen.getByText("002-000743")).toBeInTheDocument();

    await user.type(scanBox, "8961005600055{Enter}");
    await user.type(scanBox, "8961005600055{Enter}");
    await user.type(scanBox, "8961004500044{Enter}");
    await screen.findByLabelText("Quantity of Fresh Milk 1L");

    const panel = screen.getByRole("complementary", { name: "Current bill" });
    expect(within(panel).getByText("3")).toBeInTheDocument();
    expect(
      within(panel).getByRole("status", { name: "Total to pay" }),
    ).toHaveTextContent("Rs 650");
  });

  it("adds tax on top when the owner set a rate", async () => {
    await metaStore.set(META_KEYS.settings, {
      taxRate: "10.00",
      pricesIncludeTax: false,
    });
    const { user, scanBox } = await openDesk();

    await user.type(scanBox, "8961007800077{Enter}");
    await screen.findByLabelText("Quantity of Bread Loaf");

    expect(
      screen.getByRole("status", { name: "Total to pay" }),
    ).toHaveTextContent("Rs 165");
  });

  it("shows the first categories as quick item tabs and adds a tile", async () => {
    const { user } = await openDesk();

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Grocery",
      "Dairy & eggs",
      "Bakery",
    ]);
    await user.click(screen.getByRole("tab", { name: "Bakery" }));
    await user.click(
      await screen.findByRole("button", { name: "Add Bread Loaf, Rs 150" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Add Bread Loaf, Rs 150" }),
    );

    expect(screen.getByLabelText("Quantity of Bread Loaf")).toHaveValue("2");
  });

  it("says when a quick item tab has no products", async () => {
    await db.categories.put({ id: 0, name: "Frozen", tint: "dairy" });
    await openDesk();

    expect(
      await screen.findByText("No products in this category yet."),
    ).toBeInTheDocument();
  });
});

describe("Billing desk: payment", () => {
  async function billOf650() {
    const desk = await openDesk();
    await desk.user.type(desk.scanBox, "8961005600055{Enter}");
    await desk.user.type(desk.scanBox, "8961005600055{Enter}");
    await desk.user.type(desk.scanBox, "8961004500044{Enter}");
    await screen.findByLabelText("Quantity of Fresh Milk 1L");
    return desk;
  }

  it("keeps Pay off until the cash received covers the total", async () => {
    const { user } = await billOf650();
    const pay = screen.getByRole("button", { name: /pay & print/i });
    expect(screen.getByRole("radio", { name: "Cash" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(pay).toBeDisabled();

    await user.type(screen.getByLabelText("Received"), "500");
    expect(pay).toBeDisabled();
    expect(screen.getByText("Still to collect")).toBeInTheDocument();
    expect(screen.getByText("Rs 150")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Received"));
    await user.type(screen.getByLabelText("Received"), "1,000");
    expect(pay).toBeEnabled();
    expect(screen.getByText("Change due")).toBeInTheDocument();
    expect(screen.getByText("Rs 350")).toBeInTheDocument();
  });

  it("fills the received cash from the chips", async () => {
    const { user } = await billOf650();

    await user.click(screen.getByRole("button", { name: "Exact" }));
    expect(screen.getByLabelText("Received")).toHaveValue("650");
    expect(screen.getByText("Rs 0")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "5,000" }));
    expect(screen.getByRole("button", { name: "5,000" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Rs 4,350")).toBeInTheDocument();
  });

  it("uses one method; card and wallet wait for the terminal and can pay", async () => {
    const { user } = await billOf650();

    await user.click(screen.getByRole("radio", { name: "Card" }));

    expect(screen.getByRole("radio", { name: "Cash" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(
      screen.getByText(
        "Waiting for the customer to complete payment on the terminal.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Received")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pay & print/i })).toBeEnabled();
  });

  it("clears the bill", async () => {
    const { user } = await billOf650();

    await user.click(screen.getByRole("button", { name: "Clear bill" }));

    expect(screen.getByText("Ready for the next customer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear bill" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /pay & print/i })).toBeDisabled();
  });
});

describe("Billing desk: keyboard", () => {
  it("brings the focus back to the scan box with F2", async () => {
    const { user, scanBox } = await openDesk();
    await user.click(screen.getByRole("radio", { name: "Card" }));
    expect(scanBox).not.toHaveFocus();

    await user.keyboard("{F2}");

    expect(scanBox).toHaveFocus();
  });
});

describe("Billing desk: search", () => {
  it("searches by name as soon as a letter is typed in the scan box", async () => {
    const { user, scanBox } = await openDesk();

    await user.type(scanBox, "mil");

    const search = screen.getByLabelText("Search product");
    expect(search).toHaveValue("mil");
    expect(await screen.findByText('2 matches for "mil"')).toBeInTheDocument();
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("Fresh Milk 1L");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  it("moves with the arrow keys and adds with Enter, then closes", async () => {
    const { user, scanBox } = await openDesk();
    await user.type(scanBox, "mil");
    await screen.findByText('2 matches for "mil"');

    await user.keyboard("{ArrowDown}{Enter}");

    expect(
      await screen.findByLabelText("Quantity of Milk Powder 400g"),
    ).toHaveValue("1");
    expect(screen.queryByLabelText("Search product")).not.toBeInTheDocument();
    expect(scanBox).toHaveFocus();
  });

  it("adds a result with a click", async () => {
    const { user } = await openDesk();
    await user.click(screen.getByRole("button", { name: "Find item" }));
    expect(
      screen.getByText("Type at least 2 letters to search."),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search product"), "bread");
    await user.click(await screen.findByRole("option", { name: /Bread Loaf/ }));

    expect(await screen.findByLabelText("Quantity of Bread Loaf")).toHaveValue(
      "1",
    );
  });

  it("closes with Esc and says when nothing matches", async () => {
    const { user, scanBox } = await openDesk();
    await user.type(scanBox, "zzz");
    expect(
      await screen.findByText('No products match "zzz".'),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByLabelText("Search product")).not.toBeInTheDocument();
    expect(scanBox).toHaveFocus();
  });
});
