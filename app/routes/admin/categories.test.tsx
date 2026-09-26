import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "~/components/ui/ToastProvider";
import {
  installFakeFetch,
  jsonResponse,
} from "~/infrastructure/api/fake-fetch";

import CategoriesRoute from "./categories";

const grocery = {
  id: 1,
  name: "Grocery",
  tint: "grocery",
  product_count: 5120,
};
const dairy = {
  id: 2,
  name: "Dairy & eggs",
  tint: "dairy",
  product_count: 1240,
};

const Stub = createRoutesStub([
  {
    path: "/admin/categories",
    Component: () => (
      <ToastProvider>
        <CategoriesRoute />
      </ToastProvider>
    ),
  },
]);

function renderPage() {
  render(<Stub initialEntries={["/admin/categories"]} />);
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("CategoriesRoute", () => {
  it("shows a card per category and the totals", async () => {
    installFakeFetch({
      "GET /categories": () => jsonResponse(200, [grocery, dairy]),
    });

    renderPage();

    expect(
      await screen.findByText("2 categories · 6,360 products"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Grocery" }),
    ).toBeInTheDocument();
    expect(screen.getByText("5,120")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "View products" })[1],
    ).toHaveAttribute("href", "/admin/products?category=2");
  });

  it("shows the empty state when there are no categories", async () => {
    installFakeFetch({ "GET /categories": () => jsonResponse(200, []) });

    renderPage();

    expect(await screen.findByText("No categories yet")).toBeInTheDocument();
  });

  it("shows the error block and retries", async () => {
    const user = userEvent.setup();
    let calls = 0;
    installFakeFetch({
      "GET /categories": () => {
        calls += 1;
        return calls === 1
          ? new TypeError("Failed to fetch")
          : jsonResponse(200, [grocery]);
      },
    });

    renderPage();
    await user.click(await screen.findByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("heading", { name: "Grocery" }),
    ).toBeVisible();
  });

  it("adds a category with a name and tint", async () => {
    const user = userEvent.setup();
    const created: unknown[] = [];
    let list = [grocery];
    installFakeFetch({
      "GET /categories": () => jsonResponse(200, list),
      "POST /categories": (body) => {
        created.push(body);
        const saved = {
          id: 9,
          name: "Frozen food",
          tint: "snacks",
          product_count: 0,
        };
        list = [grocery, saved];
        return jsonResponse(201, saved);
      },
    });

    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Add category" }),
    );
    const drawer = screen.getByRole("dialog", { name: "Add category" });
    await user.type(
      within(drawer).getByLabelText("Category name"),
      "  Frozen  food",
    );
    await user.click(within(drawer).getByRole("radio", { name: "Pink" }));
    await user.click(
      within(drawer).getByRole("button", { name: "Save category" }),
    );

    expect(await screen.findByText("Frozen food saved")).toBeInTheDocument();
    expect(created).toEqual([{ name: "Frozen food", tint: "snacks" }]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Frozen food" }),
    ).toBeVisible();
  });

  it("suggests the first unused tint for a new category", async () => {
    const user = userEvent.setup();
    installFakeFetch({
      "GET /categories": () => jsonResponse(200, [grocery, dairy]),
    });

    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "New category" }),
    );

    expect(screen.getByRole("radio", { name: "Orange" })).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Save category" }),
    ).toBeDisabled();
  });

  it("edits a category and shows a field error from the server", async () => {
    const user = userEvent.setup();
    installFakeFetch({
      "GET /categories": () => jsonResponse(200, [grocery, dairy]),
      "PATCH /categories/2": () =>
        jsonResponse(400, {
          error: {
            code: "validation_error",
            message: "Invalid",
            fields: { name: ["A category with this name already exists."] },
          },
        }),
    });

    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Edit Dairy & eggs" }),
    );
    const input = screen.getByLabelText("Category name");
    expect(input).toHaveValue("Dairy & eggs");
    await user.clear(input);
    await user.type(input, "Grocery");
    await user.click(screen.getByRole("button", { name: "Save category" }));

    expect(
      await screen.findByText("A category with this name already exists."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Category name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("shows the offline message when saving fails on the network", async () => {
    const user = userEvent.setup();
    installFakeFetch({
      "GET /categories": () => jsonResponse(200, [grocery]),
      "POST /categories": () => new TypeError("Failed to fetch"),
    });

    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Add category" }),
    );
    await user.type(screen.getByLabelText("Category name"), "Frozen");
    await user.click(screen.getByRole("button", { name: "Save category" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You are offline. Check your connection and try again.",
    );
  });

  it("closes the drawer with Escape", async () => {
    const user = userEvent.setup();
    installFakeFetch({ "GET /categories": () => jsonResponse(200, [grocery]) });

    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Add category" }),
    );
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
