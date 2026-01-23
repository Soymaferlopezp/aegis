export type ConsoleMode = "SIMULATE" | "VALIDATE" | "EXECUTE";

export type SimulateOutput = {
  to: string;
  amount: string;   // base units (e.g., 1000000 = 1 USDC if 6 decimals)
  currency: "USDC" | string;
  reason: string;
};

export type ValidateOutput = {
  status: "APPROVED_READY" | "BLOCKED";
  reason: string;
  vault: {
    maxPerTx: string;
    dailyLimit: string;
    spentToday: string; // alias for spentInCurrentDay()
  };
};

export type ExecuteOutput =
  | { status: "APPROVED"; txHash: string; arcscan: string }
  | { status: "BLOCKED"; reason: string };

export type TimelineStage =
  | "USER_INTENT"
  | "AGENT_INTERPRETATION"
  | "VAULT_VALIDATION"
  | "EXECUTION"
  | "ERROR";

export type TimelineEventBase = {
  id: string;
  stage: TimelineStage;
  title: string; // EN label visible
  timestampISO: string;
};

export type IntentEvent = TimelineEventBase & {
  stage: "USER_INTENT";
  intent: string;
};

export type SimulateEvent = TimelineEventBase & {
  stage: "AGENT_INTERPRETATION";
  output: SimulateOutput;
};

export type ValidateEvent = TimelineEventBase & {
  stage: "VAULT_VALIDATION";
  output: ValidateOutput;
};

export type ExecuteEvent = TimelineEventBase & {
  stage: "EXECUTION";
  output: ExecuteOutput;
};

export type ErrorEvent = TimelineEventBase & {
  stage: "ERROR";
  error: string; // raw error
};

export type TimelineEvent = IntentEvent | SimulateEvent | ValidateEvent | ExecuteEvent | ErrorEvent;

export type EvidenceSnapshot = {
  vault?: {
    maxPerTx?: string;
    dailyLimit?: string;
    spentToday?: string;
  };
  decision?: {
    status?: "APPROVED_READY" | "BLOCKED" | "APPROVED";
    reason?: string;
  };
  execution?: {
    txHash?: string;
    arcscan?: string;
    message?: string; // EN no-execution message
  };
};
