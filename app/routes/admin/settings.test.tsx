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

import SettingsRoute from "./settings";

const settings = {
  store_name: "Fresh Basket Mart",
  phone: "0300 1234567",
  address: "Main Road",
  logo: "",
  currency: "PKR",
  tax_rate: "0.00",
  prices_include_tax: true,
  block_when_out_of_stock: false,
  receipt_paper_mm: 80,
  receipt_header: "Welcome to Fresh Basket",
  receipt_footer: "Thank you, come again",
  receipt_show_barcode: true,
};

const Stub = createRoutesStub([
  {
    path: "/admin/settings",
    Component: () => (
      <ToastProvider>
        <SettingsRoute />
      </ToastProvider>
    ),
  },
]);

function install(extra: Record<string, FakeRoute> = {}) {
  return installFakeFetch({
    "GET /tenant/settings": () => jsonResponse(200, settings),
    "GET /counters": () => jsonResponse(200, []),
    ...extra,
  });
}

async function openPage() {
  const user = userEvent.setup();
  render(<Stub initialEntries={["/admin/settings"]} />);
  await screen.findByLabelText("Store name");
  return user;
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("SettingsRoute", () => {
  it("shows the settings and a live receipt preview", async () => {
    install();
    const user = await openPage();
    const preview = screen.getByLabelText("Receipt preview");

    expect(screen.getByLabelText("Store name")).toHaveValue(
      "Fresh Basket Mart",
    );
    expect(preview).toHaveTextContent("Welcome to Fresh Basket");
    expect(within(preview).getByRole("img")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();

    const header = screen.getByLabelText("Header message");
    await user.clear(header);
    await user.type(header, "Salaam and welcome");
    await user.click(
      screen.getByLabelText("Print the bill number as a barcode (for refunds)"),
    );

    expect(preview).toHaveTextContent("Salaam and welcome");
    expect(within(preview).queryByRole("img")).not.toBeInTheDocument();
  });

  it("saves the changed settings", async () => {
    const bodies: unknown[] = [];
    install({
      "PATCH /tenant/settings": (body) => {
        bodies.push(body);
        return jsonResponse(200, {
          ...settings,
          tax_rate: "17.00",
          receipt_paper_mm: 58,
        });
      },
    });
    const user = await openPage();

    const tax = screen.getByLabelText("Sales tax rate (%)");
    await user.clear(tax);
    await user.type(tax, "17");
    await user.click(screen.getByRole("button", { name: "58 mm" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Settings saved")).toBeInTheDocument();
    expect(bodies).toEqual([
      expect.objectContaining({ tax_rate: "17", receipt_paper_mm: 58 }),
    ]);
    expect(screen.getByLabelText("Sales tax rate (%)")).toHaveValue("17.00");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("checks the tax rate before sending anything", async () => {
    const fetchMock = install();
    const user = await openPage();

    const tax = screen.getByLabelText("Sales tax rate (%)");
    await user.clear(tax);
    await user.type(tax, "150");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      screen.getByText(
        "Enter a percent from 0 to 100, with up to two decimals.",
      ),
    ).toBeInTheDocument();
    expect(fetchMock.mock.calls.map((call) => call[1]?.method)).not.toContain(
      "PATCH",
    );
  });
});
