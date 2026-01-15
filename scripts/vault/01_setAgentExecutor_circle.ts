import { ethers } from "hardhat";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function main() {
  const vault = mustEnv("VAULT_ADDRESS");
  const newAgent = mustEnv("CIRCLE_WALLET_ADDRESS_AGENT"); // 0x94f6...
  const ownerPk = mustEnv("OWNER_PRIVATE_KEY"); // owner del vault

  const rpc = process.env.ARC_TESTNET_RPC_PRIMARY ?? process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network";
  const provider = new ethers.JsonRpcProvider(rpc);

  const owner = new ethers.Wallet(ownerPk, provider);

  const abi = [
    "function owner() view returns (address)",
    "function agentExecutor() view returns (address)",
    "function setAgentExecutor(address newAgent) external",
  ];

  const c = new ethers.Contract(vault, abi, owner);

  const currentOwner = await c.owner();
  const currentAgent = await c.agentExecutor();

  console.log("Vault:", vault);
  console.log("Current owner:", currentOwner);
  console.log("Signer (from pk):", await owner.getAddress());
  console.log("Current agentExecutor:", currentAgent);
  console.log("Setting new agentExecutor to:", newAgent);

  const tx = await c.setAgentExecutor(newAgent);
  console.log("txHash:", tx.hash);

  const receipt = await tx.wait();
  console.log("✅ Mined in block:", receipt.blockNumber);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
