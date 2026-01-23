// frontend/lib/console/types.ts

export type ConsoleMode = "SIMULATE" | "VALIDATE" | "EXECUTE";

export type SimulateOutput = {
  to: string;
  amount: string; // minor units (6 decimals) as string
  currency: "USDC" | string;
  reason: string;
};

export type ValidateOutput = {
  status: "APPROVED_READY" | "BLOCKED";
  reason: string;

  // optional, but we display if present
  to?: string;
  amount?: string;
  currency?: "USDC" | string;

  // model reason (if your backend provides it)
  reason_model?: string;

  vault: {
    maxPerTx: string;
    dailyLimit: string;
    spentToday: string; // UI alias (getter is spentInCurrentDay)
  };
};

export type ExecuteOutput = {
  status: "APPROVED" | "BLOCKED" | "ERROR";
  reason?: string;
  message?: string;

  txHash?: string;
  arcscan?: string;
  circleTxId?: string;
};

export type EvidenceSnapshot = {
  vault?: { maxPerTx?: string; dailyLimit?: string; spentToday?: string };
  decision?: { status?: string; reason?: string };
  execution?: {
    status?: string;
    txHash?: string;
    arcscan?: string;
    circleTxId?: string;
    message?: string;
  };
};

export type TimelineStage =
  | "USER_INTENT"
  | "AGENT_INTERPRETATION"
  | "VAULT_VALIDATION"
  | "EXECUTION"
  | "ERROR";

type TimelineBase = {
  id: string;
  title: string;
  timestampISO: string;
};

export type TimelineEvent =
  | (TimelineBase & {
      stage: "USER_INTENT";
      intent: string;
    })
  | (TimelineBase & {
      stage: "AGENT_INTERPRETATION";
      output: SimulateOutput;
    })
  | (TimelineBase & {
      stage: "VAULT_VALIDATION";
      output: ValidateOutput;
    })
  | (TimelineBase & {
      stage: "EXECUTION";
      output: ExecuteOutput;
    })
  | (TimelineBase & {
      stage: "ERROR";
      error: string;
    });
