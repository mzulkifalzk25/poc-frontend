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
    pin_delay_until: null,
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
    await user.type(screen.getByLabelText("PIN"), "0420");
    await user.selectOptions(screen.getByLabelText("Default counter"), "1");
    await user.click(screen.getByRole("button", { name: "Create cashier" }));

    expect(await screen.findByText("Ali Hassan added")).toBeInTheDocument();
    expect(bodies).toEqual([
      {
        full_name: "Ali Hassan",
        role: "cashier",
        pin: "0420",
        default_counter_id: 1,
      },
    ]);
    expect(screen.getByLabelText("Full name")).toHaveValue("");
  });

  it("checks the name and PIN before sending anything", async () => {
    const fetchMock = install();
    const user = await openPage();

    await user.type(screen.getByLabelText("PIN"), "12");
    await user.click(screen.getByRole("button", { name: "Create cashier" }));

    expect(
      screen.getByText("Enter the cashier's full name."),
    ).toBeInTheDocument();
    expect(screen.getByText("The PIN is 4 digits.")).toBeInTheDocument();
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
    await user.type(screen.getByLabelText("PIN"), "1234");
    await user.click(screen.getByRole("button", { name: "Create cashier" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("edits a cashier from Manage without asking for a PIN", async () => {
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
    expect(screen.queryByLabelText("PIN")).not.toBeInTheDocument();
    const name = screen.getByLabelText("Full name");
    await user.clear(name);
    await user.type(name, "Zainab K");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Zainab K saved")).toBeInTheDocument();
    expect(bodies).toEqual([{ full_name: "Zainab K", default_counter_id: 2 }]);
    expect(screen.getByText("Add cashier")).toBeInTheDocument();
  });
});
