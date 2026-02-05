const PROMPT_GASTOS = `Eres un asistente que extrae datos de facturas de gastos. Analiza el texto
de la factura y devuelve SOLO un JSON con estos campos:

{
  "fecha": "DD/MM/YYYY",
  "numero_factura": "string",
  "proveedor": "nombre o razón social",
  "concepto": "descripción del servicio/producto",
  "base_imponible": number,
  "tipo_iva": number,
  "iva": number,
  "total": number,
  "categoria": "una de: Hardware | Software y Herramientas Online | Formación y Desarrollo Profesional | Marketing y Publicidad | Gastos de Oficina/Actividad y Suministros | Asesoría y Servicios Externos | Otros",
  }
  "currency": "código ISO 4217 (ej: EUR, USD, GBP)"

Para la moneda, determina el código ISO 4217 según el texto de la factura: busca símbolos (€, $, £, ¥), texto explícito (EUR, USD, euros, dólares) el que más aparezca o el que se vea en la base imponible/subtotal y en total/amount due.

Casos partículares:
- En las facturas de AWS, la base imponible se ve en el campo "Net Charges", el IVA en "TOTAL VAT" y el total en "TOTAL AMOUNT".
- Si ves algún porcentaje cerca del IVA o de la base imponible/subtotal, probablemente sea el tipo de IVA.

Si no puedes determinar un campo, usa null.`;

const PROMPT_INGRESOS = `Eres un asistente que extrae datos de facturas emitidas. Analiza el texto
de la factura y devuelve SOLO un JSON con estos campos:

{
  "fecha_factura": "DD/MM/YYYY",
  "numero_factura": "string",
  "cliente": "nombre o razón social del cliente",
  "proyecto": "nombre del proyecto si se puede inferir, o null",
  "descripcion": "descripción del servicio",
  "base_imponible": number,
  "tipo_iva": number,
  "iva": number,
  "total_factura": number,
  "irpf": number o null,
  "currency": "código ISO 4217 (ej: EUR, USD, GBP)"
}

Para la moneda, determina el código ISO 4217 según el texto de la factura: busca símbolos (€, $, £, ¥), texto explícito (EUR, USD, euros, dólares) el que más aparezca o el que se vea en la base imponible/subtotal y en total/amount due.

Si no puedes determinar un campo, usa null.`;

const OWNER_CONTEXT = `

--- Contexto del usuario ---
El usuario de esta aplicación es "Pedro Monteagudo Jiménez". Este nombre NUNCA debe aparecer como proveedor ni como cliente. Si aparece en la factura, es porque es el emisor (en facturas de ingresos) o el receptor (en facturas de gastos).`;

const INVOICE_FORMAT_HINT = `

--- Formato de facturas de ingresos ---
En facturas con nombre de archivo tipo "0001-A.pdf", el texto extraído puede contener el nombre del usuario ("Pedro Monteagudo Jiménez") concatenado con el nombre del cliente. El cliente se obtiene sustrayendo "Pedro Monteagudo Jiménez" del texto. Nunca devuelvas "Pedro Monteagudo Jiménez" como cliente.`;

export function buildPrompt(folderType: string): string {
  const basePrompt = folderType === "ingresos" ? PROMPT_INGRESOS : PROMPT_GASTOS;

  let prompt = basePrompt;

  prompt += OWNER_CONTEXT;

  if (folderType === "ingresos") {
    prompt += INVOICE_FORMAT_HINT;
  }

  return prompt;
}
