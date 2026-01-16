import { ethers } from "ethers";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function main() {
  const rpc = process.env.ARC_TESTNET_RPC_PRIMARY ?? "https://rpc.testnet.arc.network";
  const vault = mustEnv("VAULT_ADDRESS");

  const provider = new ethers.JsonRpcProvider(rpc);

  const abi = [
    "function owner() view returns (address)",
    "function agentExecutor() view returns (address)",
    "function maxPerTx() view returns (uint256)",
    "function dailyLimit() view returns (uint256)",
  ];

  const c = new ethers.Contract(vault, abi, provider);

  const [owner, agent, maxPerTx, dailyLimit] = await Promise.all([
    c.owner(),
    c.agentExecutor(),
    c.maxPerTx(),
    c.dailyLimit(),
  ]);

  console.log("Vault:", vault);
  console.log("owner:", owner);
  console.log("agentExecutor:", agent);
  console.log("maxPerTx:", maxPerTx.toString());
  console.log("dailyLimit:", dailyLimit.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
