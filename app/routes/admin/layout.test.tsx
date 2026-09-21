import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { createRoutesStub } from "react-router";

import { setSession } from "~/infrastructure/session/session-store";

import AdminLayout, { clientLoader } from "./layout";

const Stub = createRoutesStub([
  {
    path: "/admin",
    Component: AdminLayout,
    loader: clientLoader,
    children: [{ index: true, Component: () => <div>Dashboard content</div> }],
  },
  { path: "/", Component: () => <div>Sign in</div> },
]);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("admin layout guard", () => {
  it("renders the dashboard for an owner session", async () => {
    setSession({
      role: "owner",
      accessToken: "a",
      refreshToken: "r",
      userId: 1,
      fullName: "Sana Ahmed",
    });

    render(<Stub initialEntries={["/admin"]} />);

    expect(await screen.findByText("Dashboard content")).toBeInTheDocument();
  });

  it("redirects to sign in with no session", async () => {
    render(<Stub initialEntries={["/admin"]} />);

    expect(await screen.findByText("Sign in")).toBeInTheDocument();
  });
});
