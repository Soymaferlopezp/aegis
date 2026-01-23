import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const runtime = "nodejs";

const VAULT_ABI = [
  "function maxPerTx() view returns (uint256)",
  "function dailyLimit() view returns (uint256)",
  "function spentInCurrentDay() view returns (uint256)",
];

type SimulateLike = { amount?: string; to?: string; currency?: string; reason?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      intent?: string;
      simulate?: SimulateLike;
    };

    const amountStr = body?.simulate?.amount;

    // ✅ Contract: validate is based on simulate.amount (deterministic, on-chain read)
    if (!amountStr || typeof amountStr !== "string") {
      // Si vino intent pero no simulate, explicamos el contrato sin romper UX.
      if (body?.intent) {
        return NextResponse.json(
          { error: "Missing simulate.amount", details: "Validate expects { simulate } from /api/simulate." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Missing simulate.amount" }, { status: 400 });
    }

    const rpc = process.env.ARC_TESTNET_RPC_PRIMARY;
    if (!rpc) {
      return NextResponse.json({ error: "Missing ARC_TESTNET_RPC_PRIMARY" }, { status: 500 });
    }

    const vaultAddress = process.env.NEXT_PUBLIC_VAULT_ADDRESS;
    if (!vaultAddress) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_VAULT_ADDRESS" }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(rpc);
    const vault = new ethers.Contract(vaultAddress, VAULT_ABI, provider);

    const [maxPerTx, dailyLimit, spentToday] = await Promise.all([
      vault.maxPerTx(),
      vault.dailyLimit(),
      vault.spentInCurrentDay(),
    ]);

    const amount = BigInt(amountStr);
    const max = BigInt(maxPerTx.toString());
    const daily = BigInt(dailyLimit.toString());
    const spent = BigInt(spentToday.toString());

    let status: "APPROVED_READY" | "BLOCKED" = "APPROVED_READY";
    let reason = "Within configured vault limits.";

    if (amount > max) {
      status = "BLOCKED";
      reason = "Amount exceeds maxPerTx.";
    } else if (spent + amount > daily) {
      status = "BLOCKED";
      reason = "Daily spending limit would be exceeded.";
    }

    return NextResponse.json({
      status,
      reason,
      vault: {
        maxPerTx: max.toString(),
        dailyLimit: daily.toString(),
        spentToday: spent.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unhandled error", details: String(err?.stack || err) },
      { status: 500 }
    );
  }
}
