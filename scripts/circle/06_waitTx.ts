import { circleGet, mustEnv } from "./_shared";

type TxResponse = {
  data: {
    id: string;
    state: string;
    txHash?: string;
    errorReason?: string;
  };
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const txId = mustEnv("CIRCLE_TX_ID");
  const explorerBase =
    process.env.ARC_EXPLORER_TX ?? "https://testnet.arcscan.app/tx/";

  for (let i = 0; i < 60; i++) {
    const res = await circleGet<TxResponse>(`/transactions/${txId}`);
    const { state, txHash, errorReason } = res.data;

    console.log(`[${i}] state=${state} txHash=${txHash ?? "-"}`);

    if (state === "COMPLETE" && txHash) {
      console.log("\n✅ On-chain txHash:", txHash);
      console.log("🔎 Arcscan:", `${explorerBase}${txHash}`);
      return;
    }

    if (state === "FAILED" || state === "CANCELLED") {
      throw new Error(
        `Tx ended in state=${state}. reason=${errorReason ?? "unknown"}`
      );
    }

    await sleep(5000);
  }

  throw new Error("Timeout waiting for tx to complete.");
}

main().catch((e) => {
  console.error(e?.response?.data ?? e);
  process.exit(1);
});
