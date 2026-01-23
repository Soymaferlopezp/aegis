"use client";

import { useMemo, useState } from "react";
import type {
  ConsoleMode,
  EvidenceSnapshot,
  TimelineEvent,
  SimulateOutput,
  ValidateOutput,
} from "@/lib/console/types";
import {
  CONSOLE_NOTICE,
  CONSOLE_TITLE,
  RUN_BUTTON_LABEL,
  STAGE_LABELS,
} from "@/lib/console/constants";

import ConsoleHeader from "@/components/console/ConsoleHeader";
import ConsoleTimeline from "@/components/console/ConsoleTimeline";
import EvidencePanel from "@/components/console/EvidencePanel";
import EvidenceDrawer from "@/components/console/EvidenceDrawer";
import ConsoleComposer from "@/components/console/ConsoleComposer";

function nowISO() {
  return new Date().toISOString();
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    // Prefer backend "error"/"reason"/"details" if present
    const msg =
      (typeof (data as any)?.error === "string" && (data as any).error) ||
      (typeof (data as any)?.reason === "string" && (data as any).reason) ||
      (typeof (data as any)?.details === "string" && (data as any).details) ||
      JSON.stringify(data);

    throw new Error(msg);
  }

  return data as T;
}

type ExecuteOutput = {
  status: "APPROVED" | "BLOCKED" | "ERROR";
  reason?: string;
  message?: string;
  txHash?: string;
  arcscan?: string;
  circleTxId?: string;
};

