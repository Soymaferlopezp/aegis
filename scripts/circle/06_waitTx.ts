import { circleGet, mustEnv } from "./_shared";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function pickStateAndHash(payload: any): { state?: string; txHash?: string; errorReason?: string } {
  // Intentos comunes de shape
  const d = payload?.data ?? payload;

  return {
    state: d?.state ?? d?.transaction?.state ?? d?.status,
    txHash: d?.txHash ?? d?.transaction?.txHash ?? d?.transactionHash ?? d?.tx_hash,
    errorReason: d?.errorReason ?? d?.error?.message ?? d?.failureReason,
  };
}

async function main() {
  const txId = mustEnv("CIRCLE_TX_ID");
  const explorerBase = process.env.ARC_EXPLORER_TX ?? "https://testnet.arcscan.app/tx/";

  // 🔧 Probar ambos endpoints (sin suponer)
  const endpoints = [`/transactions/${txId}`, `/developer/transactions/${txId}`];

  for (let i = 0; i < 60; i++) {
    let last: any = null;

    for (const ep of endpoints) {
      try {
        last = await circleGet<any>(ep);
        const { state, txHash, errorReason } = pickStateAndHash(last);

        console.log(`[${i}] ep=${ep} state=${state ?? "?"} txHash=${txHash ?? "-"}`);

        if (state === "COMPLETE" && txHash) {
          console.log("\n✅ On-chain txHash:", txHash);
          console.log("🔎 Arcscan:", `${explorerBase}${txHash}`);
          return;
        }

        if (state === "FAILED" || state === "CANCELLED") {
          throw new Error(`Tx ended state=${state}. reason=${errorReason ?? "unknown"}`);
        }

        // si este endpoint nos dio state válido, no hace falta probar el otro en esta iteración
        if (state) break;
      } catch (e: any) {
        // Si un endpoint falla, probamos el otro
        continue;
      }
    }

    // 🔍 Si ambos endpoints dan state vacío, imprime un “sample” pequeño 1 vez
    if (i === 0) {
      const sample =
        typeof last === "string" ? last.slice(0, 300) : JSON.stringify(last).slice(0, 600);
      console.log("DEBUG_RESPONSE_SAMPLE:", sample);
    }

    await sleep(5000);
  }

  throw new Error("Timeout waiting for tx to complete.");
}

main().catch((e) => {
  console.error(e?.response?.data ?? e);
  process.exit(1);
});
