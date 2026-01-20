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
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

const VAULT_ABI = [
  "function deposit(uint256 amount) external",
];

function parseUSDCToMinor(human: string, decimals: number): bigint {
  // ethers.parseUnits devuelve bigint en v6
  return ethers.parseUnits(human, decimals);
}

async function main() {
  const rpc = mustEnv("ARC_TESTNET_RPC_PRIMARY");
  const provider = new ethers.JsonRpcProvider(rpc);

  const usdcAddr = mustEnv("USDC_ARC");
  const vaultAddr = mustEnv("VAULT_ADDRESS");
  const ownerAddr = mustEnv("VAULT_OWNER_ADDRESS");
  const ownerPk = mustEnv("OWNER_PRIVATE_KEY");

  const wallet = new ethers.Wallet(ownerPk, provider);

  // Safety: asegurar que PK corresponde al owner esperado
  if (wallet.address.toLowerCase() !== ownerAddr.toLowerCase()) {
    throw new Error(
      `OWNER_PRIVATE_KEY address mismatch. Expected VAULT_OWNER_ADDRESS=${ownerAddr}, got=${wallet.address}`
    );
  }

  const usdc = new ethers.Contract(usdcAddr, ERC20_ABI, wallet);
  const vault = new ethers.Contract(vaultAddr, VAULT_ABI, wallet);

  let decimals = 6;
  try {
    decimals = Number(await usdc.decimals());
  } catch {
    decimals = 6;
  }
  const sym = (await usdc.symbol().catch(() => "USDC")) as string;

  // Amount (default 2 USDC)
  const human = (process.argv[2] ?? "2").trim(); // e.g. "2" or "2.5"
  const amount = parseUSDCToMinor(human, decimals);

  console.log(`Deposit target (Vault): ${vaultAddr}`);
  console.log(`From owner:            ${wallet.address}`);
  console.log(`Token:                ${sym} (${usdcAddr})`);
  console.log(`Amount:               ${amount.toString()} (${human} ${sym})`);

  const balOwnerBefore = await usdc.balanceOf(wallet.address);
  const balVaultBefore = await usdc.balanceOf(vaultAddr);

  console.log(`\nBalances BEFORE`);
  console.log(`  Owner: ${ethers.formatUnits(balOwnerBefore, decimals)} ${sym}`);
  console.log(`  Vault: ${ethers.formatUnits(balVaultBefore, decimals)} ${sym}`);

  if (balOwnerBefore < amount) {
    throw new Error(`Insufficient owner balance. Need ${human} ${sym}, have ${ethers.formatUnits(balOwnerBefore, decimals)} ${sym}`);
  }

  // Approve if needed
  const allowance = await usdc.allowance(wallet.address, vaultAddr);
  if (allowance < amount) {
    console.log(`\nStep: approve(${vaultAddr}, ${amount.toString()}) ...`);
    const txA = await usdc.approve(vaultAddr, amount);
    console.log(`  approve tx: ${txA.hash}`);
    await txA.wait();
    console.log(`  approve confirmed`);
  } else {
    console.log(`\nStep: approve skipped (allowance already sufficient)`);
  }

  // Deposit
  console.log(`\nStep: vault.deposit(${amount.toString()}) ...`);
  const txD = await vault.deposit(amount);
  console.log(`  deposit tx: ${txD.hash}`);
  await txD.wait();
  console.log(`  deposit confirmed`);

  const balOwnerAfter = await usdc.balanceOf(wallet.address);
  const balVaultAfter = await usdc.balanceOf(vaultAddr);

  console.log(`\nBalances AFTER`);
  console.log(`  Owner: ${ethers.formatUnits(balOwnerAfter, decimals)} ${sym}`);
  console.log(`  Vault: ${ethers.formatUnits(balVaultAfter, decimals)} ${sym}`);
}

main().catch((e) => {
  console.error(e?.response?.data ?? e);
  process.exit(1);
});