export default function ConsolePage() {
  const [mode, setMode] = useState<ConsoleMode>("SIMULATE");
  const [draftIntent, setDraftIntent] = useState<string>("");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [evidence, setEvidence] = useState<EvidenceSnapshot>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [running, setRunning] = useState(false);

  const hasAnyEvidence = useMemo(() => {
    return Boolean(
      evidence.vault?.maxPerTx ||
        evidence.vault?.dailyLimit ||
        evidence.vault?.spentToday ||
        evidence.decision?.status ||
        evidence.execution?.txHash ||
        evidence.execution?.message ||
        evidence.execution?.circleTxId
    );
  }, [evidence]);

  async function handleRun() {
    const intent = draftIntent.trim();
    if (!intent || running) return;

    setRunning(true);

    const runId = `run_${Date.now()}`;
    const ts = nowISO();

    // 1) Push intent event immediately
    setEvents((prev) => [
      ...prev,
      {
        id: `${runId}_intent`,
        stage: "USER_INTENT",
        title: STAGE_LABELS.USER_INTENT,
        timestampISO: ts,
        intent,
      },
    ]);

    // UX: clear input immediately
    setDraftIntent("");

    try {
      // 2) SIMULATE (always for narrative)
      const sim = await postJSON<SimulateOutput>("/api/simulate", { intent });

      setEvents((prev) => [
        ...prev,
        {
          id: `${runId}_simulate`,
          stage: "AGENT_INTERPRETATION",
          title: STAGE_LABELS.AGENT_INTERPRETATION,
          timestampISO: nowISO(),
          output: sim,
        },
      ]);

      if (mode === "SIMULATE") {
        // In SIMULATE mode we intentionally do not show vault/decision/execution.
        setEvidence({});
        return;
      }

      // 3) VALIDATE (server reads vault + deterministic gate) — DO NOT CHANGE CONTRACT
      const val = await postJSON<ValidateOutput>("/api/validate", { simulate: sim });

      setEvents((prev) => [
        ...prev,
        {
          id: `${runId}_validate`,
          stage: "VAULT_VALIDATION",
          title: STAGE_LABELS.VAULT_VALIDATION,
          timestampISO: nowISO(),
          output: val,
        },
      ]);

      // Update evidence with validate result immediately
      setEvidence({
        vault: {
          maxPerTx: val.vault.maxPerTx,
          dailyLimit: val.vault.dailyLimit,
          spentToday: val.vault.spentToday,
        },
        decision: {
          status: val.status,
          reason: val.reason,
        },
        execution: {
          status: val.status === "BLOCKED" ? "BLOCKED" : undefined,
          message:
            val.status === "BLOCKED"
              ? "No execution occurred. Funds did not move."
              : "No execution attempted.",
        },
      });

      if (mode !== "EXECUTE") return;

      // 4) EXECUTE (only if approved)
// 4) EXECUTE (only if approved)
if (mode !== "EXECUTE") return;

if (val.status === "BLOCKED") {
  // Do not call /api/execute. Deterministic gate.
  const blockedPayload = {
    status: "BLOCKED",
    reason: val.reason,
    message: "No execution occurred. Funds did not move.",
  };

  setEvents((prev) => [
    ...prev,
    {
      id: `${runId}_execute_blocked`,
      stage: "EXECUTION",
      title: STAGE_LABELS.EXECUTION,
      timestampISO: nowISO(),
      output: blockedPayload as any,
    },
  ]);

  // Evidence already set above, but ensure message is explicit
  setEvidence((prev) => ({
    ...prev,
    execution: {
      status: "BLOCKED",
      reason: val.reason,
      message: "No execution occurred. Funds did not move.",
    },
  }));

  return;
}

const exe = await postJSON<ExecuteOutput>("/api/execute", {
  intent,
  simulate: sim,
});

// Build a juror-proof payload (no internal notes)
const exePayload =
  exe.status === "APPROVED"
    ? {
        status: "APPROVED",
        circleTxId: exe.circleTxId,
        txHash: exe.txHash,
        arcscan: exe.arcscan,
      }
    : exe.status === "BLOCKED"
    ? {
        status: "BLOCKED",
        reason: exe.reason || "Blocked by on-chain validation gate.",
        message: "No execution occurred. Funds did not move.",
      }
    : {
        status: "ERROR",
        reason: exe.reason || "Execution failed.",
        message: exe.message || "Execution may have failed. See logs.",
      };

setEvents((prev) => [
  ...prev,
  {
    id: `${runId}_execute`,
    stage: "EXECUTION",
    title: STAGE_LABELS.EXECUTION,
    timestampISO: nowISO(),
    output: exePayload as any,
  },
]);

setEvidence((prev) => ({
  ...prev,
  execution: {
    status: exe.status,
    reason: exe.reason,
    message:
      exe.status === "BLOCKED"
        ? "No execution occurred. Funds did not move."
        : exe.message,
    txHash: exe.txHash,
    arcscan: exe.arcscan,
    circleTxId: exe.circleTxId,
  } as any,
}));

    } catch (err: any) {
      setEvents((prev) => [
        ...prev,
        {
          id: `${runId}_error`,
          stage: "ERROR",
          title: STAGE_LABELS.ERROR,
          timestampISO: nowISO(),
          error: String(err?.message || err),
        },
      ]);

      // Also reflect in evidence if useful
      setEvidence((prev) => ({
        ...prev,
        execution: {
          status: "ERROR",
          reason: "Request failed.",
          message: String(err?.message || err),
        },
      }));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-0px)]">
      <ConsoleHeader
        title={CONSOLE_TITLE}
        notice={CONSOLE_NOTICE}
        mode={mode}
        onModeChange={setMode}
      />

      <div className="mx-auto max-w-[1200px] px-4 pb-28 pt-6 md:px-6">
        <div className="grid gap-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <ConsoleTimeline mode={mode} events={events} />

            <div className="mt-6 md:hidden">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className={[
                  "w-full rounded-2xl border border-[var(--border)]",
                  "bg-[rgba(17,24,39,0.35)] px-4 py-3",
                  "text-left text-[13px] text-[var(--text)]",
                  "transition hover:bg-[rgba(17,24,39,0.45)]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <span className="font-[var(--font-display)] tracking-[0.08em]">
                    View Evidence
                  </span>
                  <span className="text-[var(--muted)]">{hasAnyEvidence ? "•" : ""}</span>
                </div>
                <div className="mt-1 text-[12px] text-[var(--muted)]">
                  Vault state, decision, and execution proof.
                </div>
              </button>
            </div>
          </div>

          <div className="hidden md:col-span-5 md:block">
            <EvidencePanel evidence={evidence} />
          </div>
        </div>
      </div>

      <ConsoleComposer
        mode={mode}
        runLabel={running ? "Running…" : RUN_BUTTON_LABEL[mode]}
        intent={draftIntent}
        onIntentChange={setDraftIntent}
        onRun={handleRun}
      />

      <EvidenceDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} evidence={evidence} />
    </div>
  );
}
