import type { ConsoleMode } from "./types";

export const CONSOLE_TITLE = "AEGIS Agent Console";
export const CONSOLE_NOTICE = "Observational UI. Enforcement happens on-chain.";

export const MODE_LABEL: Record<ConsoleMode, string> = {
  SIMULATE: "SIMULATE",
  VALIDATE: "VALIDATE",
  EXECUTE: "EXECUTE",
};

export const RUN_BUTTON_LABEL: Record<ConsoleMode, string> = {
  SIMULATE: "Run Simulate",
  VALIDATE: "Run Validate",
  EXECUTE: "Run Execute",
};

export const STAGE_LABELS = {
  USER_INTENT: "User Intent",
  AGENT_INTERPRETATION: "Agent Interpretation",
  VAULT_VALIDATION: "Vault Validation (On-chain)",
  EXECUTION: "Execution (Circle / Arc)",
  ERROR: "Error",
} as const;

export const PLACEHOLDER_NOTES = {
  AGENT_INTERPRETATION: "Awaiting real output from SIMULATE.",
  VAULT_VALIDATION: "Awaiting real output from VALIDATE (on-chain).",
  EXECUTION: "Awaiting real output from EXECUTE.",
} as const;

export const EVIDENCE_EMPTY_TITLE = "No evidence yet.";
export const EVIDENCE_EMPTY_BODY =
  "Run a mode to display real outputs from the system. The UI never approves or enforces.";
