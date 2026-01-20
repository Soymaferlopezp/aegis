#!/usr/bin/env ts-node

import "dotenv/config";
import { geminiSimulate } from "../gemini/client";
import { buildSimulatePrompt } from "../gemini/prompt";
import { readVaultState } from "../vault/readState";
import { validateAgainstVault } from "../validate";
import { runCircleSpendViaGitHubActions } from "../circle/githubActions";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function step(name: string, data?: any) {
  const payload = data ? ` ${JSON.stringify(data)}` : "";
  console.error(`[${new Date().toISOString()}] STEP ${name}${payload}`);
}

function fail(scope: string, err: any) {
  console.error(
    `[${new Date().toISOString()}] ERROR ${scope}`,
    err?.response?.data ?? err?.message ?? err
  );
  process.exit(1);
}

async function main() {
  const intent = process.argv.slice(2).join(" ").trim();
  if (!intent) throw new Error("Missing intent text");

  step("execute.start", { intent });

  // Merchant fijo (misma fuente que simulate)
  const merchant =
    process.env.MERCHANT_ADDRESS ??
    process.env.DESTINATION_ADDRESS ??
    mustEnv("DESTINATION_ADDRESS");

  // 1) Leer Vault (read-only)
  const vault = await readVaultState();
  step("vault.read.ok", {
    maxPerTx: vault.maxPerTx,
    dailyLimit: vault.dailyLimit,
    spentToday: vault.spentToday,
  });

  // 2) Construir prompt + Gemini
  const prompt = buildSimulatePrompt({ intent, merchant });
  step("gemini.request");

  const decision = await geminiSimulate(prompt);
  step("gemini.decision.ok", {
    to: decision.to,
    amount: decision.amount,
  });

  // 3) Validación backend (guardrails)
  const verdict = validateAgainstVault({
    amount: decision.amount,
    vault,
  });

  if (verdict.status !== "APPROVED_READY") {
    step("validation.blocked", { reason: verdict.reason });

    process.stdout.write(
      JSON.stringify({
        status: "BLOCKED",
        to: decision.to,
        amount: decision.amount,
        currency: decision.currency,
        reason: verdict.reason,
        reason_model: decision.reason,
        vault,
      })
    );
    return;
  }

  step("validation.pass");

  // 4) Ejecutar Circle vía GitHub Actions (SOLO si APPROVED_READY)
  step("circle.dispatch.github_actions", {
    to: decision.to,
    amount: decision.amount,
  });

  const result = await runCircleSpendViaGitHubActions({
    to: decision.to,
    amount: decision.amount,
  });

  step("circle.tx.confirmed", {
    circleTxId: result.circleTxId,
    txHash: result.txHash,
  });

  // 5) Output final (stdout SOLO JSON)
  process.stdout.write(
    JSON.stringify({
      status: "APPROVED",
      to: decision.to,
      amount: decision.amount,
      currency: decision.currency,
      reason: verdict.reason,
      reason_model: decision.reason,
      circle: { circleTxId: result.circleTxId },
      txHash: result.txHash,
      arcscan: result.arcscan,
    })
  );
}

main().catch((e) => fail("execute", e));
