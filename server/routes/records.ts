import { getUnifiedRecords } from "../db/queries";

export async function handleRecordRoutes(req: Request, url: URL): Promise<Response | null> {
  // GET /api/records/:type - Lista unificada de facturas + movimientos
  const listMatch = url.pathname.match(/^\/api\/records\/(gastos|ingresos)$/);
  if (listMatch && req.method === "GET") {
    const type = listMatch[1] as "gastos" | "ingresos";
    const result = getUnifiedRecords(type);
    return Response.json(result);
  }

  return null;
}
