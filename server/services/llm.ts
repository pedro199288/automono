import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getSetting } from "../db/queries";

function getProvider() {
  const baseURL = getSetting("lm_studio_url") || "http://localhost:1234/v1";
  return createOpenAICompatible({
    name: "lm-studio",
    baseURL,
    apiKey: "lm-studio",
    supportsStructuredOutputs: true,
  });
}

const categoriaGastos = [
  "Hardware",
  "Software y Herramientas Online",
  "Formación y Desarrollo Profesional",
  "Marketing y Publicidad",
  "Gastos de Oficina/Actividad y Suministros",
  "Asesoría y Servicios Externos",
  "Otros",
] as const;

export const gastosSchema = z.object({
  fecha: z.string().nullable().describe("Fecha en formato DD/MM/YYYY"),
  numero_factura: z.string().nullable(),
  proveedor: z.string().nullable().describe("Nombre o razón social"),
  concepto: z.string().nullable().describe("Descripción del servicio/producto"),
  base_imponible: z.number().nullable(),
  tipo_iva: z.number().nullable(),
  iva: z.number().nullable(),
  total: z.number().nullable(),
  categoria: z.enum(categoriaGastos).nullable(),
  currency: z.string().nullable().describe("Código ISO 4217 de la moneda (ej: EUR, USD, GBP)"),
});

export const ingresosSchema = z.object({
  fecha_factura: z.string().nullable().describe("Fecha en formato DD/MM/YYYY"),
  numero_factura: z.string().nullable(),
  cliente: z.string().nullable().describe("Nombre o razón social del cliente"),
  proyecto: z.string().nullable().describe("Nombre del proyecto si se puede inferir"),
  descripcion: z.string().nullable().describe("Descripción del servicio"),
  base_imponible: z.number().nullable(),
  tipo_iva: z.number().nullable(),
  iva: z.number().nullable(),
  total_factura: z.number().nullable(),
  irpf: z.number().nullable(),
  currency: z.string().nullable().describe("Código ISO 4217 de la moneda (ej: EUR, USD, GBP)"),
});

export type GastosData = z.infer<typeof gastosSchema>;
export type IngresosData = z.infer<typeof ingresosSchema>;
export type InvoiceData = GastosData | IngresosData;

async function generate<T>(schema: z.ZodType<T>, systemPrompt: string, pdfText: string): Promise<T> {
  const provider = getProvider();
  const { output } = await generateText({
    model: provider(getSetting("lm_model_id") || "qwen/qwen2.5-vl-7b"),
    system: systemPrompt,
    prompt: pdfText,
    temperature: 0.1,
    maxOutputTokens: 2000,
    output: Output.object({ schema }),
  });

  if (!output) {
    throw new Error("No response from LLM");
  }

  return output;
}

export async function extractInvoiceData(
  prompt: string,
  pdfText: string,
  folderType: string,
): Promise<InvoiceData> {
  if (folderType === "ingresos") {
    return generate(ingresosSchema, prompt, pdfText);
  }
  return generate(gastosSchema, prompt, pdfText);
}
