import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Paging } from "./Paging";

describe("Paging", () => {
  it("shows the range and disables Previous on the first page", () => {
    render(
      <Paging page={1} pageSize={10} total={18462} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText("Showing 1–10 of 18,462")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("moves to the next and previous page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Paging page={2} pageSize={10} total={25} onPageChange={onPageChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Previous" }));

    expect(onPageChange.mock.calls).toEqual([[3], [1]]);
  });

  it("disables Next on the last page", () => {
    render(<Paging page={3} pageSize={10} total={25} onPageChange={vi.fn()} />);

    expect(screen.getByText("Showing 21–25 of 25")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(
      <Paging page={1} pageSize={10} total={0} onPageChange={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
