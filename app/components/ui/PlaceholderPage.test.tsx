import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { en } from "~/i18n/strings";

import { PlaceholderPage } from "./PlaceholderPage";

describe("PlaceholderPage", () => {
  it("shows the page title and coming soon text from the string layer", () => {
    render(<PlaceholderPage title={en.adminPages.reports} />);

    expect(
      screen.getByRole("heading", { name: en.adminPages.reports }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.adminPages.comingSoon)).toBeInTheDocument();
  });
});
