import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearDeviceMeta,
  saveDeviceMeta,
} from "~/infrastructure/session/device-store";
import { getSession } from "~/infrastructure/session/session-store";

import SignInRoute, { clientLoader } from "./sign-in";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const Stub = createRoutesStub([
  { path: "/", Component: SignInRoute, loader: clientLoader },
  { path: "/admin", Component: () => <div>Admin dashboard</div> },
  { path: "/pos/sign-in", Component: () => <div>Start your shift</div> },
  { path: "/pos/deactivated", Component: () => <div>Deactivated screen</div> },
]);

const roster = [{ id: 7, full_name: "Zainab Khan", initials: "ZK" }];

async function activateDevice() {
  await saveDeviceMeta({
    token: "device-token",
    counter: { id: 2, name: "Counter 2", code: "002" },
    activatedAt: "2026-09-26T10:00:00Z",
    revokedAt: null,
  });
}

async function renderSignIn() {
  render(<Stub initialEntries={["/"]} />);
  await screen.findByText("Welcome back!");
}

function mockCashierApi(pinLoginResponse: Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        url.endsWith("/pos/roster")
          ? jsonResponse(200, roster)
          : pinLoginResponse,
      ),
    ),
  );
}

async function submitCashier(name: string, pin: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Cashier name"), name);
  await user.type(screen.getByLabelText("PIN"), pin);
  await user.click(screen.getByRole("button", { name: /^sign in$/i }));
}

beforeEach(async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
  await clearDeviceMeta();
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("SignInRoute", () => {
  it("shows the cashier form by default", async () => {
    await renderSignIn();

    expect(screen.getByText("Counter")).toBeInTheDocument();
    expect(screen.getByLabelText("Cashier name")).toBeInTheDocument();
    expect(screen.getByLabelText("PIN")).toBeInTheDocument();
  });

  it("switches to the admin form when the admin role card is selected", async () => {
    const user = userEvent.setup();
    await renderSignIn();

    await user.click(screen.getByRole("button", { name: /admin/i }));

    expect(screen.getByLabelText("Email or username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.queryByLabelText("Cashier name")).not.toBeInTheDocument();
  });

  it("marks the selected role card as pressed", async () => {
    const user = userEvent.setup();
    await renderSignIn();

    const cashierCard = screen.getByRole("button", { name: /cashier/i });
    const adminCard = screen.getByRole("button", { name: /admin/i });
    expect(cashierCard).toHaveAttribute("aria-pressed", "true");
    expect(adminCard).toHaveAttribute("aria-pressed", "false");

    await user.click(adminCard);

    expect(adminCard).toHaveAttribute("aria-pressed", "true");
    expect(cashierCard).toHaveAttribute("aria-pressed", "false");
  });

  it("signs the owner in and navigates to the dashboard", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          access: "a",
          refresh: "r",
          user: { id: 1, full_name: "Sana Ahmed", role: "owner" },
        }),
      ),
    );
    const user = userEvent.setup();
    await renderSignIn();

    await user.click(screen.getByRole("button", { name: /admin/i }));
    await user.type(
      screen.getByLabelText("Email or username"),
      "sana@freshbasket.example",
    );
    await user.type(screen.getByLabelText("Password"), "correct-password");
    await user.click(screen.getByRole("button", { name: /sign in to admin/i }));

    expect(await screen.findByText("Admin dashboard")).toBeInTheDocument();
    expect(getSession()?.role).toBe("owner");
  });

  it("shows an inline error on wrong credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(401, {
          error: { code: "invalid_credentials", message: "Wrong" },
        }),
      ),
    );
    const user = userEvent.setup();
    await renderSignIn();

    await user.click(screen.getByRole("button", { name: /admin/i }));
    await user.type(
      screen.getByLabelText("Email or username"),
      "sana@freshbasket.example",
    );
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: /sign in to admin/i }));

    expect(
      await screen.findByText("Wrong email, username or password."),
    ).toBeInTheDocument();
    expect(getSession()).toBeNull();
  });

  it("shows the counter of this PC in cashier mode", async () => {
    await activateDevice();
    await renderSignIn();

    expect(screen.getByText("Counter 2 (this PC)")).toBeInTheDocument();
  });

  it("asks to activate the PC and blocks cashier sign in when not activated", async () => {
    await renderSignIn();

    expect(
      screen.getByRole("link", { name: "Activate this counter" }),
    ).toHaveAttribute("href", "/pos/activate");
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeDisabled();
  });

  it("signs the cashier in and opens start your shift", async () => {
    await activateDevice();
    mockCashierApi(
      jsonResponse(200, {
        access: "a",
        refresh: "r",
        user: { id: 7, full_name: "Zainab Khan" },
      }),
    );
    await renderSignIn();

    await submitCashier(" zainab  KHAN ", "1234");

    expect(await screen.findByText("Start your shift")).toBeInTheDocument();
    expect(getSession()?.role).toBe("cashier");
  });

  it("says the name was not found without calling pin login", async () => {
    await activateDevice();
    mockCashierApi(jsonResponse(500, {}));
    await renderSignIn();

    await submitCashier("Nobody Here", "1234");

    expect(
      await screen.findByText("We could not find that name on this counter."),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("shows a wrong pin message", async () => {
    await activateDevice();
    mockCashierApi(
      jsonResponse(401, { error: { code: "invalid_pin", message: "Wrong" } }),
    );
    await renderSignIn();

    await submitCashier("Zainab Khan", "0000");

    expect(
      await screen.findByText("Wrong PIN. Try again."),
    ).toBeInTheDocument();
  });

  it("shows the wait countdown when the pin is throttled", async () => {
    await activateDevice();
    mockCashierApi(
      jsonResponse(429, {
        error: { code: "pin_throttled", message: "Wait" },
        retry_after: 30,
      }),
    );
    await renderSignIn();

    await submitCashier("Zainab Khan", "0000");

    expect(
      await screen.findByText("Wait 30 s, then try again."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("PIN")).toBeDisabled();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeDisabled();
  });

  it("blocks cashier sign in on a deactivated PC and links to the explanation", async () => {
    await saveDeviceMeta({
      token: "device-token",
      counter: { id: 2, name: "Counter 2", code: "002" },
      activatedAt: "2026-09-26T10:00:00Z",
      revokedAt: "2026-09-26T12:00:00Z",
    });
    await renderSignIn();

    expect(screen.getByText("This PC was deactivated")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "See what to do" }),
    ).toHaveAttribute("href", "/pos/deactivated");
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeDisabled();
  });

  it("opens the deactivated screen when the server revokes the PC", async () => {
    await activateDevice();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(401, {
          error: { code: "device_revoked", message: "Deactivated" },
        }),
      ),
    );
    await renderSignIn();

    await submitCashier("Zainab Khan", "1234");

    expect(await screen.findByText("Deactivated screen")).toBeInTheDocument();
  });
});
