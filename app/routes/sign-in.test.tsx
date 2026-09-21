import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getSession } from "~/infrastructure/session/session-store";

import SignInRoute from "./sign-in";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const Stub = createRoutesStub([
  { path: "/", Component: SignInRoute },
  { path: "/admin", Component: () => <div>Admin dashboard</div> },
]);

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("SignInRoute", () => {
  it("shows the cashier form by default", () => {
    render(<Stub initialEntries={["/"]} />);

    expect(screen.getByText("Counter")).toBeInTheDocument();
    expect(screen.getByLabelText("Cashier name")).toBeInTheDocument();
    expect(screen.getByLabelText("PIN")).toBeInTheDocument();
  });

  it("switches to the admin form when the admin role card is selected", async () => {
    const user = userEvent.setup();
    render(<Stub initialEntries={["/"]} />);

    await user.click(screen.getByRole("button", { name: /admin/i }));

    expect(screen.getByLabelText("Email or username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.queryByLabelText("Cashier name")).not.toBeInTheDocument();
  });

  it("marks the selected role card as pressed", async () => {
    const user = userEvent.setup();
    render(<Stub initialEntries={["/"]} />);

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
    render(<Stub initialEntries={["/"]} />);

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
    render(<Stub initialEntries={["/"]} />);

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
});
