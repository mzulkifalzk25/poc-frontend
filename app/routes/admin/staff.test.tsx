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

import StaffRoute from "./staff";

const secondsAgo = (seconds: number) =>
  new Date(Date.now() - seconds * 1000).toISOString();

function person(id: number, fullName: string, extra: object = {}) {
  return {
    id,
    full_name: fullName,
    initials: fullName
      .split(" ")
      .map((word) => word[0])
      .join(""),
    role: "cashier",
    email: null,
    username: null,
    default_counter_id: 2,
    is_active: true,
    last_active_at: null,
    ...extra,
  };
}

const sana = person(1, "Sana Ahmed", {
  role: "owner",
  default_counter_id: null,
});
const zainab = person(2, "Zainab Khan", { last_active_at: secondsAgo(20) });
const usman = person(3, "Usman Tariq", { is_active: false });

const counters = [
  { id: 1, name: "Counter 1", code: "001", status: "activated" },
  { id: 2, name: "Counter 2", code: "002", status: "activated" },
];

const Stub = createRoutesStub([
  {
    path: "/admin/staff",
    Component: () => (
      <ToastProvider>
        <StaffRoute />
      </ToastProvider>
    ),
  },
]);

function install(extra: Record<string, FakeRoute> = {}) {
  return installFakeFetch({
    "GET /users": () =>
      jsonResponse(200, { count: 3, results: [sana, zainab, usman] }),
    "GET /counters": () => jsonResponse(200, counters),
    ...extra,
  });
}

async function openPage() {
  const user = userEvent.setup();
  render(<Stub initialEntries={["/admin/staff"]} />);
  await screen.findByText("Zainab Khan");
  return user;
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("StaffRoute", () => {
  it("lists staff with role, counter, last active and status", async () => {
    install();
    await openPage();

    expect(
      screen.getByText("1 owner · 2 cashiers · 1 signed in now"),
    ).toBeInTheDocument();
    const row = screen.getByText("Zainab Khan").closest('[role="row"]');
    expect(row).toHaveTextContent("Counter 2");
    expect(row).toHaveTextContent("Now");
    expect(row).toHaveTextContent("Active");
    const owner = screen.getByText("Sana Ahmed").closest('[role="row"]');
    expect(owner).toHaveTextContent("All counters");
    expect(
      within(owner as HTMLElement).queryByRole("button", { name: /Manage/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Deactivated")).toBeInTheDocument();
  });

  it("creates a cashier and clears the form", async () => {
    const bodies: unknown[] = [];
    install({
      "POST /users": (body) => {
        bodies.push(body);
        return jsonResponse(201, person(9, "Ali Hassan"));
      },
    });
    const user = await openPage();

    await user.type(screen.getByLabelText("Full name"), "  Ali   Hassan ");
    await user.type(screen.getByLabelText("Email"), "ali@example.com");
    await user.type(screen.getByLabelText("Password"), "pw-482134");
    await user.selectOptions(screen.getByLabelText("Default counter"), "1");
    await user.click(screen.getByRole("button", { name: "Create cashier" }));

    expect(await screen.findByText("Ali Hassan added")).toBeInTheDocument();
    expect(bodies).toEqual([
      {
        full_name: "Ali Hassan",
        role: "cashier",
        email: "ali@example.com",
        username: undefined,
        password: "pw-482134",
        default_counter_id: 1,
      },
    ]);
    expect(screen.getByLabelText("Full name")).toHaveValue("");
  });

  it("checks the name, login and password before sending anything", async () => {
    const fetchMock = install();
    const user = await openPage();

    await user.click(screen.getByRole("button", { name: "Create cashier" }));

    expect(
      screen.getByText("Enter the cashier's full name."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter an email or a username."),
    ).toBeInTheDocument();
    expect(screen.getByText("Enter a password.")).toBeInTheDocument();
    expect(fetchMock.mock.calls.map((call) => call[1]?.method)).not.toContain(
      "POST",
    );
  });

  it("shows a taken name under the name field", async () => {
    const message = "A cashier with this name already exists.";
    install({
      "POST /users": () =>
        jsonResponse(409, {
          error: {
            code: "name_exists",
            message,
            fields: { full_name: [message] },
          },
        }),
    });
    const user = await openPage();

    await user.type(screen.getByLabelText("Full name"), "Zainab Khan");
    await user.type(screen.getByLabelText("Email"), "zainab2@example.com");
    await user.type(screen.getByLabelText("Password"), "pw-482134");
    await user.click(screen.getByRole("button", { name: "Create cashier" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("edits a cashier from Manage without asking for a password", async () => {
    const bodies: unknown[] = [];
    install({
      "PATCH /users/2": (body) => {
        bodies.push(body);
        return jsonResponse(200, { ...zainab, full_name: "Zainab K" });
      },
    });
    const user = await openPage();

    await user.click(
      screen.getByRole("button", { name: "Manage Zainab Khan" }),
    );
    expect(screen.getByText("Edit cashier")).toBeInTheDocument();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    const name = screen.getByLabelText("Full name");
    await user.clear(name);
    await user.type(name, "Zainab K");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Zainab K saved")).toBeInTheDocument();
    expect(bodies).toEqual([{ full_name: "Zainab K", default_counter_id: 2 }]);
    expect(screen.getByText("Add cashier")).toBeInTheDocument();
  });

  it("resets a password after a confirmation and shows the new password once", async () => {
    install({
      "POST /users/2/reset-password": () =>
        jsonResponse(200, { password: "Blue-Kettle-42" }),
    });
    const user = await openPage();

    await user.click(
      screen.getByRole("button", { name: "Manage Zainab Khan" }),
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    const confirm = screen.getByRole("dialog", {
      name: "Reset Zainab Khan's password?",
    });
    await user.click(
      within(confirm).getByRole("button", { name: "Reset password" }),
    );

    const shown = await screen.findByRole("dialog", { name: "New password" });
    expect(within(shown).getByLabelText("New password")).toHaveTextContent(
      "Blue-Kettle-42",
    );
    await user.click(within(shown).getByRole("button", { name: "Done" }));
    expect(screen.queryByText("Blue-Kettle-42")).not.toBeInTheDocument();
  });

  it("deactivates a cashier after a confirmation", async () => {
    const bodies: unknown[] = [];
    install({
      "PATCH /users/2": (body) => {
        bodies.push(body);
        return jsonResponse(200, { ...zainab, is_active: false });
      },
    });
    const user = await openPage();

    await user.click(
      screen.getByRole("button", { name: "Manage Zainab Khan" }),
    );
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    const confirm = screen.getByRole("dialog", {
      name: "Deactivate Zainab Khan?",
    });
    await user.click(
      within(confirm).getByRole("button", { name: "Deactivate" }),
    );

    expect(
      await screen.findByText("Zainab Khan deactivated"),
    ).toBeInTheDocument();
    expect(bodies).toEqual([{ is_active: false }]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reactivates a deactivated cashier in one step", async () => {
    const bodies: unknown[] = [];
    install({
      "PATCH /users/3": (body) => {
        bodies.push(body);
        return jsonResponse(200, { ...usman, is_active: true });
      },
    });
    const user = await openPage();

    await user.click(
      screen.getByRole("button", { name: "Manage Usman Tariq" }),
    );
    await user.click(screen.getByRole("button", { name: "Reactivate" }));

    expect(
      await screen.findByText("Usman Tariq can sign in again"),
    ).toBeInTheDocument();
    expect(bodies).toEqual([{ is_active: true }]);
  });
});
