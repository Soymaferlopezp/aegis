import { GoogleGenAI } from "@google/genai";
import { SimulateDecisionSchema, type SimulateDecision } from "./schema";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Extrae texto de forma defensiva desde distintas formas
 * en que Gemini puede devolver contenido.
 */
function extractText(response: any): string {
  if (typeof response?.text === "string" && response.text.trim()) {
    return response.text.trim();
  }

  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const joined = parts
      .map((p: any) => {
        if (typeof p?.text === "string") return p.text;
        // Algunos SDKs pueden traer inlineData o similares; ignoramos.
        return "";
      })
      .join("")
      .trim();
    if (joined) return joined;
  }

  // Fallback adicional: a veces viene como string en content directamente
  const content = response?.candidates?.[0]?.content;
  if (typeof content === "string" && content.trim()) return content.trim();

  return "";
}

function isTransientGeminiError(err: any): boolean {
  const status = err?.status ?? err?.response?.status;
  const code = err?.error?.code ?? err?.response?.data?.error?.code;
  const msg =
    (err?.error?.message ??
      err?.response?.data?.error?.message ??
      err?.message ??
      "") as string;

  // 429 rate limit / 503 overload / UNAVAILABLE
  if (status === 429 || status === 503) return true;
  if (code === 429 || code === 503) return true;
  if (msg.toLowerCase().includes("overloaded")) return true;
  if (msg.toLowerCase().includes("unavailable")) return true;

  return false;
}

export async function geminiSimulate(prompt: string): Promise<SimulateDecision> {
  const apiKey = mustEnv("GEMINI_API_KEY");
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const ai = new GoogleGenAI({ apiKey });

  const maxAttempts = Number(process.env.GEMINI_RETRY_MAX ?? "5"); // default 5
  const baseDelayMs = Number(process.env.GEMINI_RETRY_BASE_MS ?? "800"); // default 800ms

  let lastErr: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const raw = extractText(response);

      if (!raw) {
        console.error(
          `[${new Date().toISOString()}] ERROR gemini.empty_response`,
          JSON.stringify({
            attempt,
            hasText: Boolean(response?.text),
            hasCandidates: Boolean(response?.candidates?.length),
            responseKeys: Object.keys(response ?? {}).slice(0, 20),
          })
        );

        // Trátalo como transitorio y reintenta
        throw Object.assign(new Error("Gemini returned empty or unreadable response"), {
          transient: true,
        });
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        console.error(
          `[${new Date().toISOString()}] ERROR gemini.non_json`,
          raw.slice(0, 500)
        );
        // Esto NO lo tratamos como transitorio por defecto:
        // si el modelo no devuelve JSON, es fallo de prompt/modelo.
        throw new Error("Gemini returned non-JSON");
      }

      return SimulateDecisionSchema.parse(parsed);
    } catch (err: any) {
      lastErr = err;

      const transient =
        err?.transient === true || isTransientGeminiError(err) || false;

      if (!transient) {
        // Error “real”, no reintentar
        throw err;
      }

      if (attempt === maxAttempts) break;

      // backoff exponencial suave con jitter
      const jitter = Math.floor(Math.random() * 250);
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + jitter;

      console.error(
        `[${new Date().toISOString()}] STEP gemini.retry`,
        JSON.stringify({ attempt, maxAttempts, delayMs: delay })
      );

      await sleep(delay);
    }
  }

  throw lastErr ?? new Error("Gemini failed after retries");
}
