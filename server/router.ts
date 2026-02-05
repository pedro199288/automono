import { handleAuthRoutes } from "./routes/auth";
import { handleDriveRoutes } from "./routes/drive";
import { handleInvoiceRoutes } from "./routes/invoices";
import { handleVendorRoutes } from "./routes/vendors";
import { handleMovementRoutes } from "./routes/movements";
import { handleRecordRoutes } from "./routes/records";
import { getAllSettings, setSetting } from "./db/queries";

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // CORS headers for development
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Settings endpoints
    if (url.pathname === "/api/settings" && req.method === "GET") {
      const settings = getAllSettings();
      return Response.json({ settings }, { headers: corsHeaders });
    }

    if (url.pathname === "/api/settings" && req.method === "POST") {
      const body = await req.json();
      const entries = body as Record<string, string>;
      for (const [key, value] of Object.entries(entries)) {
        setSetting(key, value);
      }
      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    // Route to handlers
    const handlers = [handleAuthRoutes, handleDriveRoutes, handleInvoiceRoutes, handleVendorRoutes, handleMovementRoutes, handleRecordRoutes];

    for (const handler of handlers) {
      const response = await handler(req, url);
      if (response) {
        // Add CORS headers
        for (const [key, value] of Object.entries(corsHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      }
    }

    return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
  } catch (e: any) {
    console.error("API Error:", e);
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
