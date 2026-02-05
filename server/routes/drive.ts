import { listFolder, downloadFile } from "../services/drive";
import { extractTextFromPdf } from "../services/pdf";
import {
  getSetting,
  upsertInvoice,
  getInvoicesByTrimestre,
  getTrimestreInvoiceCount,
  isFolderExcluded,
  getExcludedFolders,
  getExcludedFolderIds,
  excludeFolder,
  removeExclusion,
} from "../db/queries";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const PDF_MIME = "application/pdf";

// Helper: sync all PDFs in a folder (and its subfolders) into the DB
async function syncFolderContents(
  folderId: string,
  trimestre: string,
  folderType: "gastos" | "ingresos",
  subfolder?: string
): Promise<{ fileName: string; status: string; message?: string }[]> {
  const files = await listFolder(folderId);
  const pdfs = files.filter((f) => f.mimeType === PDF_MIME);
  const results: { fileName: string; status: string; message?: string }[] = [];

  for (const pdf of pdfs) {
    try {
      const buffer = await downloadFile(pdf.id);
      const pdfResult = await extractTextFromPdf(buffer);
      const drivePath = `${trimestre}/${folderType}${subfolder ? "/" + subfolder : ""}`;

      upsertInvoice({
        drive_file_id: pdf.id,
        file_name: pdf.name,
        drive_path: drivePath,
        folder_type: folderType,
        trimestre,
        subfolder: subfolder ?? null,
        raw_text: pdfResult.text,
        status: pdfResult.status === "warning" ? "warning" : "pending",
        warning_message: pdfResult.message ?? null,
      });

      results.push({
        fileName: subfolder ? `${subfolder}/${pdf.name}` : pdf.name,
        status: pdfResult.status === "warning" ? "warning" : "synced",
        message: pdfResult.message,
      });
    } catch (e: any) {
      results.push({
        fileName: subfolder ? `${subfolder}/${pdf.name}` : pdf.name,
        status: "error",
        message: e.message,
      });
    }
  }

  // Process subfolders (vendor folders)
  const subfolders = files.filter((f) => f.mimeType === FOLDER_MIME);
  for (const sub of subfolders) {
    if (isFolderExcluded(sub.id)) continue;
    const subResults = await syncFolderContents(sub.id, trimestre, folderType, sub.name);
    results.push(...subResults);
  }

  return results;
}

// Helper: count PDFs recursively in a Drive folder without downloading
async function countDrivePdfs(folderId: string): Promise<number> {
  const files = await listFolder(folderId);
  let count = files.filter((f) => f.mimeType === PDF_MIME).length;
  const subfolders = files.filter((f) => f.mimeType === FOLDER_MIME);
  for (const sub of subfolders) {
    if (isFolderExcluded(sub.id)) continue;
    count += await countDrivePdfs(sub.id);
  }
  return count;
}

