import "dotenv/config";
import { step, errorLog } from "../logger";
import { buildSimulatePrompt } from "../gemini/prompt";
import { geminiSimulate } from "../gemini/client";
import { readVaultState } from "../vault/readState";
import { validateAgainstVault } from "../validate";
import { runSubprocess, parseCircleTxId, parseOnChainTxHash } from "../circle/subprocess";
import { arcscanTxLink } from "../arcscan";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function main() {
  const intent = process.argv.slice(2).join(" ").trim();
  if (!intent) throw new Error("Missing intent argument");

  // Enforce using real repo value (no fallback "ARC")
  const circleBlockchain = mustEnv("CIRCLE_BLOCKCHAIN"); // must be ARC-TESTNET
  if (circleBlockchain !== "ARC-TESTNET") {
    throw new Error(`CIRCLE_BLOCKCHAIN must be ARC-TESTNET. Got: ${circleBlockchain}`);
  }

  const merchant =
    process.env.MERCHANT_ADDRESS ||
    process.env.DESTINATION_ADDRESS ||
    "0x000000000000000000000000000000000000dEaD";

  step("execute.start", { intent });

  const vault = await readVaultState();
  step("vault.read.ok", {
    maxPerTx: vault.maxPerTx,
    dailyLimit: vault.dailyLimit,
    spentToday: vault.spentToday
  });

  const prompt = buildSimulatePrompt({ intent, merchant });
  step("gemini.request");

  const modelDecision = await geminiSimulate(prompt)
  step("gemini.decision.ok", { to: modelDecision.to, amount: modelDecision.amount });

  const verdict = validateAgainstVault({ amount: modelDecision.amount, vault });

  // Gate STRICT: no Circle subprocess unless APPROVED_READY
  if (verdict.status !== "APPROVED_READY") {
    step("validation.blocked", { reason: verdict.reason });

    const out = {
      status: "BLOCKED" as const,
      to: modelDecision.to,
      amount: modelDecision.amount,
      currency: modelDecision.currency,
      reason: verdict.reason, // backend verdict
      reason_model: modelDecision.reason
    };

    process.stdout.write(JSON.stringify(out) + "\n");
    return;
  }

  step("validation.pass");

  // Prepare SPEND_ABI_PARAMS_JSON for 07 script
  const spendParamsJson = JSON.stringify([modelDecision.to, Number(modelDecision.amount)]);

  step("circle.spawn.07_callSpend_vault");
  const res07 = await runSubprocess({
    cmd: process.platform === "win32" ? "node_modules\\.bin\\ts-node.cmd" : "node_modules/.bin/ts-node",
    args: ["scripts/circle/07_callSpend_vault.ts"],

    env: {
      // DO NOT rename Circle env vars; only inject what 07 needs
      VAULT_ADDRESS: mustEnv("VAULT_ADDRESS"),
      CIRCLE_WALLET_ID_AGENT: mustEnv("CIRCLE_WALLET_ID_AGENT"),
      CIRCLE_ENTITY_SECRET_HEX: mustEnv("CIRCLE_ENTITY_SECRET_HEX"),
      CIRCLE_API_KEY: mustEnv("CIRCLE_API_KEY"),
      CIRCLE_BASE_URL: process.env.CIRCLE_BASE_URL, // optional but recommended to be set
      CIRCLE_BLOCKCHAIN: circleBlockchain,
      SPEND_ABI_PARAMS_JSON: spendParamsJson
    }
  });

  if (res07.code !== 0) {
    throw new Error(`Circle 07_callSpend_vault failed. stderr=${res07.stderr.slice(0, 600)}`);
  }

  const circleTxId = parseCircleTxId(res07.stdout);
  if (!circleTxId) {
    throw new Error(`Failed to parse circleTxId from 07 stdout. stdout=${res07.stdout.slice(0, 600)}`);
  }

  step("circle.contractExecution.created", { circleTxId });

  step("circle.spawn.06_waitTx");
  const res06 = await runSubprocess({
    cmd: process.platform === "win32" ? "node_modules\\.bin\\ts-node.cmd" : "node_modules/.bin/ts-node",
    args: ["scripts/circle/06_waitTx.ts"],
    env: {
      CIRCLE_API_KEY: mustEnv("CIRCLE_API_KEY"),
      CIRCLE_BASE_URL: process.env.CIRCLE_BASE_URL,
      CIRCLE_TX_ID: circleTxId,
      ARC_EXPLORER_TX: process.env.ARC_EXPLORER_TX
    }
  });

  if (res06.code !== 0) {
    throw new Error(`Circle 06_waitTx failed. stderr=${res06.stderr.slice(0, 600)}`);
  }

  const txHash = parseOnChainTxHash(res06.stdout);
  if (!txHash) {
    throw new Error(`Failed to parse txHash from 06 stdout. stdout=${res06.stdout.slice(0, 800)}`);
  }

  step("circle.tx.confirmed", { txHash });

  const out = {
    status: "APPROVED" as const,
    to: modelDecision.to,
    amount: modelDecision.amount,
    currency: modelDecision.currency,
    reason: verdict.reason, // backend verdict
    reason_model: modelDecision.reason,
    circle: { circleTxId },
    txHash,
    arcscan: arcscanTxLink(txHash)
  };

  process.stdout.write(JSON.stringify(out) + "\n");
}

main().catch((e) => {
  errorLog("execute", e);
  process.exit(1);
});
