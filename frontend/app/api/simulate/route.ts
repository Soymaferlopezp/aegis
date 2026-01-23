import { NextResponse } from "next/server";

export const runtime = "nodejs";

type SimulateOutput = {
  to: string;
  amount: string;
  currency: string;
  reason: string;
};

export async function POST(req: Request) {
  try {
    const { intent } = (await req.json()) as { intent?: string };
    if (!intent || typeof intent !== "string" || !intent.trim()) {
      return NextResponse.json({ error: "Missing intent" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    // Use Gemini REST (API-key query param). Output MUST be strict JSON only.
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const system = [
      "You are AEGIS Orchestrator (SIMULATE).",
      "Return ONLY a strict JSON object, no markdown, no extra text.",
      "JSON schema:",
      `{ "to": "0x...", "amount": "1000000", "currency": "USDC", "reason": "..." }`,
      "Rules:",
      "- currency must be USDC",
      "- amount must be a string in base units (6 decimals). Example: 1 USDC => \"1000000\"",
      "- to must be a 0x address if user specifies a target; otherwise use the USDC contract address on Arc Testnet: 0x3600000000000000000000000000000000000000",
      "- reason must be a short explanation of what the user is paying for",
    ].join("\n");

    const body = {
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: intent }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 220,
        responseMimeType: "application/json",
      },
    };

    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = await r.json();

    if (!r.ok) {
      return NextResponse.json(
        { error: "Gemini request failed", details: raw },
        { status: 502 }
      );
    }

    const text =
      raw?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Gemini response missing JSON text", details: raw },
        { status: 502 }
      );
    }

    let parsed: SimulateOutput;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return NextResponse.json(
        { error: "Gemini did not return valid JSON", rawText: text },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unhandled error", details: String(err?.stack || err) },
      { status: 500 }
    );
  }
}
