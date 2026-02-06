import { invoicesInsertSchema } from "server/db/zod-schemas";
import {
  getInvoicesByType,
  getInvoicesByTrimestre,
  getInvoiceById,
  updateInvoiceExtractedData,
  updateInvoiceStatus,
  getAllTrimestres,
  getTrimestreStats,
  findOrCreateVendor,
  setInvoiceVendor,
  clearInvoiceVendor,
  clearInvoiceVendorAndField,
  deleteInvoicesBySubfolder,
  deleteInvoiceById,
  setInvoiceProject,
  clearInvoiceProject,
} from "../db/queries";
import type { InvoiceWithVendor } from "../db/queries";
import { extractInvoiceData, type InvoiceData, type GastosData, type IngresosData } from "../services/llm";
import { buildPrompt } from "../services/prompts";

async function processInvoice(invoice: InvoiceWithVendor): Promise<InvoiceData> {
  const prompt = buildPrompt(invoice.folder_type);
  const result = await extractInvoiceData(prompt, invoice.raw_text!, invoice.folder_type);


  // manual modifications of the output
  if (invoice.folder_type === "gastos" && invoice.raw_text?.includes("AVDA, JOSÉ MARTÍNEZ GONZALEZ")) {
    (result as GastosData).proveedor = "SEGURA MIQUEL ASESORES S.L.";
    (result as GastosData).categoria = "Asesoría y Servicios Externos";
  }
  if (invoice.folder_type === "gastos" && invoice.raw_text?.includes("PEPEMOBILE")) {
    (result as GastosData).proveedor = "PEPEMOBILE S.L.";
    (result as GastosData).categoria = "Gastos de Oficina/Actividad y Suministros";
  }
  if (invoice.folder_type === "gastos" && invoice.raw_text?.includes("Google Workspace")) {
    (result as GastosData).categoria = "Software y Herramientas Online";
  }

  // Identify and assign vendor
  const vendorName = invoice.folder_type === "gastos"
    ? (result as GastosData).proveedor
    : (result as IngresosData).cliente;
  const vendorType = invoice.folder_type === "gastos" ? "provider" : "client";
  if (vendorName) {
    const vendor = findOrCreateVendor(vendorName, vendorType);
    setInvoiceVendor(invoice.id, vendor.id);
  }

  updateInvoiceExtractedData(invoice.id, JSON.stringify(result), "processed");
  return result;
}

export async function handleInvoiceRoutes(req: Request, url: URL): Promise<Response | null> {
  // List all trimestres with stats
  if (url.pathname === "/api/invoices/trimestres" && req.method === "GET") {
    const trimestres = getAllTrimestres();
    const stats = trimestres.map((t) => ({
      trimestre: t,
      stats: getTrimestreStats(t),
    }));
    return Response.json({ trimestres: stats });
  }

  // Get invoices — requires type, trimestre optional
  if (url.pathname === "/api/invoices" && req.method === "GET") {
    const trimestre = url.searchParams.get("trimestre") ?? undefined;
    const folderTypeParam = url.searchParams.get("type");
    if (!folderTypeParam) {
      return Response.json({ error: "Missing type" }, { status: 400 });
    }
    const folderType = invoicesInsertSchema.shape.folder_type.parse(folderTypeParam);
    const invoices = getInvoicesByType(folderType, trimestre);
    return Response.json({ invoices });
  }

  // Delete single invoice
  const deleteMatch = url.pathname.match(/^\/api\/invoices\/(\d+)$/);
  if (deleteMatch && req.method === "DELETE") {
    const id = Number(deleteMatch[1]);
    const result = deleteInvoiceById(id);
    if (!result.deleted) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }
    return Response.json({ success: true, ...result });
  }

  // Get single invoice
  if (url.pathname.startsWith("/api/invoices/") && req.method === "GET") {
    const id = parseInt(url.pathname.split("/").pop()!, 10);
    if (isNaN(id)) return null;
    const invoice = getInvoiceById(id);
    if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ invoice });
  }

  // Assign vendor to invoice
  if (url.pathname.match(/^\/api\/invoices\/\d+\/vendor$/) && req.method === "PATCH") {
    const id = parseInt(url.pathname.split("/")[3], 10);
    if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
    const body = await req.json();
    const { vendor_id, vendor_field } = body as { vendor_id: string | null; vendor_field?: string };
    if (vendor_id) {
      setInvoiceVendor(id, vendor_id);
    } else if (vendor_field) {
      clearInvoiceVendorAndField(id, vendor_field);
    } else {
      clearInvoiceVendor(id);
    }
    return Response.json({ ok: true });
  }

  // Assign project to invoice
  if (url.pathname.match(/^\/api\/invoices\/\d+\/project$/) && req.method === "PATCH") {
    const id = parseInt(url.pathname.split("/")[3], 10);
    if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
    const body = await req.json();
    const { project_id } = body as { project_id: string | null };
    if (project_id) {
      setInvoiceProject(id, project_id);
    } else {
      clearInvoiceProject(id);
    }
    return Response.json({ ok: true });
  }

  // Update invoice extracted data (manual edit)
  if (url.pathname.startsWith("/api/invoices/") && req.method === "PATCH") {
    const id = parseInt(url.pathname.split("/").pop()!, 10);
    if (isNaN(id)) return null;
    const body = await req.json();
    const { extracted_data } = body as { extracted_data: string };
    updateInvoiceExtractedData(id, extracted_data, "processed");
    return Response.json({ ok: true });
  }

  // Process single invoice with LLM
  if (url.pathname === "/api/invoices/process" && req.method === "POST") {
    const body = await req.json();
    const { invoiceId } = body as { invoiceId: number };
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) return Response.json({ error: "Invoice not found" }, { status: 404 });
    if (!invoice.raw_text) {
      return Response.json({ error: "No text extracted from PDF" }, { status: 400 });
    }

    try {
      const data = await processInvoice(invoice);
      return Response.json({ ok: true, data });
    } catch (e: any) {
      updateInvoiceStatus(invoiceId, "error", e.message);
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // Delete invoices by subfolder
  if (url.pathname === "/api/invoices/by-subfolder" && req.method === "DELETE") {
    const body = await req.json();
    const { trimestre, subfolder } = body as { trimestre: string; subfolder: string };
    if (!trimestre || !subfolder) {
      return Response.json({ error: "Missing trimestre or subfolder" }, { status: 400 });
    }
    const result = deleteInvoicesBySubfolder(trimestre, subfolder);
    return Response.json(result);
  }

  // Process batch of invoices
  if (url.pathname === "/api/invoices/process-batch" && req.method === "POST") {
    const body = await req.json();
    const { invoiceIds } = body as { invoiceIds: number[] };
    const results: { id: number; status: string; error?: string }[] = [];

    for (const id of invoiceIds) {
      const invoice = getInvoiceById(id);
      if (!invoice || !invoice.raw_text) {
        results.push({ id, status: "error", error: "No text available" });
        continue;
      }

      try {
        await processInvoice(invoice);
        results.push({ id, status: "processed" });
      } catch (e: any) {
        updateInvoiceStatus(id, "error", e.message);
        results.push({ id, status: "error", error: e.message });
      }
    }

    return Response.json({ results });
  }

  return null;
}
