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

import ProductsRoute from "./products";
import ScanAddRoute from "./scan-add";

const categories = [
  { id: 1, name: "Grocery", tint: "grocery", product_count: 1 },
  { id: 4, name: "Snacks", tint: "snacks", product_count: 0 },
];

const oil = {
  id: 7,
  barcode: "8961002300022",
  name: "Cooking Oil 1L",
  category: { id: 1, name: "Grocery", tint: "grocery" },
  unit: "litre",
  price: "620.00",
  cost: "570.00",
  stock: "9.000",
  status: "low",
};

const unknown = () =>
  jsonResponse(404, {
    error: { code: "unknown_barcode", message: "Unknown barcode" },
  });

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
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
    children: [
      { path: "scan", Component: ScanAddRoute },
      { path: ":id", Component: () => <div>Edit drawer</div> },
    ],
  },
]);

function install(extra: Record<string, FakeRoute> = {}) {
  return installFakeFetch({
    "GET /categories": () => jsonResponse(200, categories),
    "GET /products": () => jsonResponse(200, { count: 1, results: [oil] }),
    "GET /products/by-barcode/8961011200111": unknown,
    "GET /products/by-barcode/8961011200128": unknown,
    ...extra,
  });
}

async function openScanner(tab: "camera" | "usb" = "usb") {
  const user = userEvent.setup();
  render(
    <Stub
      initialEntries={[
        tab === "usb"
          ? { pathname: "/admin/products/scan", state: { tab: "usb" } }
          : "/admin/products/scan",
      ]}
    />,
  );
  const drawer = await screen.findByRole("dialog", { name: "Scan to add" });
  return { user, drawer };
}

async function scanNewBarcode() {
  const opened = await openScanner();
  await opened.user.type(
    within(opened.drawer).getByLabelText("Barcode"),
    "8961011200111{Enter}",
  );
  await within(opened.drawer).findByText("New barcode.");
  return opened;
}

async function fillNewProduct(
  user: ReturnType<typeof userEvent.setup>,
  drawer: HTMLElement,
) {
  await user.type(
    within(drawer).getByLabelText("Product name"),
    "Wafer Chocolate 40g",
  );
  await user.selectOptions(within(drawer).getByLabelText("Category"), "Snacks");
  await user.type(within(drawer).getByLabelText("Selling price (Rs)"), "60");
  await user.type(within(drawer).getByLabelText("Cost price (Rs)"), "48");
  await user.type(within(drawer).getByLabelText("Stock"), "24");
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
});

