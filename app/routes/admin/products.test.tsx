import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "~/components/ui/ToastProvider";
import {
  installFakeFetch,
  jsonResponse,
} from "~/infrastructure/api/fake-fetch";

import ProductsRoute from "./products";

const categories = [
  { id: 1, name: "Grocery", tint: "grocery", product_count: 20 },
  { id: 2, name: "Dairy & eggs", tint: "dairy", product_count: 3 },
];

function product(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    barcode: `89610012000${String(id).padStart(2, "0")}`,
    name: `Product ${String(id)}`,
    category: { id: 1, name: "Grocery", tint: "grocery" },
    unit: "pcs",
    price: "1650.00",
    cost: "1480.00",
    stock: "84.000",
    status: "in_stock",
    ...overrides,
  };
}

const Stub = createRoutesStub([
  {
    path: "/admin/products",
    Component: () => (
      <ToastProvider>
        <ProductsRoute />
      </ToastProvider>
    ),
  },
]);

function productCalls(fetchMock: ReturnType<typeof installFakeFetch>) {
  return fetchMock.mock.calls
    .map(([url]) => new URL(url))
    .filter((url) => url.pathname.endsWith("/products"));
}

function install(results = [product(1)], count = results.length) {
  return installFakeFetch({
    "GET /categories": () => jsonResponse(200, categories),
    "GET /products": () => jsonResponse(200, { count, results }),
  });
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("ProductsRoute", () => {
  it("lists products with money, stock badges and paging", async () => {
    install(
      [
        product(1, { name: "Basmati Rice 5kg" }),
        product(2, { stock: "6.000", status: "low" }),
        product(3, { stock: "0.000", status: "out" }),
      ],
      23,
    );

    render(<Stub initialEntries={["/admin/products"]} />);

    const row = (await screen.findByText("Basmati Rice 5kg")).closest(
      '[role="row"]',
    ) as HTMLElement;
    expect(within(row).getByText("Rs 1,650")).toBeInTheDocument();
    expect(within(row).getByText("Rs 1,480")).toBeInTheDocument();
    expect(within(row).getByText("84")).toBeInTheDocument();
    expect(within(row).getByText("In stock")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("Out")).toBeInTheDocument();
    expect(screen.getByText("Showing 1–10 of 23")).toBeInTheDocument();
    expect(
      screen.getByText("23 products across 2 categories"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import CSV" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Export" })).toBeDisabled();
  });

  it("asks for the next page", async () => {
    const user = userEvent.setup();
    const fetchMock = install([product(1)], 23);

    render(<Stub initialEntries={["/admin/products"]} />);
    await user.click(await screen.findByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(productCalls(fetchMock).at(-1)?.searchParams.get("page")).toBe(
        "2",
      );
    });
  });

  it("searches by name or barcode after a short pause", async () => {
    const user = userEvent.setup();
    const fetchMock = install();

    render(<Stub initialEntries={["/admin/products?page=3"]} />);
    await user.type(
      await screen.findByRole("searchbox", { name: "Search name or barcode" }),
      "oil",
    );

    await waitFor(() => {
      const last = productCalls(fetchMock).at(-1);
      expect(last?.searchParams.get("search")).toBe("oil");
      expect(last?.searchParams.get("page")).toBe("1");
    });
  });

  it("filters by category chip and stock level", async () => {
    const user = userEvent.setup();
    const fetchMock = install();

    render(<Stub initialEntries={["/admin/products"]} />);
    await user.click(
      await screen.findByRole("button", { name: "Dairy & eggs" }),
    );
    await user.selectOptions(screen.getByLabelText("Stock"), "Stock: Low");

    await waitFor(() => {
      const last = productCalls(fetchMock).at(-1);
      expect(last?.searchParams.get("category")).toBe("2");
      expect(last?.searchParams.get("stock")).toBe("low");
    });
    expect(
      screen.getByRole("button", { name: "Dairy & eggs" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the filters in the edit link", async () => {
    install([product(7, { name: "Cooking Oil 1L" })]);

    render(<Stub initialEntries={["/admin/products?category=1"]} />);

    expect(
      await screen.findByRole("link", { name: "Edit Cooking Oil 1L" }),
    ).toHaveAttribute("href", "/admin/products/7?category=1");
  });

  it("shows the empty state when nothing matches", async () => {
    install([], 0);

    render(<Stub initialEntries={["/admin/products?search=zzz"]} />);

    expect(await screen.findByText("No products found")).toBeInTheDocument();
  });

  it("shows the error block and retries", async () => {
    const user = userEvent.setup();
    let calls = 0;
    installFakeFetch({
      "GET /categories": () => jsonResponse(200, categories),
      "GET /products": () => {
        calls += 1;
        return calls === 1
          ? new TypeError("Failed to fetch")
          : jsonResponse(200, { count: 1, results: [product(1)] });
      },
    });

    render(<Stub initialEntries={["/admin/products"]} />);
    await user.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Product 1")).toBeInTheDocument();
  });

  it("archives a product from its row after a confirmation", async () => {
    const user = userEvent.setup();
    const archived: string[] = [];
    installFakeFetch({
      "GET /categories": () => jsonResponse(200, categories),
      "GET /products": () =>
        jsonResponse(200, {
          count: 1,
          results: [product(4, { name: "Sugar 1kg" })],
        }),
      "POST /products/4/archive": () => {
        archived.push("4");
        return jsonResponse(204);
      },
    });

    render(<Stub initialEntries={["/admin/products"]} />);
    await user.click(
      await screen.findByRole("button", { name: "Delete Sugar 1kg" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Delete Sugar 1kg?" });
    expect(dialog).toHaveTextContent("The product is archived, not erased");
    await user.click(
      within(dialog).getByRole("button", { name: "Archive product" }),
    );

    expect(await screen.findByText("Sugar 1kg archived")).toBeInTheDocument();
    expect(archived).toEqual(["4"]);
  });

  it("keeps the product when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const fetchMock = install([product(4, { name: "Sugar 1kg" })]);

    render(<Stub initialEntries={["/admin/products"]} />);
    await user.click(
      await screen.findByRole("button", { name: "Delete Sugar 1kg" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "POST"),
    ).toBe(false);
  });

  it("lists archived products without a delete button", async () => {
    const fetchMock = install([product(4, { name: "Sugar 1kg" })]);

    render(<Stub initialEntries={["/admin/products?stock=archived"]} />);

    expect(await screen.findByText("Archived")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Sugar 1kg" }),
    ).not.toBeInTheDocument();
    expect(productCalls(fetchMock).at(-1)?.searchParams.get("archived")).toBe(
      "true",
    );
  });
});
