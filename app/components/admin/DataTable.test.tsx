import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataTable, type Column } from "./DataTable";

interface Row {
  id: number;
  name: string;
  price: string;
}

const columns: Column<Row>[] = [
  { id: "name", header: "Product", render: (row) => row.name },
  { id: "price", header: "Price", align: "end", render: (row) => row.price },
];

describe("DataTable", () => {
  it("renders a header row and one row per item", () => {
    render(
      <DataTable
        label="Products"
        columns={columns}
        rows={[
          { id: 1, name: "Sugar 1kg", price: "Rs 180" },
          { id: 2, name: "Bread Loaf", price: "Rs 150" },
        ]}
        rowKey={(row) => row.id}
        gridTemplate="2fr 1fr"
        footer={<div>Footer</div>}
      />,
    );

    const table = screen.getByRole("table", { name: "Products" });
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(
      within(rows[0] as HTMLElement).getAllByRole("columnheader"),
    ).toHaveLength(2);
    expect(within(rows[1] as HTMLElement).getByText("Sugar 1kg")).toBeVisible();
    expect(screen.getByText("Rs 150")).toHaveClass("text-end");
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});
