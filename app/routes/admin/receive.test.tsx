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

import ReceiveRoute from "./receive";

const oil = {
  id: 1,
  barcode: "8961002300022",
  name: "Cooking Oil 1L",
  category: { id: 1, name: "Grocery", tint: "grocery" },
  unit: "litre",
  price: "620.00",
  cost: "570.00",
  stock: "9.000",
  status: "low",
};

const Stub = createRoutesStub([
  {
    path: "/admin/receive",
    Component: () => (
      <ToastProvider>
        <ReceiveRoute />
      </ToastProvider>
    ),
  },
  { path: "/admin/inventory", Component: () => <p>Inventory page</p> },
]);

function install(extra: Record<string, FakeRoute> = {}) {
  return installFakeFetch({
    "GET /suppliers": () =>
      jsonResponse(200, [{ id: 3, name: "Al-Karam Distributors", phone: "" }]),
    "GET /products/by-barcode/8961002300022": () => jsonResponse(200, oil),
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

async function scanOil(user: ReturnType<typeof userEvent.setup>) {
  const box = await screen.findByLabelText("Scan received item");
  await user.type(box, "8961002300022{Enter}");
  await screen.findByRole("table", { name: "Delivery lines" });
}

describe("ReceiveRoute", () => {
  it("adds a scanned item and warns when its cost went up", async () => {
    install();
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/receive"]} />);
    await scanOil(user);

    const table = screen.getByRole("table", { name: "Delivery lines" });
    expect(within(table).getByText("Cooking Oil 1L")).toBeInTheDocument();
    expect(within(table).getByText("No change")).toBeInTheDocument();

    const cost = within(table).getByLabelText("Cost each of Cooking Oil 1L");
    await user.clear(cost);
    await user.type(cost, "585");
    await user.clear(
      within(table).getByLabelText("Received quantity of Cooking Oil 1L"),
    );
    await user.type(
      within(table).getByLabelText("Received quantity of Cooking Oil 1L"),
      "60",
    );

    expect(within(table).getByText("+Rs 15")).toBeInTheDocument();
    expect(
      screen.getByText("1 item costs more than last time"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Rs 35,100").length).toBeGreaterThan(0);
  });

  it("says when a barcode is not in the catalogue", async () => {
    install({
      "GET /products/by-barcode/8961009999999": () =>
        jsonResponse(404, {
          error: { code: "unknown_barcode", message: "No" },
        }),
    });
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/receive"]} />);

    await user.type(
      await screen.findByLabelText("Scan received item"),
      "8961009999999{Enter}",
    );

    expect(
      await screen.findByText(/is not in your catalogue/),
    ).toBeInTheDocument();
  });

  it("asks for a supplier and a line before confirming", async () => {
    install();
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/receive"]} />);
    await screen.findByLabelText("Supplier");

    await user.click(
      screen.getByRole("button", { name: "Confirm and add to stock" }),
    );
    expect(screen.getByText("Choose the supplier.")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Supplier"), "3");
    await user.click(
      screen.getByRole("button", { name: "Confirm and add to stock" }),
    );
    expect(screen.getByText("Scan at least one item.")).toBeInTheDocument();
  });

  it("creates the draft, confirms it and goes back to inventory", async () => {
    const drafts: unknown[] = [];
    install({
      "POST /stock/receipts": (body) => {
        drafts.push(body);
        return jsonResponse(201, { id: 9 });
      },
      "POST /stock/receipts/9/confirm": () =>
        jsonResponse(200, {
          id: 9,
          total_cost: "570.00",
          cost_increase_items: [],
        }),
    });
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/receive"]} />);
    await scanOil(user);
    await user.selectOptions(screen.getByLabelText("Supplier"), "3");
    await user.type(screen.getByLabelText("Supplier invoice no."), "INV-1");

    await user.click(
      screen.getByRole("button", { name: "Confirm and add to stock" }),
    );

    expect(await screen.findByText("Inventory page")).toBeInTheDocument();
    expect(drafts).toEqual([
      {
        supplier_id: 3,
        invoice_no: "INV-1",
        delivery_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) as string,
        lines: [{ product_id: 1, qty: "1.000", unit_cost: "570.00" }],
      },
    ]);
  });

  it("retries a failed confirm without making a second draft", async () => {
    let drafts = 0;
    let confirms = 0;
    install({
      "POST /stock/receipts": () => {
        drafts += 1;
        return jsonResponse(201, { id: 9 });
      },
      "POST /stock/receipts/9/confirm": () => {
        confirms += 1;
        return confirms === 1
          ? jsonResponse(500, {
              error: { code: "server_error", message: "Boom" },
            })
          : jsonResponse(200, {
              id: 9,
              total_cost: "570.00",
              cost_increase_items: [],
            });
      },
    });
    const user = userEvent.setup();
    render(<Stub initialEntries={["/admin/receive"]} />);
    await scanOil(user);
    await user.selectOptions(screen.getByLabelText("Supplier"), "3");

    await user.click(
      screen.getByRole("button", { name: "Confirm and add to stock" }),
    );
    await screen.findByRole("alert");
    await user.click(
      screen.getByRole("button", { name: "Confirm and add to stock" }),
    );

    expect(await screen.findByText("Inventory page")).toBeInTheDocument();
    expect(drafts).toBe(1);
  });
});
