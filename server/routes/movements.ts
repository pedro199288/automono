import { financialMovementsInsertSchema } from "../db/zod-schemas";
import {
  getMovementsByType,
  getMovementById,
  createMovement,
  updateMovement,
  deleteMovement,
  getFinancialSummary,
  getAllMovementTrimestres,
} from "../db/queries";
import type { MovementRow } from "../db/queries";

export async function handleMovementRoutes(req: Request, url: URL): Promise<Response | null> {
  // List all movement trimestres
  if (url.pathname === "/api/movements/trimestres" && req.method === "GET") {
    const trimestres = getAllMovementTrimestres();
    return Response.json({ trimestres });
  }

  // Financial summary (consolidated report)
  if (url.pathname === "/api/reports/summary" && req.method === "GET") {
    const trimestre = url.searchParams.get("trimestre") ?? undefined;
    const summary = getFinancialSummary(trimestre);
    return Response.json(summary);
  }

  // List movements
  if (url.pathname === "/api/movements" && req.method === "GET") {
    const type = url.searchParams.get("type") as MovementRow["type"] | null;
    const trimestre = url.searchParams.get("trimestre") ?? undefined;
    const movements = getMovementsByType(type ?? undefined, trimestre);
    return Response.json({ movements });
  }

  // Get single movement
  const getMatch = url.pathname.match(/^\/api\/movements\/(\d+)$/);
  if (getMatch && req.method === "GET") {
    const id = Number(getMatch[1]);
    const movement = getMovementById(id);
    if (!movement) {
      return Response.json({ error: "Movement not found" }, { status: 404 });
    }
    return Response.json({ movement });
  }

  // Create movement
  if (url.pathname === "/api/movements" && req.method === "POST") {
    const body = await req.json();
    const parsed = financialMovementsInsertSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }
    const movement = createMovement(parsed.data);
    return Response.json({ movement }, { status: 201 });
  }

  // Update movement
  const updateMatch = url.pathname.match(/^\/api\/movements\/(\d+)$/);
  if (updateMatch && req.method === "PATCH") {
    const id = Number(updateMatch[1]);
    const body = await req.json();
    const movement = updateMovement(id, body);
    if (!movement) {
      return Response.json({ error: "Movement not found" }, { status: 404 });
    }
    return Response.json({ movement });
  }

  // Delete movement
  const deleteMatch = url.pathname.match(/^\/api\/movements\/(\d+)$/);
  if (deleteMatch && req.method === "DELETE") {
    const id = Number(deleteMatch[1]);
    const deleted = deleteMovement(id);
    if (!deleted) {
      return Response.json({ error: "Movement not found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  }

  return null;
}
