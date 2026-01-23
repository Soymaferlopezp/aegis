// orchestrator/llm/client.ts
import { SimulateDecisionSchema, type SimulateDecision } from "../gemini/schema";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Remueve ```json ... ``` y ``` ... ``` si el modelo devuelve markdown.
 */
function stripCodeFences(s: string): string {
  const t = s.trim();
  if (t.startsWith("```")) {
    const firstNewline = t.indexOf("\n");
    if (firstNewline !== -1) {
      const withoutFirst = t.slice(firstNewline + 1);
      const lastFence = withoutFirst.lastIndexOf("```");
      if (lastFence !== -1) return withoutFirst.slice(0, lastFence).trim();
      return withoutFirst.trim();
    }
  }
  return t;
}

function isTransientGroq(status?: number, msg?: string) {
  if (!status) return false;
  if ([429, 500, 502, 503, 504].includes(status)) return true;
  const m = (msg ?? "").toLowerCase();
  if (m.includes("rate limit")) return true;
  if (m.includes("overloaded")) return true;
  if (m.includes("temporarily")) return true;
  return false;
}

function groqBaseUrl(): string {
  return (process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1").replace(/\/+$/, "");
}

function groqModel(): string {
  // Default oficial y estable
  return (process.env.GROQ_MODEL ?? "llama-3.1-8b-instant").trim();
}

/**
 * Llama a Groq usando endpoint OpenAI-compatible:
 * POST https://api.groq.com/openai/v1/chat/completions
 */
async function groqChat(prompt: string): Promise<string> {
  const apiKey = mustEnv("GROQ_API_KEY");
  const url = `${groqBaseUrl()}/chat/completions`;
  const model = groqModel();

  // Mantener reglas dentro del user para máxima compatibilidad y “JSON-only”
  const userContent = [
    "Return ONLY valid JSON.",
    "No Markdown. No code fences. No commentary.",
    "Must match the expected schema keys exactly.",
    "",
    prompt,
  ].join("\n");

  const body = {
    model,
    messages: [{ role: "user", content: userContent }],
    temperature: 0,
    // Importantísimo: tu JSON es corto → limita costo + variación
    max_tokens: Number(process.env.LLM_MAX_TOKENS ?? "180"),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    const err = new Error(text || `HTTP ${res.status}`);
    (err as any).status = res.status;

    // Intenta sacar mensaje útil si viene JSON
    try {
      const payload = JSON.parse(text);
      const msg =
        payload?.error?.message ??
        payload?.message ??
        payload?.error ??
        text;
      (err as any).message = typeof msg === "string" ? msg : JSON.stringify(msg);
    } catch {
      // keep raw
    }

    throw err;
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Groq returned non-JSON response body: ${text.slice(0, 400)}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Groq returned empty content");
  }

  return content;
}

export async function llmSimulate(prompt: string): Promise<SimulateDecision> {
  const maxAttempts = Number(process.env.LLM_RETRY_MAX ?? "4");
  const baseDelayMs = Number(process.env.LLM_RETRY_BASE_MS ?? "600");

  let lastErr: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const raw = await groqChat(prompt);
      const cleaned = stripCodeFences(raw);

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error(`LLM returned non-JSON: ${cleaned.slice(0, 300)}`);
      }

      // 🔒 Validación REAL aquí (schema es la fuente de verdad)
      return SimulateDecisionSchema.parse(parsed);
    } catch (err: any) {
      lastErr = err;

      const status = err?.status as number | undefined;
      const msg = (err?.message ?? "") as string;

      if (!isTransientGroq(status, msg)) throw err;
      if (attempt === maxAttempts) break;

      const jitter = Math.floor(Math.random() * 250);
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
      await sleep(delay);
    }
  }

  const status = lastErr?.status ? ` (status ${lastErr.status})` : "";
  throw new Error(`Groq LLM failed${status}. Last error: ${lastErr?.message ?? lastErr}`);
}