afterEach(() => {
  Reflect.deleteProperty(navigator, "mediaDevices");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("ScanAddRoute", () => {
  it("waits for a scan before showing the form", async () => {
    install();

    const { drawer } = await openScanner();

    expect(within(drawer).getByText("Scan a barcode to start.")).toBeVisible();
    expect(within(drawer).getByLabelText("Barcode")).toHaveFocus();
    expect(
      within(drawer).queryByLabelText("Product name"),
    ).not.toBeInTheDocument();
  });

  it("pre-fills the form for a new barcode", async () => {
    install();

    const { drawer } = await scanNewBarcode();

    const fields = within(drawer).getAllByLabelText("Barcode");
    expect(fields.at(-1)).toHaveValue("8961011200111");
    expect(fields.at(-1)).toHaveAttribute("readonly");
    expect(within(drawer).getByLabelText("Product name")).toHaveFocus();
    expect(within(drawer).getByLabelText("Low-stock alert")).toHaveValue("10");
    expect(within(drawer).getByLabelText("Unit")).toHaveValue("pcs");
  });

  it("opens Edit for a barcode that is already in the catalogue", async () => {
    install({
      "GET /products/by-barcode/8961002300022": () => jsonResponse(200, oil),
    });
    const { user, drawer } = await openScanner();

    await user.type(
      within(drawer).getByLabelText("Barcode"),
      "8961002300022{Enter}",
    );

    expect(await screen.findByText("Edit drawer")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/admin/products/7",
    );
    expect(
      screen.getByText("Cooking Oil 1L is already in your catalogue"),
    ).toBeInTheDocument();
  });

  it("saves the new product and closes", async () => {
    const bodies: unknown[] = [];
    install({
      "POST /products": (body) => {
        bodies.push(body);
        return jsonResponse(201, {
          ...oil,
          id: 12,
          name: "Wafer Chocolate 40g",
          category_id: 4,
          low_stock_alert: "10.000",
          is_archived: false,
        });
      },
    });
    const { user, drawer } = await scanNewBarcode();

    await fillNewProduct(user, drawer);
    await user.click(within(drawer).getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Wafer Chocolate 40g added"),
    ).toBeInTheDocument();
    expect(bodies).toEqual([
      {
        barcode: "8961011200111",
        name: "Wafer Chocolate 40g",
        category_id: 4,
        unit: "pcs",
        price: "60.00",
        cost: "48.00",
        stock: "24.000",
        low_stock_alert: "10.000",
      },
    ]);
    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        /^\/admin\/products$/,
      );
    });
  });

  it("shows the duplicate barcode error on the barcode field", async () => {
    install({
      "POST /products": () =>
        jsonResponse(409, {
          error: { code: "barcode_exists", message: "Barcode exists" },
        }),
    });
    const { user, drawer } = await scanNewBarcode();

    await fillNewProduct(user, drawer);
    await user.click(within(drawer).getByRole("button", { name: "Save" }));

    expect(
      await within(drawer).findByText(
        "This barcode is already in your catalogue.",
      ),
    ).toBeVisible();
  });

  it("marks missing fields without calling the server", async () => {
    const fetchMock = install();
    const { user, drawer } = await scanNewBarcode();

    await user.click(within(drawer).getByRole("button", { name: "Save" }));

    expect(within(drawer).getAllByText("Fill this in.")).toHaveLength(4);
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "POST"),
    ).toBe(false);
  });

  it("says when the lookup is offline", async () => {
    install({
      "GET /products/by-barcode/8961011200111": () =>
        new TypeError("Failed to fetch"),
    });
    const { user, drawer } = await openScanner();

    await user.type(
      within(drawer).getByLabelText("Barcode"),
      "8961011200111{Enter}",
    );

    expect(await within(drawer).findByRole("alert")).toHaveTextContent(
      "You are offline. Looking up a barcode needs a connection.",
    );
  });

  it("opens on the camera tab and explains when the camera cannot scan", async () => {
    install();

    const { user, drawer } = await openScanner("camera");

    expect(
      within(drawer).getByRole("tab", { name: "Phone camera" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      within(drawer).getByRole("region", { name: "Camera view" }),
    ).toHaveTextContent("This browser cannot read barcodes with the camera.");
    await user.click(within(drawer).getByRole("tab", { name: "USB scanner" }));
    expect(within(drawer).getByLabelText("Barcode")).toHaveFocus();
  });

  it("looks up a code the camera detects", async () => {
    let detections = [[{ rawValue: "8961011200111" }]];
    vi.stubGlobal(
      "BarcodeDetector",
      class {
        detect() {
          const next = detections;
          detections = [[]];
          return Promise.resolve(next[0] ?? []);
        }
      },
    );
    const stream = { getTracks: () => [] };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve(stream) },
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    install();

    const { drawer } = await openScanner("camera");

    expect(
      await within(drawer).findByText("New barcode.", {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(within(drawer).getByText("Barcode detected")).toBeInTheDocument();
    expect(within(drawer).getByLabelText("Barcode")).toHaveValue(
      "8961011200111",
    );
  });

  it("saves and scans the next product with the same category", async () => {
    let created = 0;
    install({
      "POST /products": (body) => {
        created += 1;
        const { name } = body as { name: string };
        return jsonResponse(201, {
          ...oil,
          id: 20 + created,
          name,
          category_id: 4,
          low_stock_alert: "10.000",
          is_archived: false,
        });
      },
    });
    const { user, drawer } = await scanNewBarcode();
    expect(
      within(drawer).getByText("0 products added this session"),
    ).toBeInTheDocument();
    expect(drawer).not.toHaveTextContent("pre-selected");

    await fillNewProduct(user, drawer);
    await user.click(
      within(drawer).getByRole("button", { name: "Save & scan next" }),
    );

    expect(
      await within(drawer).findByText("1 product added this session"),
    ).toBeInTheDocument();
    expect(screen.getByText("Wafer Chocolate 40g added")).toBeInTheDocument();
    expect(within(drawer).getByLabelText("Barcode")).toHaveFocus();
    expect(
      within(drawer).queryByLabelText("Product name"),
    ).not.toBeInTheDocument();

    await user.keyboard("8961011200128{Enter}");
    await within(drawer).findByText("New barcode.");
    expect(drawer).toHaveTextContent(
      "Category is pre-selected from your last scan.",
    );
    expect(within(drawer).getByLabelText("Category")).toHaveValue("4");
    expect(within(drawer).getByLabelText("Product name")).toHaveValue("");
  });
});
