import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installFakeFetch,
  jsonResponse,
} from "~/infrastructure/api/fake-fetch";
import { db } from "~/infrastructure/db/database";
import { META_KEYS } from "~/infrastructure/db/meta-keys";
import { metaStore } from "~/infrastructure/db/meta-store";
import { shiftStore } from "~/infrastructure/db/shift-store";
import { productRow } from "~/infrastructure/db/test-database";
import { saveDeviceMeta } from "~/infrastructure/session/device-store";
import { setSession } from "~/infrastructure/session/session-store";

import PosSignInRoute, { clientLoader } from "./sign-in";

const Stub = createRoutesStub([
  { path: "/pos/sign-in", Component: PosSignInRoute, loader: clientLoader },
  { path: "/pos", Component: () => <div>Billing desk</div> },
  { path: "/", Component: () => <div>Sign in page</div> },
]);

async function prepareCounter({ synced = true } = {}) {
  await saveDeviceMeta({
    token: "device-token",
    counter: { id: 2, name: "Counter 2", code: "002" },
    activatedAt: "2026-09-26T03:00:00Z",
    revokedAt: null,
  });
  setSession({
    role: "cashier",
    accessToken: "",
    refreshToken: "",
    userId: 12,
    fullName: "Zainab Khan",
    offline: true,
  });
  if (synced) {
    await metaStore.set(META_KEYS.firstSyncDone, true);
    await metaStore.set(META_KEYS.lastSyncAt, new Date().toISOString());
    await db.products.bulkPut([productRow(1), productRow(2), productRow(3)]);
  }
}

async function renderScreen() {
  render(<Stub initialEntries={["/pos/sign-in"]} />);
  return screen.findByRole("heading", { name: "Start your shift" });
}

beforeEach(async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
  await Promise.all(db.tables.map((table) => table.clear()));
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Start your shift", () => {
  it("shows who is signing in and the counter status", async () => {
    await prepareCounter();
    installFakeFetch({});

    await renderScreen();

    expect(screen.getByText("Zainab Khan · Counter 2")).toBeInTheDocument();
    expect(screen.getByText("3 products ready")).toBeInTheDocument();
    expect(screen.getByText("Just now")).toBeInTheDocument();
    expect(screen.getByLabelText("Cash in the drawer right now")).toHaveFocus();
  });

  it("opens the shift on this PC, tells the server and goes to billing", async () => {
    await prepareCounter();
    const bodies: unknown[] = [];
    const fetchMock = installFakeFetch({
      "POST /shifts/open": (body) => {
        bodies.push(body);
        return jsonResponse(201, {});
      },
    });
    const user = userEvent.setup();
    await renderScreen();

    await user.type(
      screen.getByLabelText("Cash in the drawer right now"),
      "5,000",
    );
    await user.click(screen.getByRole("button", { name: /start shift/i }));

    expect(await screen.findByText("Billing desk")).toBeInTheDocument();
    const shift = await shiftStore.current(2);
    expect(shift).toMatchObject({
      cashierId: 12,
      openingCash: "5000.00",
      status: "open",
    });
    await waitFor(() => {
      expect(bodies).toEqual([
        expect.objectContaining({
          id: shift?.id,
          counter_id: 2,
          opening_cash: "5000.00",
          cashier_id: 12,
        }),
      ]);
    });
    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get("Authorization")).toBe("Device device-token");
    await waitFor(async () => {
      expect((await shiftStore.get(shift?.id ?? ""))?.syncState).toBe(
        "open_synced",
      );
    });
  });

  it("starts the shift even when the server cannot be reached", async () => {
    await prepareCounter();
    installFakeFetch({
      "POST /shifts/open": () => new TypeError("Failed to fetch"),
    });
    const user = userEvent.setup();
    await renderScreen();

    await user.type(screen.getByLabelText("Cash in the drawer right now"), "0");
    await user.click(screen.getByRole("button", { name: /start shift/i }));

    expect(await screen.findByText("Billing desk")).toBeInTheDocument();
    expect(await shiftStore.current(2)).toMatchObject({
      syncState: "open_pending",
    });
  });

  it("asks for the opening cash as a number", async () => {
    await prepareCounter();
    installFakeFetch({});
    const user = userEvent.setup();
    await renderScreen();

    await user.click(screen.getByRole("button", { name: /start shift/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter the cash in the drawer, 0 or more.",
    );
  });

  it("blocks the start until the first download finished", async () => {
    await prepareCounter({ synced: false });
    installFakeFetch({
      "GET /products/sync/": () => new TypeError("Failed to fetch"),
    });

    await renderScreen();

    expect(await screen.findByText("Download stopped")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start shift/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });

  it("goes straight to billing when this cashier's shift is already open", async () => {
    await prepareCounter();
    await shiftStore.save({
      id: "s0",
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
    installFakeFetch({});

    render(<Stub initialEntries={["/pos/sign-in"]} />);

    expect(await screen.findByText("Billing desk")).toBeInTheDocument();
  });

  it("will not open a second shift while another cashier's is open", async () => {
    await prepareCounter();
    await shiftStore.save({
      id: "s0",
      counterId: 2,
      cashierId: 13,
      cashierName: "Bilal Raza",
      openedAt: "2026-09-26T03:00:00Z",
      openingCash: "5000.00",
      status: "open",
      closedAt: null,
      countedCash: null,
      syncState: "open_synced",
    });
    installFakeFetch({});
    const user = userEvent.setup();
    await renderScreen();

    await user.type(
      screen.getByLabelText("Cash in the drawer right now"),
      "100",
    );
    await user.click(screen.getByRole("button", { name: /start shift/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bilal Raza's shift is still open on this counter.",
    );
  });

  it("signs out from the Not you link", async () => {
    await prepareCounter();
    installFakeFetch({});
    const user = userEvent.setup();
    await renderScreen();

    await user.click(screen.getByRole("button", { name: "Not you? Sign out" }));

    expect(await screen.findByText("Sign in page")).toBeInTheDocument();
  });
});
