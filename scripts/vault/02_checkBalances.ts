import "dotenv/config";
import { ethers } from "ethers";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

async function main() {
  const rpc = mustEnv("ARC_TESTNET_RPC_PRIMARY");
  const provider = new ethers.JsonRpcProvider(rpc);

  const usdcAddr = mustEnv("USDC_ARC");
  const vaultAddr = mustEnv("VAULT_ADDRESS");
  const ownerAddr = mustEnv("VAULT_OWNER_ADDRESS");

  const agentAddr =
    process.env.CIRCLE_WALLET_ADDRESS_AGENT ??
    process.env.VAULT_AGENT_EXECUTOR_ADDRESS ??
    "";

  const usdc = new ethers.Contract(usdcAddr, ERC20_ABI, provider);

  let decimals = 6;
  try {
    decimals = Number(await usdc.decimals());
  } catch {
    decimals = 6;
  }

  const sym = (await usdc.symbol().catch(() => "USDC")) as string;

  const [balOwner, balVault] = await Promise.all([
    usdc.balanceOf(ownerAddr),
    usdc.balanceOf(vaultAddr),
  ]);

  console.log(`Token: ${sym} (${usdcAddr})`);
  console.log(`decimals=${decimals}\n`);

  console.log(`Owner: ${ownerAddr}`);
  console.log(`  balance: ${balOwner.toString()} (${ethers.formatUnits(balOwner, decimals)} ${sym})\n`);

  console.log(`Vault (contract): ${vaultAddr}`);
  console.log(`  balance: ${balVault.toString()} (${ethers.formatUnits(balVault, decimals)} ${sym})\n`);

  if (agentAddr) {
    const balAgent = await usdc.balanceOf(agentAddr);
    console.log(`Agent (Circle executor): ${agentAddr}`);
    console.log(`  balance: ${balAgent.toString()} (${ethers.formatUnits(balAgent, decimals)} ${sym})\n`);
  } else {
    console.log(`Agent: (no address in env: CIRCLE_WALLET_ADDRESS_AGENT / VAULT_AGENT_EXECUTOR_ADDRESS)\n`);
  }

  // Allowance (owner -> vault), útil para saber si ya aprobaste antes
  const allowance = await usdc.allowance(ownerAddr, vaultAddr);
  console.log(`Allowance Owner -> Vault: ${allowance.toString()} (${ethers.formatUnits(allowance, decimals)} ${sym})`);
}

main().catch((e) => {
  console.error(e?.response?.data ?? e);
  process.exit(1);
});
