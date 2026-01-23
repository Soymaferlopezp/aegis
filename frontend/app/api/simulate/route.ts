import { NextResponse } from "next/server";
import { simulateWithGroq } from "@/lib/console/simulateGroq";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { intent } = (await req.json()) as { intent?: string };

    if (!intent || typeof intent !== "string" || !intent.trim()) {
      return NextResponse.json({ error: "Missing intent" }, { status: 400 });
    }

    const out = await simulateWithGroq(intent);
    return NextResponse.json(out);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Simulate failed", details: String(err?.stack || err) },
      { status: 502 }
    );
  }
}
