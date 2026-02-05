import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("invoices", "routes/invoices.tsx"),
    route("invoices/:type", "routes/invoices.$type.tsx"),
    route("invoices/:type/:billId", "routes/invoices.$type.$billId.tsx"),
    route("movements", "routes/movements.tsx"),
    route("movements/:type", "routes/movements.$type.tsx"),
    route("movements/:type/new", "routes/movements.$type.new.tsx"),
    route("movements/:type/:id", "routes/movements.$type.$id.tsx"),
    route("records", "routes/records.tsx"),
    route("records/:type", "routes/records.$type.tsx"),
    route("records/:type/:source/:id", "routes/records.$type.$source.$id.tsx"),
    route("drive", "routes/drive.tsx"),
    route("vendors", "routes/vendors.tsx"),
    route("clients", "routes/clients.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
