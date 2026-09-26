import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SyncPillView } from "./SyncPill";

describe("SyncPillView", () => {
  it("says all sales are synced when online with nothing waiting", () => {
    render(<SyncPillView online status={{ pending: 0, rejected: 0 }} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Online · all sales synced",
    );
  });

  it("counts the sales saved on this device when offline", () => {
    render(
      <SyncPillView online={false} status={{ pending: 4, rejected: 0 }} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Offline · 4 sales saved on this device",
    );
  });

  it("shows sales still syncing when back online", () => {
    render(<SyncPillView online status={{ pending: 1, rejected: 0 }} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Online · 1 sale syncing",
    );
  });

  it("raises a support alert for rejected sales", () => {
    render(<SyncPillView online status={{ pending: 0, rejected: 2 }} />);

    expect(screen.getAllByRole("status")[1]).toHaveTextContent(
      "2 sales could not be uploaded. Call support.",
    );
  });
});
