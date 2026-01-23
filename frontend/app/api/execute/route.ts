import { NextResponse } from "next/server";
import AdmZip from "adm-zip";

export const runtime = "nodejs";

type SimulateLike = {
  to?: string;
  amount?: string;
  currency?: string;
  reason?: string;
};

type ValidateResponse = {
  status: "APPROVED_READY" | "BLOCKED";
  reason: string;
  vault: { maxPerTx: string; dailyLimit: string; spentToday: string };
};

type ExecuteOk = {
  status: "APPROVED";
  txHash: string;
  arcscan: string;
  circleTxId?: string | null;
};

type ExecuteBlocked = {
  status: "BLOCKED";
  reason: string;
  message: "No execution occurred. Funds did not move.";
};

type ExecuteError = {
  status: "ERROR";
  reason: string;
  details?: any;
};

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ghFetch(url: string, token: string, init?: RequestInit) {
  const r = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  // GitHub a veces responde vacío en 204
  const text = await r.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!r.ok) {
    throw new Error(
      `GitHub API failed ${r.status}: ${typeof json === "string" ? json : JSON.stringify(json)}`
    );
  }
  return json;
}

async function dispatchWorkflow(params: {
  token: string;
  owner: string;
  repo: string;
  workflowFile: string;
  ref: string;
  inputs: Record<string, string>;
}) {
  const { token, owner, repo, workflowFile, ref, inputs } = params;

  // POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches
  // 204 No Content si OK
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(
    workflowFile
  )}/dispatches`;

  const r = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref, inputs }),
    cache: "no-store",
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`workflow_dispatch failed ${r.status}: ${txt}`);
  }
}

async function findLatestRunAfter(params: {
  token: string;
  owner: string;
  repo: string;
  workflowFile: string;
  startedAtMs: number;
}) {
  const { token, owner, repo, workflowFile, startedAtMs } = params;

  // List runs for a workflow
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(
    workflowFile
  )}/runs?per_page=10`;

  // poll until we find a run created after dispatch time (fuzzy)
  const startISO = new Date(startedAtMs - 5000).toISOString(); // 5s tolerance
  for (let i = 0; i < 25; i++) {
    const data = await ghFetch(url, token);
    const runs: any[] = data?.workflow_runs || [];
    const run = runs.find((r) => (r?.created_at || "") >= startISO);

    if (run?.id) return run;
    await sleep(1200);
  }

  throw new Error("Could not locate GitHub Actions run after dispatch.");
}

