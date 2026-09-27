import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { en } from "~/i18n/strings";
import SettingsRoute from "~/routes/admin/settings";

describe("PlaceholderPage", () => {
  it("shows the page title and coming soon text from the string layer", () => {
    render(<SettingsRoute />);

    expect(
      screen.getByRole("heading", { name: en.adminPages.settings }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.adminPages.comingSoon)).toBeInTheDocument();
  });
});
