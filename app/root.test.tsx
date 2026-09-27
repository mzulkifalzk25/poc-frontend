import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { en } from "~/i18n/strings";

import { ErrorBoundary } from "./root";
import type { Route } from "./+types/root";

function renderBoundary(error: unknown) {
  const props = { error } as Route.ErrorBoundaryProps;
  render(<ErrorBoundary {...props} />);
}

describe("root error screen", () => {
  it("shows the title from the string layer and the error message", () => {
    renderBoundary(new Error("Disk full"));

    expect(
      screen.getByRole("heading", { name: en.states.error.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("Disk full")).toBeInTheDocument();
  });

  it("falls back to the unknown error text", () => {
    renderBoundary("not an error");

    expect(screen.getByText(en.states.error.unknown)).toBeInTheDocument();
  });
});
