import type { VaultState } from "./vault/readState";

export type ValidateVerdict =
  | {
      status: "APPROVED_READY";
      reason: "Within limits";
    }
  | {
      status: "BLOCKED";
      reason: "amount > maxPerTx" | "dailyLimit exceeded" | "amount must be > 0";
    };

function bn(x: string): bigint {
  if (!/^\d+$/.test(x)) throw new Error(`Invalid integer string: ${x}`);
  return BigInt(x);
}

export function validateAgainstVault(input: {
  amount: string; // minor units, integer string
  vault: VaultState;
}): ValidateVerdict {
  const amount = bn(input.amount);
  const maxPerTx = bn(input.vault.maxPerTx);
  const dailyLimit = bn(input.vault.dailyLimit);
  const spentToday = bn(input.vault.spentToday);

  if (amount <= 0n) return { status: "BLOCKED", reason: "amount must be > 0" };
  if (amount > maxPerTx) return { status: "BLOCKED", reason: "amount > maxPerTx" };
  if (spentToday + amount > dailyLimit) return { status: "BLOCKED", reason: "dailyLimit exceeded" };

  return { status: "APPROVED_READY", reason: "Within limits" };
}