async function waitForRunCompletion(params: {
  token: string;
  owner: string;
  repo: string;
  runId: number;
}) {
  const { token, owner, repo, runId } = params;
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`;

  for (let i = 0; i < 120; i++) {
    const run = await ghFetch(url, token);

    const status = run?.status; // queued | in_progress | completed
    const conclusion = run?.conclusion; // success | failure | cancelled | ...

    if (status === "completed") return run;

    await sleep(2500);
  }

  throw new Error("Timed out waiting for workflow run completion.");
}

async function downloadArtifactZip(params: {
  token: string;
  owner: string;
  repo: string;
  runId: number;
  artifactName: string;
}) {
  const { token, owner, repo, runId, artifactName } = params;

  const listUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`;

  const artifactsData = await ghFetch(listUrl, token);
  const artifacts: any[] = artifactsData?.artifacts || [];

  const art = artifacts.find((a) => a?.name === artifactName && !a?.expired);
  if (!art?.id) {
    const names = artifacts.map((a) => a?.name).filter(Boolean);
    throw new Error(`Artifact "${artifactName}" not found. Available: ${names.join(", ") || "none"}`);
  }

  // Download zip (302 redirect sometimes). Use the "zip" endpoint:
  const zipUrl = `https://api.github.com/repos/${owner}/${repo}/actions/artifacts/${art.id}/zip`;

  const r = await fetch(zipUrl, {
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Artifact download failed ${r.status}: ${txt}`);
  }

  const buf = Buffer.from(await r.arrayBuffer());
  return buf;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      simulate?: SimulateLike;
    };

    const to = body?.simulate?.to;
    const amount = body?.simulate?.amount;

    if (!to || typeof to !== "string" || !to.startsWith("0x")) {
      return NextResponse.json({ error: "Missing simulate.to" }, { status: 400 });
    }
    if (!amount || typeof amount !== "string") {
      return NextResponse.json({ error: "Missing simulate.amount" }, { status: 400 });
    }

    // --- Gate: reuse your existing validate (NO changes to validate code)
    const validateRes = await fetch(new URL("/api/validate", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simulate: { amount } }),
      cache: "no-store",
    });

    const validateJson = (await validateRes.json().catch(() => null)) as ValidateResponse | any;

    if (!validateRes.ok) {
      return NextResponse.json(
        { status: "ERROR", reason: "Validate failed before execute.", details: validateJson },
        { status: 502 }
      );
    }

    if (validateJson?.status !== "APPROVED_READY") {
      const out: ExecuteBlocked = {
        status: "BLOCKED",
        reason: validateJson?.reason || "Blocked by validation gate.",
        message: "No execution occurred. Funds did not move.",
      };
      return NextResponse.json(out);
    }

    // --- Dispatch GitHub Actions
    const token = mustEnv("GITHUB_TOKEN");
    const owner = mustEnv("GITHUB_OWNER");
    const repo = mustEnv("GITHUB_REPO");
    const workflowFile = mustEnv("GITHUB_WORKFLOW_FILE"); // e.g. circle_spend_vault.yml
    const ref = process.env.GITHUB_REF || "main";

    const startedAtMs = Date.now();

    await dispatchWorkflow({
      token,
      owner,
      repo,
      workflowFile,
      ref,
      inputs: {
        to,
        amount,
      },
    });

    // Find the run we just created
    const run = await findLatestRunAfter({
      token,
      owner,
      repo,
      workflowFile,
      startedAtMs,
    });

    // Wait for completion
    const completed = await waitForRunCompletion({
      token,
      owner,
      repo,
      runId: run.id,
    });

    if (completed?.conclusion !== "success") {
      return NextResponse.json(
        {
          status: "ERROR",
          reason: `Workflow did not succeed (conclusion=${completed?.conclusion || "unknown"}).`,
          details: {
            runId: run.id,
            html_url: completed?.html_url,
          },
        } satisfies ExecuteError,
        { status: 502 }
      );
    }

    // Download artifact and parse circle_result.json
    const zipBuf = await downloadArtifactZip({
      token,
      owner,
      repo,
      runId: run.id,
      artifactName: "aegis-circle-result",
    });

    const zip = new AdmZip(zipBuf);
    const entry = zip.getEntry("circle_result.json");
    if (!entry) {
      const entries = zip.getEntries().map((e) => e.entryName);
      return NextResponse.json(
        {
          status: "ERROR",
          reason: "circle_result.json not found inside artifact zip.",
          details: { entries },
        } satisfies ExecuteError,
        { status: 502 }
      );
    }

    const raw = zip.readAsText(entry);
    const parsed = JSON.parse(raw) as { txHash?: string; arcscan?: string; circleTxId?: string };

    if (!parsed?.txHash || !parsed?.arcscan) {
      return NextResponse.json(
        {
          status: "ERROR",
          reason: "Artifact JSON missing txHash/arcscan.",
          details: parsed,
        } satisfies ExecuteError,
        { status: 502 }
      );
    }

    const ok: ExecuteOk = {
      status: "APPROVED",
      txHash: parsed.txHash,
      arcscan: parsed.arcscan,
      circleTxId: parsed.circleTxId ?? null,
    };

    return NextResponse.json(ok);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unhandled error", details: String(err?.stack || err) },
      { status: 500 }
    );
  }
}

