import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

type DeploymentRegistry = Record<
  string,
  Record<string, { address: string; txHash: string; deployedAt: string; meta?: any }>
>;

const DEPLOYMENTS_PATH = path.join(__dirname, "..", "deployments", "arcTestnet.json");

function loadRegistry(): DeploymentRegistry {
  if (!fs.existsSync(DEPLOYMENTS_PATH)) return {};
  return JSON.parse(fs.readFileSync(DEPLOYMENTS_PATH, "utf8"));
}

function saveRegistry(reg: DeploymentRegistry) {
  fs.mkdirSync(path.dirname(DEPLOYMENTS_PATH), { recursive: true });
  fs.writeFileSync(DEPLOYMENTS_PATH, JSON.stringify(reg, null, 2));
}

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") throw new Error(`Missing env var: ${name}`);
  return v;
}

function mustEnvBigInt(name: string): bigint {
  const v = mustEnv(name);
  // allow decimal strings
  return BigInt(v);
}

async function main() {
  const chainId = network.config.chainId;
  console.log(`\nDeploying VaultGuardrails to network=${network.name} chainId=${chainId}\n`);

  const usdc = mustEnv("ARC_USDC_ADDRESS");
  const owner = mustEnv("VAULT_OWNER_ADDRESS");
  const agent = mustEnv("VAULT_AGENT_EXECUTOR_ADDRESS");
  const maxPerTx = mustEnvBigInt("VAULT_MAX_PER_TX");
  const dailyLimit = mustEnvBigInt("VAULT_DAILY_LIMIT");

  const Vault = await ethers.getContractFactory("VaultGuardrails");
  const vault = await Vault.deploy(usdc, owner, agent, maxPerTx, dailyLimit);
  await vault.waitForDeployment();

  const address = await vault.getAddress();
  const txHash = vault.deploymentTransaction()?.hash ?? "UNKNOWN_TX";

  console.log("VaultGuardrails deployed:");
  console.log("  address:", address);
  console.log("  txHash: ", txHash);

  const reg = loadRegistry();
  const netKey = network.name; // should be "arcTestnet" in your pipeline
  reg[netKey] = reg[netKey] || {};
  reg[netKey]["VaultGuardrails"] = {
    address,
    txHash,
    deployedAt: new Date().toISOString(),
    meta: { usdc, owner, agent, maxPerTx: maxPerTx.toString(), dailyLimit: dailyLimit.toString() },
  };
  saveRegistry(reg);

  console.log(`\nSaved to ${DEPLOYMENTS_PATH}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
