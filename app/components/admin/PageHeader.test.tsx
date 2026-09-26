import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("shows the title, subtitle and actions", () => {
    render(
      <PageHeader
        title="Products"
        subtitle="12 products across 7 categories"
        actions={<button type="button">Add product</button>}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Products" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("12 products across 7 categories"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add product" }),
    ).toBeInTheDocument();
  });
});
