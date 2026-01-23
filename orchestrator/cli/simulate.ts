import "dotenv/config";
import { step, errorLog } from "../logger";
import { llmSimulate } from "../llm/client";
import { buildSimulatePrompt } from "../gemini/prompt";

async function main() {
  const intent = process.argv.slice(2).join(" ").trim();
  if (!intent) throw new Error("Missing intent argument");

  const merchant =
    process.env.MERCHANT_ADDRESS ||
    process.env.DESTINATION_ADDRESS ||
    "0x000000000000000000000000000000000000dEaD";

  step("simulate.start", { intent });

  const prompt = buildSimulatePrompt({ intent, merchant });
  step("llm.request");

  const decision = await llmSimulate(prompt);

  step("llm.decision.ok", { to: decision.to, amount: decision.amount });

  // stdout: ONLY JSON
  process.stdout.write(JSON.stringify(decision) + "\n");
}

main().catch((e) => {
  errorLog("simulate", e);
  process.exit(1);
});
