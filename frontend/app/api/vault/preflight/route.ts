import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const runtime = "nodejs"; // importante para ethers en Vercel/Node runtime
export const dynamic = "force-dynamic"; // evita caché (queremos state real)

const VAULT_ABI = [
  "function maxPerTx() view returns (uint256)",
  "function dailyLimit() view returns (uint256)",
  "function spentInCurrentDay() view returns (uint256)",
];

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function GET() {
  try {
    // Server-only envs (NO van al browser)
    const rpcUrl = mustEnv("ARC_TESTNET_RPC_PRIMARY");

    // Prefer server VAULT_ADDRESS; fallback to NEXT_PUBLIC_VAULT_ADDRESS if lo tienes ya
    const vaultAddress =
      process.env.VAULT_ADDRESS ||
      process.env.NEXT_PUBLIC_VAULT_ADDRESS ||
      "0x3fFd55E53D7740a93b8B62e93ed11a2c0651098E";

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const vault = new ethers.Contract(vaultAddress, VAULT_ABI, provider);

    // Read-only getters
    const [maxPerTx, dailyLimit, spent] = await Promise.all([
      vault.maxPerTx(),
      vault.dailyLimit(),
      vault.spentInCurrentDay(),
    ]);

    // Raw strings (minor units)
    const payload = {
      vault: {
        maxPerTx: maxPerTx.toString(),
        dailyLimit: dailyLimit.toString(),
        spentToday: spent.toString(), // alias UI: spentToday
      },
      network: "ARC-TESTNET",
      vaultAddress,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (e: any) {
    // No maquillamos errores
    const msg = e?.message ? String(e.message) : String(e);
    return NextResponse.json(
      {
        error: "Vault preflight failed",
        details: msg,
      },
      { status: 500 }
    );
  }
}
