import pdfParse from "pdf-parse";

export interface PdfResult {
  text: string;
  status: "ok" | "warning";
  message?: string;
}

export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<PdfResult> {
  const result = await pdfParse(pdfBuffer);
  const text = result.text.trim();

  if (text.length < 50) {
    return {
      text,
      status: "warning",
      message: "PDF parece ser una imagen. Introduce los datos manualmente.",
    };
  }

  return { text, status: "ok" };
}
