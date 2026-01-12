import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const DEPLOYMENTS_PATH = path.join(__dirname, "..", "deployments", "arcTestnet.json");

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") throw new Error(`Missing env var: ${name}`);
  return v;
}

function loadVaultAddress(): string {
  if (!fs.existsSync(DEPLOYMENTS_PATH)) throw new Error("Missing deployments/arcTestnet.json");
  const reg = JSON.parse(fs.readFileSync(DEPLOYMENTS_PATH, "utf8"));
  const vaultAddr = reg?.["arcTestnet"]?.["VaultGuardrails"]?.address;
  if (!vaultAddr) throw new Error("VaultGuardrails not found in registry for arcTestnet");
  return vaultAddr;
}

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address who) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

const VAULT_ABI = [
  "function owner() view returns (address)",
  "function agentExecutor() view returns (address)",
  "function usdc() view returns (address)",
  "function maxPerTx() view returns (uint256)",
  "function dailyLimit() view returns (uint256)",
  "function spentInCurrentDay() view returns (uint256)",
  "function deposit(uint256 amount) external",
  "function spend(address to, uint256 amount) external",
];

function toBI(x: any): bigint {
  return BigInt(x.toString());
}

async function main() {
  const explorer = process.env.ARC_EXPLORER_URL ?? "https://testnet.arcscan.app";

  const rpcUrl = mustEnv("ARC_TESTNET_RPC_PRIMARY");
  const ownerPk = mustEnv("OWNER_PRIVATE_KEY");
  const agentPk = mustEnv("AGENT_PRIVATE_KEY");

  const recipient = process.env.SMOKE_RECIPIENT_ADDRESS ?? ethers.Wallet.createRandom().address;

  // Defaults: small, safe values
  const depositAmount = BigInt(process.env.SMOKE_DEPOSIT_AMOUNT ?? "2000000"); // 2 USDC (6 decimals)
  const spendAmount = BigInt(process.env.SMOKE_SPEND_AMOUNT ?? "1000000");     // 1 USDC (6 decimals)

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const owner = new ethers.Wallet(ownerPk, provider);
  const agent = new ethers.Wallet(agentPk, provider);

  const vaultAddr = loadVaultAddress();
  const vaultRead = new ethers.Contract(vaultAddr, VAULT_ABI, provider);

  const usdcAddr: string = await vaultRead.usdc();
  const usdcRead = new ethers.Contract(usdcAddr, ERC20_ABI, provider);
  const usdcOwner = new ethers.Contract(usdcAddr, ERC20_ABI, owner);

  const vaultAsOwner = new ethers.Contract(vaultAddr, VAULT_ABI, owner);
  const vaultAsAgent = new ethers.Contract(vaultAddr, VAULT_ABI, agent);

  console.log("\nSmoke spend test (on-chain):");
  console.log("  vault:     ", vaultAddr);
  console.log("  owner:     ", owner.address);
  console.log("  agent:     ", agent.address);
  console.log("  recipient: ", recipient);
  console.log("  usdc:      ", usdcAddr);
  console.log("  spendAmount:", spendAmount.toString());
  console.log("  depositAmount:", depositAmount.toString());

  // Sanity: confirm roles match deployed config (protects against env mixups)
  const ownerOnchain = await vaultRead.owner();
  const agentOnchain = await vaultRead.agentExecutor();

  if (ownerOnchain.toLowerCase() !== owner.address.toLowerCase()) {
    throw new Error(`Owner mismatch: onchain=${ownerOnchain} envOwner=${owner.address}`);
  }
  if (agentOnchain.toLowerCase() !== agent.address.toLowerCase()) {
    throw new Error(`Agent mismatch: onchain=${agentOnchain} envAgent=${agent.address}`);
  }

  // Read guardrails (helps explain failures fast)
  const maxPerTx = toBI(await vaultRead.maxPerTx());
  const dailyLimit = toBI(await vaultRead.dailyLimit());
  const spentTodayBefore = toBI(await vaultRead.spentInCurrentDay());

  if (spendAmount > maxPerTx) {
    throw new Error(`Smoke config invalid: spendAmount(${spendAmount}) > maxPerTx(${maxPerTx})`);
  }
  if (spentTodayBefore + spendAmount > dailyLimit) {
    throw new Error(
      `Smoke would exceed dailyLimit: spentToday(${spentTodayBefore}) + spendAmount(${spendAmount}) > dailyLimit(${dailyLimit})`
    );
  }

  // Balances before
  const balVaultBefore = toBI(await usdcRead.balanceOf(vaultAddr));
  const balRecipBefore = toBI(await usdcRead.balanceOf(recipient));
  const balOwnerBefore = toBI(await usdcRead.balanceOf(owner.address));

  console.log("\nBalances before:");
  console.log("  vault:     ", balVaultBefore.toString());
  console.log("  owner:     ", balOwnerBefore.toString());
  console.log("  recipient: ", balRecipBefore.toString());
  console.log("  spentToday:", spentTodayBefore.toString());

  // ===== PRO PATCH: Idempotent funding logic =====
  // If Vault already has enough to cover spendAmount, skip approve+deposit.
  // If not, deposit ONLY what's needed, and fail early with a clear message if owner lacks funds.
  const needTopUp = balVaultBefore < spendAmount;
  if (needTopUp) {
    const needed = spendAmount - balVaultBefore;

    // Choose deposit = min(env depositAmount, needed) BUT must still cover the spend
    // If env depositAmount < needed, we bump it to `needed` to guarantee spend works.
    const depositToUse = depositAmount < needed ? needed : depositAmount;

    // Early, explicit failure if owner doesn't have enough for depositToUse.
    // (This avoids the confusing "transfer amount exceeds balance" during estimateGas.)
    if (balOwnerBefore < depositToUse) {
      throw new Error(
        `Owner USDC balance too low for deposit. ownerBal=${balOwnerBefore} requiredDeposit=${depositToUse} (vaultBal=${balVaultBefore}, spendAmount=${spendAmount})`
      );
    }

    // If allowance already sufficient, skip approve.
    const currentAllowance = toBI(await usdcRead.allowance(owner.address, vaultAddr));

    console.log("\n1) approve + deposit (vault needs top-up)...");
    if (currentAllowance < depositToUse) {
      const txA = await (usdcOwner as any).approve(vaultAddr, depositToUse);
      await txA.wait();
      console.log("  approve tx:", txA.hash);
      console.log("  approve link:", `${explorer}/tx/${txA.hash}`);
    } else {
      console.log("  approve skipped ✅ (allowance sufficient)");
      console.log("  allowance:", currentAllowance.toString());
    }

    const txD = await (vaultAsOwner as any).deposit(depositToUse);
    await txD.wait();
    console.log("  deposit tx:", txD.hash);
    console.log("  deposit link:", `${explorer}/tx/${txD.hash}`);
  } else {
    console.log("\n1) deposit skipped ✅ (vault already funded)");
  }

  // Spend from agent
  console.log("2) spend from agent...");
  const txS = await (vaultAsAgent as any).spend(recipient, spendAmount);
  await txS.wait();
  console.log("  spend tx:  ", txS.hash);
  console.log("  spend link:", `${explorer}/tx/${txS.hash}`);

  const spentAfter = toBI(await vaultRead.spentInCurrentDay());

  // Balances after
  const balVaultAfter = toBI(await usdcRead.balanceOf(vaultAddr));
  const balRecipAfter = toBI(await usdcRead.balanceOf(recipient));
  const balOwnerAfter = toBI(await usdcRead.balanceOf(owner.address));

  console.log("\nBalances after:");
  console.log("  vault:     ", balVaultAfter.toString());
  console.log("  owner:     ", balOwnerAfter.toString());
  console.log("  recipient: ", balRecipAfter.toString());
  console.log("\nSpent today:", spentAfter.toString());
  console.log("\n✅ Smoke spend OK\n");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
