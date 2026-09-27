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

function counter(id: number, extra: object = {}) {
  const code = String(id).padStart(3, "0");
  return {
    id,
    name: `Counter ${String(id)}`,
    code,
    is_active: true,
    status: "activated",
    code_expires_at: null,
    last_seen_at: new Date().toISOString(),
    app_version: "1.0.0",
    last_bill_seq: 742,
    next_bill_no: `${code}000743`,
    unsynced_count: 0,
    has_open_shift: false,
    has_bills: true,
    ...extra,
  };
}

const counters = [
  counter(2, { unsynced_count: 4 }),
  counter(3, {
    status: "not_activated",
    last_seen_at: null,
    next_bill_no: "003000001",
    has_bills: false,
  }),
];

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
    "GET /counters": () => jsonResponse(200, counters),
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

  it("lists counters with their status, next bill number and action", async () => {
    install();
    await openPage();

    const table = await screen.findByRole("table", { name: "Counters" });
    const two = within(table).getByText("Counter 2").closest('[role="row"]');
    expect(two).toHaveTextContent("Activated");
    expect(two).toHaveTextContent("Just now");
    expect(two).toHaveTextContent("002-000743");
    const three = within(table).getByText("Counter 3").closest('[role="row"]');
    expect(three).toHaveTextContent("Not activated");
    expect(three).toHaveTextContent("003-000001");
    expect(
      screen.getByRole("button", { name: "Deactivate: Counter 2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New code: Counter 3" }),
    ).toBeInTheDocument();
  });

  it("makes a code, copies it and revokes it", async () => {
    const calls: string[] = [];
    install({
      "POST /devices/codes": (body) => {
        calls.push(`code ${JSON.stringify(body)}`);
        return jsonResponse(201, {
          code: "K7M4-Q92R",
          expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
        });
      },
      "DELETE /devices/codes/3": () => {
        calls.push("revoke");
        return jsonResponse(204);
      },
    });
    const user = await openPage();

    await user.click(
      await screen.findByRole("button", { name: "New code: Counter 3" }),
    );
    const panel = await screen.findByRole("region", {
      name: "Activation code for Counter 3",
    });
    expect(panel).toHaveTextContent("K7M4-Q92R");
    expect(panel).toHaveTextContent(/1[45]:\d\d left/);
    await user.click(within(panel).getByRole("button", { name: "Copy code" }));
    expect(await navigator.clipboard.readText()).toBe("K7M4-Q92R");
    expect(await screen.findByText("Code copied")).toBeInTheDocument();

    await user.click(
      within(panel).getByRole("button", { name: "Revoke code" }),
    );

    expect(
      await screen.findByText("Code for Counter 3 revoked"),
    ).toBeInTheDocument();
    expect(screen.queryByText("K7M4-Q92R")).not.toBeInTheDocument();
    expect(calls).toEqual(['code {"counter_id":3}', "revoke"]);
  });

  it("warns about unsynced sales and deactivates after a confirmation", async () => {
    const calls: string[] = [];
    install({
      "POST /counters/2/deactivate": () => {
        calls.push("deactivate");
        return jsonResponse(204);
      },
    });
    const user = await openPage();

    await user.click(
      await screen.findByRole("button", { name: "Deactivate: Counter 2" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Deactivate Counter 2?",
    });
    expect(dialog).toHaveTextContent(
      "4 sales on that PC have not uploaded yet and will be lost.",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Deactivate" }),
    );

    expect(
      await screen.findByText("Counter 2 deactivated"),
    ).toBeInTheDocument();
    expect(calls).toEqual(["deactivate"]);
  });

  it("keeps the dialog open with the reason when a shift is open", async () => {
    const message =
      "This counter has an open shift. Close it before deactivating.";
    install({
      "POST /counters/2/deactivate": () =>
        jsonResponse(409, { error: { code: "shift_open", message } }),
    });
    const user = await openPage();

    await user.click(
      await screen.findByRole("button", { name: "Deactivate: Counter 2" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Deactivate Counter 2?",
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Deactivate" }),
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(message);
  });

  it("adds a counter and shows a taken code under the code field", async () => {
    const bodies: unknown[] = [];
    let taken = true;
    install({
      "POST /counters": (body) => {
        bodies.push(body);
        if (taken) {
          taken = false;
          return jsonResponse(409, {
            error: {
              code: "code_exists",
              message: "This counter code is already in use.",
              fields: { code: ["already in use"] },
            },
          });
        }
        return jsonResponse(201, counter(4, { status: "not_activated" }));
      },
    });
    const user = await openPage();

    await user.type(screen.getByLabelText("Name"), "Counter 4");
    await user.type(screen.getByLabelText("3-digit code"), "4");
    await user.click(screen.getByRole("button", { name: "Create counter" }));
    expect(
      screen.getByText("The code is 3 digits, for example 004."),
    ).toBeInTheDocument();

    const code = screen.getByLabelText("3-digit code");
    await user.clear(code);
    await user.type(code, "002");
    await user.click(screen.getByRole("button", { name: "Create counter" }));
    expect(
      await screen.findByText("This counter code is already in use."),
    ).toBeInTheDocument();

    await user.clear(code);
    await user.type(code, "004");
    await user.click(screen.getByRole("button", { name: "Create counter" }));

    expect(await screen.findByText("Counter 4 created")).toBeInTheDocument();
    expect(bodies).toEqual([
      { name: "Counter 4", code: "002" },
      { name: "Counter 4", code: "004" },
    ]);
    expect(screen.getByLabelText("3-digit code")).toHaveValue("");
  });
});
