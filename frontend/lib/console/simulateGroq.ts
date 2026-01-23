type SimulateOutput = {
  to: string;
  amount: string;   // minor units, string
  currency: "USDC";
  reason: string;
};

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function numEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffMs(base: number, attempt: number) {
  const jitter = Math.floor(Math.random() * Math.min(250, base));
  return base * Math.pow(2, attempt - 1) + jitter;
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

export async function simulateWithGroq(intent: string): Promise<SimulateOutput> {
  const apiKey = mustEnv("GROQ_API_KEY");
  const model = mustEnv("GROQ_MODEL");
  const baseUrl = (process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1").replace(/\/$/, "");

  const maxRetries = numEnv("LLM_RETRY_MAX", 4);
  const baseDelay = numEnv("LLM_RETRY_BASE_MS", 600);

  const endpoint = `${baseUrl}/chat/completions`;

  // Strict JSON only. No inventos.
  const system = [
    "You are AEGIS Orchestrator (SIMULATE).",
    "Return ONLY a strict JSON object. No markdown. No extra text.",
    'JSON schema: { "to": "0x...", "amount": "1000000", "currency": "USDC", "reason": "..." }',
    "Rules:",
    "- currency must be USDC",
    '- amount must be a string in minor units (6 decimals). Example: 1 USDC => "1000000"',
    "- to must be a 0x address (merchant) if user implies a recipient; otherwise use DESTINATION_ADDRESS env if present; otherwise use the receiver wallet address env if present.",
    "- reason must be a short explanation of what the user is paying for",
  ].join("\n");

  // Allow deterministic default merchant (your project uses DESTINATION_ADDRESS)
  const destination =
    process.env.DESTINATION_ADDRESS ||
    process.env.CIRCLE_WALLET_ADDRESS_RECEIVER ||
    process.env.NEXT_PUBLIC_USDC_ADDRESS || // last resort (not ideal, but keeps JSON valid)
    "0x0000000000000000000000000000000000000000";

  const user = [
    `Intent: ${intent.trim()}`,
    `Default merchant if none is specified: ${destination}`,
    "Return JSON only.",
  ].join("\n");

  let lastErr: any = null;

  for (let attempt = 1; attempt <= Math.max(1, maxRetries); attempt++) {
    try {
      const body = {
        model,
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      };

      const r = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const raw = await r.json().catch(() => ({}));

      if (!r.ok) {
        const retryable = r.status === 429 || (r.status >= 500 && r.status <= 599);
        if (!retryable || attempt === maxRetries) {
          throw new Error(`Groq failed (${r.status}): ${JSON.stringify(raw)}`);
        }
        await sleep(backoffMs(baseDelay, attempt));
        continue;
      }

      const text: unknown = raw?.choices?.[0]?.message?.content;
      if (typeof text !== "string" || !text.trim()) {
        throw new Error(`Groq response missing content: ${JSON.stringify(raw)}`);
      }

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        const extracted = extractJsonObject(text);
        if (!extracted) throw new Error(`Groq non-JSON: ${text.slice(0, 800)}`);
        parsed = JSON.parse(extracted);
      }

      // minimal shape guard
      if (
        !parsed ||
        typeof parsed.to !== "string" ||
        typeof parsed.amount !== "string" ||
        typeof parsed.currency !== "string" ||
        typeof parsed.reason !== "string"
      ) {
        throw new Error(`Invalid simulate shape: ${JSON.stringify(parsed)}`);
      }

      return {
        to: parsed.to,
        amount: parsed.amount,
        currency: "USDC",
        reason: parsed.reason,
      };
    } catch (e: any) {
      lastErr = e;
      if (attempt === maxRetries) break;
      await sleep(backoffMs(baseDelay, attempt));
    }
  }

  throw new Error(`simulateWithGroq failed after retries: ${String(lastErr?.message || lastErr)}`);
}
