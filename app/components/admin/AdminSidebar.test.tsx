import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { createRoutesStub } from "react-router";

import { en } from "~/i18n/strings";
import { setSession } from "~/infrastructure/session/session-store";

import { AdminSidebar } from "./AdminSidebar";

const Stub = createRoutesStub([{ path: "/admin", Component: AdminSidebar }]);

function renderSidebar() {
  render(<Stub initialEntries={["/admin"]} />);
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  setSession({
    role: "manager",
    accessToken: "a",
    refreshToken: "r",
    userId: 2,
    fullName: "Bilal Khan",
  });
});

describe("AdminSidebar", () => {
  it("shows every group and page label from the string layer", async () => {
    renderSidebar();

    const nav = await screen.findByRole("navigation", {
      name: en.adminNav.label,
    });
    for (const group of Object.values(en.adminNav.groups)) {
      expect(nav).toHaveTextContent(group);
    }
    expect(
      screen.getByRole("link", { name: en.adminPages.moneyTrail }),
    ).toHaveAttribute("href", "/admin/money-trail");
    expect(
      screen.getByRole("link", { name: en.adminPages.activityLog }),
    ).toHaveAttribute("href", "/admin/activity-log");
  });

  it("shows the role name for the signed-in user", async () => {
    renderSidebar();

    expect(await screen.findByText("Bilal Khan")).toBeInTheDocument();
    expect(screen.getByText(en.adminNav.roles.manager)).toBeInTheDocument();
  });

  it("uses a logical end border so right-to-left can flip it", async () => {
    renderSidebar();

    const nav = await screen.findByRole("navigation", {
      name: en.adminNav.label,
    });
    const sidebar = nav.parentElement;
    expect(sidebar).toHaveClass("border-e");
    expect(sidebar).not.toHaveClass("border-r");
  });

  it("labels the sign out button", async () => {
    renderSidebar();

    expect(
      await screen.findByRole("button", { name: en.common.signOut }),
    ).toBeInTheDocument();
  });
});
