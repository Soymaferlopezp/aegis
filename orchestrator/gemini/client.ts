import { GoogleGenAI } from "@google/genai";
import { SimulateDecisionSchema, type SimulateDecision } from "./schema";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/**
 * Extrae texto de forma defensiva desde distintas formas
 * en que Gemini puede devolver contenido.
 */
function extractText(response: any): string {
  // Caso 1: SDK expone response.text (ideal)
  if (typeof response?.text === "string" && response.text.trim()) {
    return response.text.trim();
  }

  // Caso 2: candidates[0].content.parts[].text
  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const joined = parts
      .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
      .join("")
      .trim();
    if (joined) return joined;
  }

  return "";
}

export async function geminiSimulate(prompt: string): Promise<SimulateDecision> {
  const apiKey = mustEnv("GEMINI_API_KEY");
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json", // pedimos SOLO JSON
    },
  });

  const raw = extractText(response);

  if (!raw) {
    // Log SOLO a stderr (no rompe stdout)
    console.error(
      `[${new Date().toISOString()}] ERROR gemini.empty_response`,
      JSON.stringify({
        hasText: Boolean(response?.text),
        hasCandidates: Boolean(response?.candidates?.length),
        responseKeys: Object.keys(response ?? {}).slice(0, 20),
      })
    );
    throw new Error("Gemini returned empty or unreadable response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(
      `[${new Date().toISOString()}] ERROR gemini.non_json`,
      raw.slice(0, 500)
    );
    throw new Error(`Gemini returned non-JSON`);
  }

  // 🔒 Validación estricta del schema (fuente de verdad)
  return SimulateDecisionSchema.parse(parsed);
}
