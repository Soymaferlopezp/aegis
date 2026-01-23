import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const runtime = "nodejs";

const VAULT_ABI = [
  "function maxPerTx() view returns (uint256)",
  "function dailyLimit() view returns (uint256)",
  "function spentInCurrentDay() view returns (uint256)",
];

export async function POST(req: Request) {
  try {
    const { simulate } = (await req.json()) as {
      simulate?: { amount?: string };
    };

    const amountStr = simulate?.amount;
    if (!amountStr || typeof amountStr !== "string") {
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
      vault.spentInCurrentDay(), // alias in UI as spentToday
    ]);

    const amount = BigInt(amountStr);
    const max = BigInt(maxPerTx.toString());
    const daily = BigInt(dailyLimit.toString());
    const spent = BigInt(spentToday.toString());

    // Deterministic gate: EXACTLY the type of check the orchestrator would do.
    // UI never approves; server returns observed + computed gate result.
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
        spentToday: spent.toString(), // UI label
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unhandled error", details: String(err?.stack || err) },
      { status: 500 }
    );
  }
}
