import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

const DEPLOYMENTS_PATH = path.join(__dirname, "..", "deployments", "arcTestnet.json");

function loadVaultAddress(): string {
  if (!fs.existsSync(DEPLOYMENTS_PATH)) throw new Error("Missing deployments/arcTestnet.json");
  const reg = JSON.parse(fs.readFileSync(DEPLOYMENTS_PATH, "utf8"));
  const netKey = network.name;
  const addr = reg?.[netKey]?.["VaultGuardrails"]?.address;
  if (!addr) throw new Error(`VaultGuardrails not found in registry for network: ${netKey}`);
  return addr;
}

async function main() {
  console.log(`\nSmoke test VaultGuardrails on network=${network.name}\n`);

  const addr = loadVaultAddress();
  const vault = await ethers.getContractAt("VaultGuardrails", addr);

  const owner = await (vault as any).owner();
  const agent = await (vault as any).agentExecutor();
  const usdc = await (vault as any).usdc();
  const maxPerTx = await (vault as any).maxPerTx();
  const dailyLimit = await (vault as any).dailyLimit();
  const spentToday = await (vault as any).spentInCurrentDay();

  console.log("VaultGuardrails @", addr);
  console.log("  owner:      ", owner);
  console.log("  agent:      ", agent);
  console.log("  usdc:       ", usdc);
  console.log("  maxPerTx:   ", maxPerTx.toString());
  console.log("  dailyLimit: ", dailyLimit.toString());
  console.log("  spentToday: ", spentToday.toString());

  console.log("\n✅ Smoke OK (read-only)\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
