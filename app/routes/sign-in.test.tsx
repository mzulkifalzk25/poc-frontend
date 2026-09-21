import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import SignInRoute from "./sign-in";

describe("SignInRoute", () => {
  it("shows the cashier form by default", () => {
    render(<SignInRoute />);

    expect(screen.getByText("Counter")).toBeInTheDocument();
    expect(screen.getByLabelText("Cashier name")).toBeInTheDocument();
    expect(screen.getByLabelText("PIN")).toBeInTheDocument();
  });

  it("switches to the admin form when the admin role card is selected", async () => {
    const user = userEvent.setup();
    render(<SignInRoute />);

    await user.click(screen.getByRole("button", { name: /admin/i }));

    expect(screen.getByLabelText("Email or username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.queryByLabelText("Cashier name")).not.toBeInTheDocument();
  });

  it("marks the selected role card as pressed", async () => {
    const user = userEvent.setup();
    render(<SignInRoute />);

    const cashierCard = screen.getByRole("button", { name: /cashier/i });
    const adminCard = screen.getByRole("button", { name: /admin/i });
    expect(cashierCard).toHaveAttribute("aria-pressed", "true");
    expect(adminCard).toHaveAttribute("aria-pressed", "false");

    await user.click(adminCard);

    expect(adminCard).toHaveAttribute("aria-pressed", "true");
    expect(cashierCard).toHaveAttribute("aria-pressed", "false");
  });
});
