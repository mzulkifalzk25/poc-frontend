import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearDeviceMeta,
  getDeviceMeta,
} from "~/infrastructure/session/device-store";

import ActivateRoute from "./activate";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const Stub = createRoutesStub([
  { path: "/pos/activate", Component: ActivateRoute },
  { path: "/", Component: () => <div>Sign in page</div> },
]);

function mockApi(activateResponse: Response | Error) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.endsWith("/pos/roster")) {
        return Promise.resolve(
          jsonResponse(200, [
            { id: 1, full_name: "Zainab Khan", initials: "ZK" },
            { id: 2, full_name: "Bilal Raza", initials: "BR" },
            { id: 3, full_name: "Hina Malik", initials: "HM" },
          ]),
        );
      }
      return activateResponse instanceof Error
        ? Promise.reject(activateResponse)
        : Promise.resolve(activateResponse);
    }),
  );
}

async function typeCode(code: string) {
  const user = userEvent.setup();
  render(<Stub initialEntries={["/pos/activate"]} />);
  await user.type(await screen.findByLabelText("Activation code"), code);
  await user.click(screen.getByRole("button", { name: /activate/i }));
}

beforeEach(async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
  await clearDeviceMeta();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("ActivateRoute", () => {
  it("formats the typed code and keeps Activate off until it is complete", async () => {
    const user = userEvent.setup();
    render(<Stub initialEntries={["/pos/activate"]} />);
    const input = await screen.findByLabelText("Activation code");
    const button = screen.getByRole("button", { name: /activate/i });

    await user.type(input, "k7m4q9");
    expect(input).toHaveValue("K7M4-Q9");
    expect(button).toBeDisabled();

    await user.type(input, "2r");
    expect(input).toHaveValue("K7M4-Q92R");
    expect(button).toBeEnabled();
  });

  it("activates the PC, stores it and shows the counter", async () => {
    mockApi(
      jsonResponse(201, {
        device_token: "device-1",
        counter: { id: 3, name: "Counter 3", code: "003" },
      }),
    );

    await typeCode("k7m4-q92r");

    expect(await screen.findByText("This PC is Counter 3")).toBeInTheDocument();
    expect(screen.getByText("3 on the sign-in list")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /continue to sign in/i }),
    ).toHaveAttribute("href", "/");
    const meta = await getDeviceMeta();
    expect(meta?.token).toBe("device-1");
    expect(meta?.counter.code).toBe("003");
    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({
      code: "K7M4-Q92R",
    });
  });

  it.each([
    [400, "code_invalid", "This code is not valid. Check it and try again."],
    [
      410,
      "code_expired",
      "This code has expired. Ask the owner for a new one.",
    ],
    [
      409,
      "code_used",
      "This code was already used. Ask the owner for a new one.",
    ],
  ])("shows the %i %s error inline", async (status, code, message) => {
    mockApi(jsonResponse(status, { error: { code, message: code } }));

    await typeCode("K7M4Q92R");

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(await getDeviceMeta()).toBeNull();
  });

  it("shows the offline message when the network fails", async () => {
    mockApi(new TypeError("Failed to fetch"));

    await typeCode("K7M4Q92R");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You are offline. Activating a counter needs an internet connection.",
    );
  });

  it("shows the wait when activation is rate limited", async () => {
    mockApi(
      jsonResponse(429, {
        error: { code: "throttled", message: "Slow down" },
        retry_after: 300,
      }),
    );

    await typeCode("K7M4Q92R");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many tries. Wait 5 min, then try again.",
    );
  });
});
