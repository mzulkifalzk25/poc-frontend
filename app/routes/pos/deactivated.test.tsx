import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import {
  clearDeviceMeta,
  getDeviceMeta,
  saveDeviceMeta,
} from "~/infrastructure/session/device-store";

import DeactivatedRoute, { clientLoader } from "./deactivated";

const Stub = createRoutesStub([
  {
    path: "/pos/deactivated",
    Component: DeactivatedRoute,
    loader: clientLoader,
  },
  { path: "/pos/activate", Component: () => <div>Activate page</div> },
  { path: "/", Component: () => <div>Sign in page</div> },
]);

async function storeDevice(revokedAt: string | null) {
  await saveDeviceMeta({
    token: "device-1",
    counter: { id: 2, name: "Counter 2", code: "002" },
    activatedAt: "2026-09-26T10:00:00Z",
    revokedAt,
  });
}

beforeEach(async () => {
  await clearDeviceMeta();
});

describe("DeactivatedRoute", () => {
  it("explains that the PC was deactivated", async () => {
    await storeDevice("2026-09-26T12:00:00Z");
    render(<Stub initialEntries={["/pos/deactivated"]} />);

    expect(
      await screen.findByRole("heading", { name: "This PC was deactivated" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("It was Counter 2 (code 002)."),
    ).toBeInTheDocument();
  });

  it("clears the old device and opens activation for a new code", async () => {
    await storeDevice("2026-09-26T12:00:00Z");
    const user = userEvent.setup();
    render(<Stub initialEntries={["/pos/deactivated"]} />);

    await user.click(
      await screen.findByRole("button", { name: "Activate with a new code" }),
    );

    expect(await screen.findByText("Activate page")).toBeInTheDocument();
    expect(await getDeviceMeta()).toBeNull();
  });

  it("sends an active PC back to sign in", async () => {
    await storeDevice(null);
    render(<Stub initialEntries={["/pos/deactivated"]} />);

    expect(await screen.findByText("Sign in page")).toBeInTheDocument();
  });
});
