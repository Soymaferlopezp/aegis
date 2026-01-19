export const VaultGuardrailsAbi = [
  "function owner() view returns (address)",
  "function agentExecutor() view returns (address)",
  "function maxPerTx() view returns (uint256)",
  "function dailyLimit() view returns (uint256)",
  // IMPORTANT: no spentToday() in contract; use spentInCurrentDay()
  "function spentInCurrentDay() view returns (uint256)"
] as const;
