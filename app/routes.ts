import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/sign-in.tsx"),
  route("pos/activate", "routes/pos/activate.tsx"),
  route("pos/sign-in", "routes/pos/sign-in.tsx"),
  layout("routes/pos/layout.tsx", [
    ...prefix("pos", [
      index("routes/pos/billing.tsx"),
      route("receipt", "routes/pos/receipt.tsx"),
      route("held", "routes/pos/held.tsx"),
      route("returns", "routes/pos/returns.tsx"),
      route("shift", "routes/pos/shift.tsx"),
    ]),
  ]),
  layout("routes/admin/layout.tsx", [
    ...prefix("admin", [
      index("routes/admin/dashboard.tsx"),
      route("products", "routes/admin/products.tsx"),
      route("products/scan", "routes/admin/scan-add.tsx"),
      route("products/:id", "routes/admin/product-edit.tsx"),
      route("categories", "routes/admin/categories.tsx"),
      route("inventory", "routes/admin/inventory.tsx"),
      route("inventory/adjust", "routes/admin/inventory-adjust.tsx"),
      route("receive", "routes/admin/receive.tsx"),
      route("sales", "routes/admin/sales.tsx"),
      route("reports", "routes/admin/reports.tsx"),
      route("money-trail", "routes/admin/money-trail.tsx"),
      route("staff", "routes/admin/staff.tsx"),
      route("activity-log", "routes/admin/activity-log.tsx"),
      route("settings", "routes/admin/settings.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
