import { getAllVendors, createVendor, deleteVendor } from "../db/queries";

export async function handleVendorRoutes(req: Request, url: URL): Promise<Response | null> {
  if (url.pathname === "/api/vendors" && req.method === "GET") {
    const type = url.searchParams.get("type") ?? undefined;
    const vendors = getAllVendors(type);
    return Response.json({ vendors });
  }

  if (url.pathname === "/api/vendors" && req.method === "POST") {
    const body = await req.json();
    const { raw_name, type } = body as { raw_name: string; type?: string };
    if (!raw_name) {
      return Response.json({ error: "raw_name is required" }, { status: 400 });
    }
    const vendor = createVendor({ raw_name, type });
    return Response.json({ vendor });
  }

  const vendorMatch = url.pathname.match(/^\/api\/vendors\/([^/]+)$/);
  if (vendorMatch && req.method === "DELETE") {
    const id = vendorMatch[1];
    deleteVendor(id);
    return Response.json({ ok: true });
  }

  return null;
}
