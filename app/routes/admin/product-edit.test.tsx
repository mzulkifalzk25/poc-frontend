import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "~/components/ui/ToastProvider";
import {
  installFakeFetch,
  jsonResponse,
  type FakeRoute,
} from "~/infrastructure/api/fake-fetch";

import ProductEditRoute from "./product-edit";
import ProductsRoute from "./products";

const oil = {
  id: 7,
  barcode: "8961002300022",
  name: "Cooking Oil 1L",
  category: { id: 1, name: "Grocery", tint: "grocery" },
  category_id: 1,
  unit: "litre",
  price: "620.00",
  cost: "570.00",
  stock: "9.000",
  status: "low",
  low_stock_alert: "15.000",
  is_archived: false,
};

const history = [
  {
    when: "2026-09-12T06:00:00Z",
    who: "Sana Ahmed",
    old: "600.00",
    new: "620.00",
  },
  {
    when: "2026-08-28T06:00:00Z",
    who: "Imran Sheikh",
    old: "580.00",
    new: "600.00",
  },
];

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname + location.search}
    </output>
  );
}

const Stub = createRoutesStub([
  {
    path: "/admin/products",
    Component: () => (
      <ToastProvider>
        <ProductsRoute />
        <LocationProbe />
      </ToastProvider>
    ),
    children: [{ path: ":id", Component: ProductEditRoute }],
  },
]);

function install(extra: Record<string, FakeRoute> = {}) {
  return installFakeFetch({
    "GET /categories": () =>
      jsonResponse(200, [
        { id: 1, name: "Grocery", tint: "grocery", product_count: 1 },
        { id: 2, name: "Beverages", tint: "beverages", product_count: 0 },
      ]),
    "GET /products": () => jsonResponse(200, { count: 1, results: [oil] }),
    "GET /products/7": () => jsonResponse(200, oil),
    "GET /products/7/price-history": () => jsonResponse(200, history),
    ...extra,
  });
}

async function openDrawer(path = "/admin/products/7") {
  render(<Stub initialEntries={[path]} />);
  await screen.findByRole("button", { name: "Save changes" });
  return screen.getByRole("dialog", { name: "Edit product" });
}

