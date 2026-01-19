export function buildSimulatePrompt(params: {
  intent: string;
  merchant: string;
}) {
  const { intent, merchant } = params;

  return `
Devuelve SOLO JSON válido, sin texto adicional.

Tu tarea: extraer un monto de USDC desde la intención del usuario y devolverlo en "minor units" con 6 decimales.
- "amount" debe ser string entero en minor units (USDC 6 decimales).
- Si el usuario dice "2.5 USDC", conviértelo a "2500000".
- Si dice "2 USDC", conviértelo a "2000000".
- Si no hay monto claro, devuelve amount="0" y reason="Ambiguous amount".

El campo "to" debe ser EXACTAMENTE este merchant fijo:
${merchant}

El JSON debe tener EXACTAMENTE estas claves:
{
  "to": "<merchant>",
  "amount": "<string entero minor units>",
  "currency": "USDC",
  "reason": "<texto corto>"
}

Intención:
"${intent}"
`.trim();
}