export async function handleDriveRoutes(req: Request, url: URL): Promise<Response | null> {
  // List root folders (trimestres)
  if (url.pathname === "/api/drive/folders" && req.method === "GET") {
    const rootId = getSetting("drive_root_folder_id");
    if (!rootId) {
      return Response.json({ error: "Drive root folder not configured" }, { status: 400 });
    }
    try {
      const folders = await listFolder(rootId);
      const trimestres = folders.filter((f) => f.mimeType === FOLDER_MIME);
      return Response.json({ folders: trimestres });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // List contents of a specific folder
  if (url.pathname === "/api/drive/folder" && req.method === "GET") {
    const folderId = url.searchParams.get("id");
    if (!folderId) {
      return Response.json({ error: "Missing folder id" }, { status: 400 });
    }
    try {
      const files = await listFolder(folderId);
      return Response.json({ files });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // Sync a folder: download PDFs, extract text, save to DB
  if (url.pathname === "/api/drive/sync" && req.method === "POST") {
    try {
      const body = await req.json();
      const { folderId, trimestre, folderType, subfolder } = body as {
        folderId: string;
        trimestre: string;
        folderType: "gastos" | "ingresos";
        subfolder?: string;
      };

      const files = await listFolder(folderId);
      const pdfs = files.filter((f) => f.mimeType === PDF_MIME);
      const results: { fileName: string; status: string; message?: string }[] = [];

      for (const pdf of pdfs) {
        try {
          const buffer = await downloadFile(pdf.id);
          const pdfResult = await extractTextFromPdf(buffer);
          const drivePath = `${trimestre}/${folderType}${subfolder ? "/" + subfolder : ""}`;

          upsertInvoice({
            drive_file_id: pdf.id,
            file_name: pdf.name,
            drive_path: drivePath,
            folder_type: folderType,
            trimestre,
            subfolder: subfolder ?? null,
            raw_text: pdfResult.text,
            status: pdfResult.status === "warning" ? "warning" : "pending",
            warning_message: pdfResult.message ?? null,
          });

          results.push({
            fileName: pdf.name,
            status: pdfResult.status === "warning" ? "warning" : "synced",
            message: pdfResult.message,
          });
        } catch (e: any) {
          results.push({ fileName: pdf.name, status: "error", message: e.message });
        }
      }

      // Also check for subfolders (type folders or vendor folders)
      const subfolders = files.filter((f) => f.mimeType === FOLDER_MIME);
      for (const sub of subfolders) {
        if (isFolderExcluded(sub.id)) continue;
        const subNameLower = sub.name.toLowerCase();
        const isTypeFolderGastos = subNameLower.includes("gasto");
        const isTypeFolderIngresos = subNameLower.includes("ingreso");

        if (isTypeFolderGastos || isTypeFolderIngresos) {
          const detectedType = isTypeFolderGastos ? "gastos" : "ingresos";
          const typeFolderFiles = await listFolder(sub.id);

          const typePdfs = typeFolderFiles.filter((f) => f.mimeType === PDF_MIME);
          for (const pdf of typePdfs) {
            try {
              const buffer = await downloadFile(pdf.id);
              const pdfResult = await extractTextFromPdf(buffer);
              const drivePath = `${trimestre}/${detectedType}`;

              upsertInvoice({
                drive_file_id: pdf.id,
                file_name: pdf.name,
                drive_path: drivePath,
                folder_type: detectedType,
                trimestre,
                subfolder: null,
                raw_text: pdfResult.text,
                status: pdfResult.status === "warning" ? "warning" : "pending",
                warning_message: pdfResult.message ?? null,
              });

              results.push({
                fileName: pdf.name,
                status: pdfResult.status === "warning" ? "warning" : "synced",
                message: pdfResult.message,
              });
            } catch (e: any) {
              results.push({ fileName: pdf.name, status: "error", message: e.message });
            }
          }

          const vendorFolders = typeFolderFiles.filter((f) => f.mimeType === FOLDER_MIME);
          for (const vendor of vendorFolders) {
            if (isFolderExcluded(vendor.id)) continue;
            const vendorFiles = await listFolder(vendor.id);
            const vendorPdfs = vendorFiles.filter((f) => f.mimeType === PDF_MIME);

            for (const pdf of vendorPdfs) {
              try {
                const buffer = await downloadFile(pdf.id);
                const pdfResult = await extractTextFromPdf(buffer);
                const drivePath = `${trimestre}/${detectedType}/${vendor.name}`;

                upsertInvoice({
                  drive_file_id: pdf.id,
                  file_name: pdf.name,
                  drive_path: drivePath,
                  folder_type: detectedType,
                  trimestre,
                  subfolder: vendor.name,
                  raw_text: pdfResult.text,
                  status: pdfResult.status === "warning" ? "warning" : "pending",
                  warning_message: pdfResult.message ?? null,
                });

                results.push({
                  fileName: `${vendor.name}/${pdf.name}`,
                  status: pdfResult.status === "warning" ? "warning" : "synced",
                  message: pdfResult.message,
                });
              } catch (e: any) {
                results.push({ fileName: `${vendor.name}/${pdf.name}`, status: "error", message: e.message });
              }
            }
          }
        } else {
          const subFiles = await listFolder(sub.id);
          const subPdfs = subFiles.filter((f) => f.mimeType === PDF_MIME);

          for (const pdf of subPdfs) {
            try {
              const buffer = await downloadFile(pdf.id);
              const pdfResult = await extractTextFromPdf(buffer);
              const drivePath = `${trimestre}/${folderType}/${sub.name}`;

              upsertInvoice({
                drive_file_id: pdf.id,
                file_name: pdf.name,
                drive_path: drivePath,
                folder_type: folderType,
                trimestre,
                subfolder: sub.name,
                raw_text: pdfResult.text,
                status: pdfResult.status === "warning" ? "warning" : "pending",
                warning_message: pdfResult.message ?? null,
              });

              results.push({
                fileName: `${sub.name}/${pdf.name}`,
                status: pdfResult.status === "warning" ? "warning" : "synced",
                message: pdfResult.message,
              });
            } catch (e: any) {
              results.push({ fileName: `${sub.name}/${pdf.name}`, status: "error", message: e.message });
            }
          }
        }
      }

      return Response.json({ results });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // Sync an entire trimestre folder (auto-discovers gastos/ingresos subfolders)
  if (url.pathname === "/api/drive/sync-trimestre" && req.method === "POST") {
    try {
      const body = await req.json();
      const { folderId, trimestre } = body as { folderId: string; trimestre: string };

      if (!folderId || !trimestre) {
        return Response.json({ error: "Missing folderId or trimestre" }, { status: 400 });
      }

      const files = await listFolder(folderId);
      const results: { fileName: string; status: string; message?: string }[] = [];

      // Process PDFs at the root of the trimestre folder
      const rootPdfs = files.filter((f) => f.mimeType === PDF_MIME);
      for (const pdf of rootPdfs) {
        try {
          const buffer = await downloadFile(pdf.id);
          const pdfResult = await extractTextFromPdf(buffer);

          upsertInvoice({
            drive_file_id: pdf.id,
            file_name: pdf.name,
            drive_path: trimestre,
            folder_type: "gastos",
            trimestre,
            subfolder: null,
            raw_text: pdfResult.text,
            status: pdfResult.status === "warning" ? "warning" : "pending",
            warning_message: pdfResult.message ?? null,
          });

          results.push({
            fileName: pdf.name,
            status: pdfResult.status === "warning" ? "warning" : "synced",
            message: pdfResult.message,
          });
        } catch (e: any) {
          results.push({ fileName: pdf.name, status: "error", message: e.message });
        }
      }

      // Process subfolders - auto-detect gastos/ingresos
      const subfolders = files.filter((f) => f.mimeType === FOLDER_MIME);
      for (const sub of subfolders) {
        if (isFolderExcluded(sub.id)) continue;
        const subNameLower = sub.name.toLowerCase();
        const isGastos = subNameLower.includes("gasto");
        const isIngresos = subNameLower.includes("ingreso");

        if (isGastos || isIngresos) {
          const folderType = isGastos ? "gastos" as const : "ingresos" as const;
          const subResults = await syncFolderContents(sub.id, trimestre, folderType);
          results.push(...subResults);
        } else {
          // Unknown subfolder - treat as gastos by default
          const subResults = await syncFolderContents(sub.id, trimestre, "gastos", sub.name);
          results.push(...subResults);
        }
      }

      const synced = results.filter((r) => r.status === "synced" || r.status === "warning").length;
      const errors = results.filter((r) => r.status === "error").length;

      return Response.json({ results, synced, errors });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // Scan a trimestre folder: count PDFs in Drive vs DB (without downloading)
  if (url.pathname === "/api/drive/scan-trimestre" && req.method === "GET") {
    const folderId = url.searchParams.get("folderId");
    const trimestre = url.searchParams.get("trimestre");

    if (!folderId || !trimestre) {
      return Response.json({ error: "Missing folderId or trimestre" }, { status: 400 });
    }

    try {
      const driveFiles = await countDrivePdfs(folderId);
      const dbFiles = getTrimestreInvoiceCount(trimestre);
      return Response.json({ driveFiles, dbFiles, fullySynced: driveFiles <= dbFiles });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // List excluded folders
  if (url.pathname === "/api/drive/excluded" && req.method === "GET") {
    const folders = getExcludedFolders();
    return Response.json({ folders });
  }

  // Exclude a folder
  if (url.pathname === "/api/drive/exclude" && req.method === "POST") {
    const body = await req.json();
    const { driveFolderId, folderName } = body as { driveFolderId: string; folderName: string };
    if (!driveFolderId || !folderName) {
      return Response.json({ error: "Missing driveFolderId or folderName" }, { status: 400 });
    }
    excludeFolder(driveFolderId, folderName);
    return Response.json({ ok: true });
  }

  // Remove folder exclusion
  const excludeMatch = url.pathname.match(/^\/api\/drive\/exclude\/(.+)$/);
  if (excludeMatch && req.method === "DELETE") {
    const id = decodeURIComponent(excludeMatch[1]);
    removeExclusion(id);
    return Response.json({ ok: true });
  }

  // Serve PDF file by drive file ID
  const fileMatch = url.pathname.match(/^\/api\/drive\/file\/(.+)$/);
  if (fileMatch && req.method === "GET") {
    const fileId = fileMatch[1];
    try {
      const buffer = await downloadFile(fileId);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline",
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  return null;
}
