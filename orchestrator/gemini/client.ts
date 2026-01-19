import { GoogleGenAI } from "@google/genai";
import { SimulateDecisionSchema, type SimulateDecision } from "./schema";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function geminiSimulate(prompt: string): Promise<SimulateDecision> {
  const apiKey = mustEnv("GEMINI_API_KEY");
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json", // 👈 clave
    },
  });

  const raw = response.text ?? "";
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Gemini returned non-JSON. raw=${raw.slice(0, 300)}`);
  }

  // 🔒 Validación REAL aquí
  return SimulateDecisionSchema.parse(parsed);
}
