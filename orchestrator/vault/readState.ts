import { ethers } from "ethers";
import { VaultGuardrailsAbi } from "./abi";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export type VaultState = {
  owner: string;
  agentExecutor: string;
  maxPerTx: string;
  dailyLimit: string;
  spentToday: string; // logical alias of spentInCurrentDay()
};

export async function readVaultState(): Promise<VaultState> {
  const rpc =
    process.env.ARC_TESTNET_RPC_PRIMARY ||
    process.env.ARC_RPC_URL ||
    mustEnv("ARC_TESTNET_RPC_PRIMARY");
  const vaultAddress = mustEnv("VAULT_ADDRESS");

  const provider = new ethers.JsonRpcProvider(rpc);
  const vault = new ethers.Contract(vaultAddress, VaultGuardrailsAbi, provider);

  const [owner, agentExecutor, maxPerTx, dailyLimit, spentInCurrentDay] = await Promise.all([
    vault.owner(),
    vault.agentExecutor(),
    vault.maxPerTx(),
    vault.dailyLimit(),
    vault.spentInCurrentDay()
  ]);

  return {
    owner,
    agentExecutor,
    maxPerTx: maxPerTx.toString(),
    dailyLimit: dailyLimit.toString(),
    spentToday: spentInCurrentDay.toString()
  };
}
