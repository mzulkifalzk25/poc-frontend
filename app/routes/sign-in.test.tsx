import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "~/infrastructure/db/database";
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

async function submitCashier(login: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email or username"), login);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: /^sign in$/i }));
}

beforeEach(async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
  await Promise.all(db.tables.map((table) => table.clear()));
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
    expect(screen.getByLabelText("Email or username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("switches to the admin form when the admin role card is selected", async () => {
    const user = userEvent.setup();
    await renderSignIn();

    await user.click(screen.getByRole("button", { name: /admin/i }));

    expect(screen.getByLabelText("Email or username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.queryByText("Counter")).not.toBeInTheDocument();
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

  it("shows an inline error on wrong owner credentials", async () => {
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

  it("signs the cashier in over the network and opens start your shift", async () => {
    await activateDevice();
    const bodies: unknown[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        bodies.push(
          typeof init?.body === "string" ? JSON.parse(init.body) : null,
        );
        return Promise.resolve(
          jsonResponse(200, {
            access: "a",
            refresh: "r",
            user: { id: 7, full_name: "Zainab Khan" },
          }),
        );
      }),
    );
    await renderSignIn();

    await submitCashier("zainab@example.com", "pw-482134");

    expect(await screen.findByText("Start your shift")).toBeInTheDocument();
    expect(getSession()?.role).toBe("cashier");
    expect(bodies).toEqual([
      { login: "zainab@example.com", password: "pw-482134" },
    ]);
  });

  it("shows a wrong credentials message", async () => {
    await activateDevice();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(401, {
          error: { code: "invalid_credentials", message: "Wrong" },
        }),
      ),
    );
    await renderSignIn();

    await submitCashier("zainab@example.com", "wrong-password");

    expect(
      await screen.findByText("Wrong email, username or password."),
    ).toBeInTheDocument();
  });

  it("shows the wait countdown when sign-in is throttled", async () => {
    await activateDevice();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(429, {
          error: { code: "login_throttled", message: "Wait" },
          retry_after: 30,
        }),
      ),
    );
    await renderSignIn();

    await submitCashier("zainab@example.com", "wrong-password");

    expect(
      await screen.findByText("Wait 30 s, then try again."),
    ).toBeInTheDocument();
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

    await submitCashier("zainab@example.com", "pw-482134");

    expect(await screen.findByText("Deactivated screen")).toBeInTheDocument();
  });

  it("reports being offline on a network failure", async () => {
    await activateDevice();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );
    await renderSignIn();

    await submitCashier("zainab@example.com", "pw-482134");

    expect(
      await screen.findByText(
        "You are offline. Check your connection and try again.",
      ),
    ).toBeInTheDocument();
    expect(getSession()).toBeNull();
  });
});
