import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmptyState, ErrorState, LoadingState } from "./StateBlocks";

describe("state blocks", () => {
  it("shows the empty line, hint and action", () => {
    render(
      <EmptyState
        title="No products yet"
        hint="Scan a barcode to add the first one."
        action={<button type="button">Scan to add</button>}
      />,
    );

    expect(screen.getByText("No products yet")).toBeInTheDocument();
    expect(
      screen.getByText("Scan a barcode to add the first one."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Scan to add" }),
    ).toBeInTheDocument();
  });

  it("shows the default error and retries", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("hides the retry button when there is nothing to retry", () => {
    render(<ErrorState title="Not found" hint="This product is gone." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Not found");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("announces loading", () => {
    render(<LoadingState />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
  });
});