async function openMissing(path: string) {
  render(<Stub initialEntries={[path]} />);
  return screen.findByRole("alert");
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("ProductEditRoute", () => {
  it("fills the form, the profit and the price history", async () => {
    install();

    const drawer = await openDrawer();

    expect(await within(drawer).findByLabelText("Product name")).toHaveValue(
      "Cooking Oil 1L",
    );
    expect(within(drawer).getByText("8961002300022")).toBeInTheDocument();
    expect(within(drawer).getByLabelText("Selling price (Rs)")).toHaveValue(
      "620",
    );
    expect(within(drawer).getByLabelText("Stock on hand")).toHaveValue("9");
    expect(within(drawer).getByLabelText("Unit")).toHaveValue("litre");
    expect(
      within(drawer).getByRole("status", { name: "Profit per unit" }),
    ).toHaveTextContent("Rs 50 · 8.1% margin");
    expect(
      await within(drawer).findByText("12 Sep · Sana Ahmed"),
    ).toBeInTheDocument();
    expect(within(drawer).getByText("Rs 600 to Rs 620")).toBeInTheDocument();
    expect(
      within(drawer).getByRole("link", { name: "Adjust" }),
    ).toHaveAttribute("href", "/admin/inventory/adjust?product=7");
  });

  it("updates the profit while the price is typed", async () => {
    const user = userEvent.setup();
    install();

    const drawer = await openDrawer();
    const price = await within(drawer).findByLabelText("Selling price (Rs)");
    await user.clear(price);
    await user.type(price, "670");

    expect(
      within(drawer).getByRole("status", { name: "Profit per unit" }),
    ).toHaveTextContent("Rs 100 · 14.9% margin");
  });

  it("saves a price change and returns to the filtered list", async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    install({
      "PATCH /products/7": (body) => {
        bodies.push(body);
        return jsonResponse(200, { ...oil, price: "640.00" });
      },
    });

    const drawer = await openDrawer("/admin/products/7?category=1");
    const price = await within(drawer).findByLabelText("Selling price (Rs)");
    await user.clear(price);
    await user.type(price, "640");
    await user.click(
      within(drawer).getByRole("button", { name: "Save changes" }),
    );

    expect(await screen.findByText("Cooking Oil 1L saved")).toBeInTheDocument();
    expect(bodies).toEqual([
      {
        name: "Cooking Oil 1L",
        category_id: 1,
        unit: "litre",
        price: "640.00",
        cost: "570.00",
        low_stock_alert: "15.000",
      },
    ]);
    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/admin/products?category=1",
      );
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows field errors before calling the server", async () => {
    const user = userEvent.setup();
    const fetchMock = install();

    const drawer = await openDrawer();
    const price = await within(drawer).findByLabelText("Selling price (Rs)");
    await user.clear(price);
    await user.type(price, "abc");
    await user.click(
      within(drawer).getByRole("button", { name: "Save changes" }),
    );

    expect(
      within(drawer).getByText("Enter a number, 0 or more."),
    ).toBeVisible();
    expect(price).toHaveAttribute("aria-invalid", "true");
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH"),
    ).toBe(false);
  });

  it("shows a server field error under its field", async () => {
    const user = userEvent.setup();
    install({
      "PATCH /products/7": () =>
        jsonResponse(400, {
          error: {
            code: "validation_error",
            message: "Invalid",
            fields: { low_stock_alert: ["Must be below 100000."] },
          },
        }),
    });

    const drawer = await openDrawer();
    await user.click(
      await within(drawer).findByRole("button", { name: "Save changes" }),
    );

    expect(
      await within(drawer).findByText("Must be below 100000."),
    ).toBeVisible();
  });

  it("says when the product does not exist", async () => {
    installFakeFetch({
      "GET /categories": () => jsonResponse(200, []),
      "GET /products": () => jsonResponse(200, { count: 0, results: [] }),
      "GET /products/99": () =>
        jsonResponse(404, { error: { code: "not_found", message: "Gone" } }),
      "GET /products/99/price-history": () => jsonResponse(200, []),
    });

    expect(await openMissing("/admin/products/99")).toHaveTextContent(
      "Product not found",
    );
  });

  it("closes back to the list", async () => {
    const user = userEvent.setup();
    install();

    const drawer = await openDrawer("/admin/products/7?page=2");
    await user.click(within(drawer).getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/admin/products?page=2",
      );
    });
  });

  it("deletes by archiving after a confirmation that says so", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    install({
      "POST /products/7/archive": () => {
        calls.push("archive");
        return jsonResponse(204);
      },
    });

    const drawer = await openDrawer();
    expect(drawer).toHaveTextContent("Delete this product");
    await user.click(within(drawer).getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("dialog", {
      name: "Delete Cooking Oil 1L?",
    });
    expect(dialog).toHaveTextContent("archived, not erased");
    await user.click(
      within(dialog).getByRole("button", { name: "Archive product" }),
    );

    expect(
      await screen.findByText("Cooking Oil 1L archived"),
    ).toBeInTheDocument();
    expect(calls).toEqual(["archive"]);
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Edit product" }),
      ).not.toBeInTheDocument();
    });
  });

  it("restores an archived product", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    install({
      "GET /products/7": () => jsonResponse(200, { ...oil, is_archived: true }),
      "POST /products/7/restore": () => {
        calls.push("restore");
        return jsonResponse(204);
      },
    });

    const drawer = await openDrawer();
    expect(drawer).toHaveTextContent("This product is archived");
    expect(
      within(drawer).queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
    await user.click(within(drawer).getByRole("button", { name: "Restore" }));

    expect(
      await screen.findByText("Cooking Oil 1L restored"),
    ).toBeInTheDocument();
    expect(calls).toEqual(["restore"]);
  });

  it("keeps the dialog open with the error when archiving is offline", async () => {
    const user = userEvent.setup();
    install({ "POST /products/7/archive": () => new TypeError("offline") });

    const drawer = await openDrawer();
    await user.click(within(drawer).getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Archive product" }));

    const dialog = screen.getByRole("dialog", {
      name: "Delete Cooking Oil 1L?",
    });
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "You are offline.",
    );
  });
});
