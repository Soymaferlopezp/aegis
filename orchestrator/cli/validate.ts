import "dotenv/config";
import { step, errorLog } from "../logger";
import { buildSimulatePrompt } from "../gemini/prompt";
import { geminiSimulate } from "../gemini/client";
import { readVaultState } from "../vault/readState";
import { validateAgainstVault } from "../validate";

async function main() {
  const intent = process.argv.slice(2).join(" ").trim();
  if (!intent) throw new Error("Missing intent argument");

  const merchant =
    process.env.MERCHANT_ADDRESS ||
    process.env.DESTINATION_ADDRESS ||
    "0x000000000000000000000000000000000000dEaD";

  step("validate.start", { intent });

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

  if (verdict.status === "BLOCKED") {
    step("validation.blocked", { reason: verdict.reason });
  } else {
    step("validation.pass");
  }

  const out = {
    status: verdict.status,
    to: modelDecision.to,
    amount: modelDecision.amount,
    currency: modelDecision.currency,
    reason: verdict.reason, // backend verdict
    reason_model: modelDecision.reason,
    vault: {
      maxPerTx: vault.maxPerTx,
      dailyLimit: vault.dailyLimit,
      spentToday: vault.spentToday
    }
  };

  process.stdout.write(JSON.stringify(out) + "\n");
}

main().catch((e) => {
  errorLog("validate", e);
  process.exit(1);
});
