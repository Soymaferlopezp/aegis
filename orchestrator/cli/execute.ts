import "dotenv/config";
import { readVaultState } from "../vault/readState";
import { buildSimulatePrompt } from "../gemini/prompt";
import { geminiSimulate } from "../gemini/client";
import { validateAgainstVault } from "../validate";
import { runCircleSpendViaGitHubActions } from "../circle/githubActions";

function step(name: string, data?: any) {
  const payload = data ? ` ${JSON.stringify(data)}` : "";
  console.error(`[${new Date().toISOString()}] STEP ${name}${payload}`);
}

function fail(label: string, err: any): never {
  const msg =
    typeof err === "string"
      ? err
      : err?.response?.data?.error
      ? err.response.data.error
      : err?.message ?? err;

  console.error(`[${new Date().toISOString()}] ERROR ${label}`, msg);
  process.exit(1);
}

function getIntentFromArgv(): string {
  const intent = process.argv.slice(2).join(" ").trim();
  if (!intent) throw new Error(`Missing intent. Usage: npm run agent:execute -- "Comprar 1 USDC de café"`);
  return intent;
}

async function main() {
  const intent = getIntentFromArgv();
  step("execute.start", { intent });

  // 1) Read vault state (read-only)
  const vault = await readVaultState();
  step("vault.read.ok", {
    maxPerTx: vault.maxPerTx,
    dailyLimit: vault.dailyLimit,
    spentToday: vault.spentToday,
  });

  // 2) Gemini simulate -> strict JSON decision
  const merchant = process.env.DESTINATION_ADDRESS ?? process.env.SMOKE_RECIPIENT_ADDRESS ?? "";
  if (!merchant) throw new Error("Missing DESTINATION_ADDRESS (or SMOKE_RECIPIENT_ADDRESS) for merchant");

  const prompt = buildSimulatePrompt({ intent, merchant });

  step("gemini.request");
  const decision = await geminiSimulate(prompt);
  step("gemini.decision.ok", { to: decision.to, amount: decision.amount });

  // 3) Validate decision against vault limits
  const verdict = validateAgainstVault({ amount: decision.amount, vault });

  if (verdict.status !== "APPROVED_READY") {
    step("validation.blocked", { reason: verdict.reason });

    // stdout: SOLO JSON final
    const out = {
      status: "BLOCKED" as const,
      to: decision.to,
      amount: decision.amount,
      currency: decision.currency,
      reason: verdict.reason, // backend verdict
      reason_model: decision.reason, // model text preserved separately
      vault, // mantiene evidencia
    };

    console.log(JSON.stringify(out));
    return;
  }

  step("validation.pass");

  // 4) Strict gate: only here we call Circle (via GitHub Actions)
  step("circle.dispatch.github_actions", { to: decision.to, amount: decision.amount });

  const confirmed = await runCircleSpendViaGitHubActions({
    to: decision.to,
    amount: decision.amount,
  });

  // sanitize (prevenir JSON roto por \r\n)
  const circleTxId = String(confirmed.circleTxId).trim();
  const txHash = String(confirmed.txHash).trim();
  const arcscan = String(confirmed.arcscan).trim();

  step("circle.tx.confirmed", { circleTxId, txHash });

  // stdout: SOLO JSON final
  const out = {
    status: "APPROVED" as const,
    to: decision.to,
    amount: decision.amount,
    currency: decision.currency,
    reason: verdict.reason, // backend verdict
    reason_model: decision.reason,
    circle: { circleTxId },
    txHash,
    arcscan, // ✅ link directo
    vault,
  };

  console.log(JSON.stringify(out));
}

main().catch((e) => fail("execute", e));
