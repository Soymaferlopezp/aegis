import AdmZip from "adm-zip";

type DispatchArgs = {
  to: string;
  amount: string;
};

type ExecuteResult = {
  circleTxId?: string | null;
  txHash?: string | null;
  arcscan?: string | null;
};

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function dispatchCircleSpendWorkflow(args: DispatchArgs) {
  const token = mustEnv("GITHUB_TOKEN");
  const owner = mustEnv("GITHUB_OWNER");
  const repo = mustEnv("GITHUB_REPO");
  const workflowFile = mustEnv("GITHUB_WORKFLOW_FILE");

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;

  const r = await fetch(url, {
    method: "POST",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      ref: "main",
      inputs: {
        to: args.to,
        amount: args.amount,
      },
    }),
  });

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`workflow_dispatch failed (${r.status}): ${t}`);
  }
}

async function findLatestRunForWorkflow(): Promise<any> {
  const token = mustEnv("GITHUB_TOKEN");
  const owner = mustEnv("GITHUB_OWNER");
  const repo = mustEnv("GITHUB_REPO");
  const workflowFile = mustEnv("GITHUB_WORKFLOW_FILE");

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?per_page=5`;

  const r = await fetch(url, { headers: ghHeaders(token) });
  const raw = await r.json().catch(() => ({}));

  const run = raw?.workflow_runs?.[0];
  if (!run) throw new Error(`No workflow runs found for ${workflowFile}`);
  return run;
}

async function getRun(runId: number): Promise<any> {
  const token = mustEnv("GITHUB_TOKEN");
  const owner = mustEnv("GITHUB_OWNER");
  const repo = mustEnv("GITHUB_REPO");

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`;
  const r = await fetch(url, { headers: ghHeaders(token) });
  const raw = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`getRun failed (${r.status}): ${JSON.stringify(raw)}`);
  return raw;
}

async function getArtifacts(runId: number): Promise<any[]> {
  const token = mustEnv("GITHUB_TOKEN");
  const owner = mustEnv("GITHUB_OWNER");
  const repo = mustEnv("GITHUB_REPO");

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`;
  const r = await fetch(url, { headers: ghHeaders(token) });
  const raw = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`getArtifacts failed (${r.status}): ${JSON.stringify(raw)}`);
  return raw?.artifacts || [];
}

async function downloadArtifactZip(archiveDownloadUrl: string): Promise<Buffer> {
  const token = mustEnv("GITHUB_TOKEN");

  const r = await fetch(archiveDownloadUrl, { headers: ghHeaders(token) });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`download artifact failed (${r.status}): ${t}`);
  }
  const arr = await r.arrayBuffer();
  return Buffer.from(arr);
}

export async function pollForCircleResultArtifact(opts?: {
  timeoutMs?: number;
  pollMs?: number;
  artifactName?: string; // default: aegis-circle-result
  jsonFileName?: string; // default: circle_result.json
}): Promise<ExecuteResult> {
  const timeoutMs = opts?.timeoutMs ?? 12 * 60_000;
  const pollMs = opts?.pollMs ?? 4000;
  const artifactName = opts?.artifactName ?? "aegis-circle-result";
  const jsonFileName = opts?.jsonFileName ?? "circle_result.json";

  // After dispatch, the newest run should be ours. We'll watch it until completion.
  const latest = await findLatestRunForWorkflow();
  const runId = latest.id as number;

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const run = await getRun(runId);

    if (run.status === "completed") {
      if (run.conclusion !== "success") {
        throw new Error(`Workflow completed with conclusion=${run.conclusion}`);
      }

      const artifacts = await getArtifacts(runId);
      const target = artifacts.find((a) => a?.name === artifactName);
      if (!target) {
        throw new Error(`Artifact "${artifactName}" not found on successful run`);
      }

      const zipBuf = await downloadArtifactZip(target.archive_download_url);
      const zip = new AdmZip(zipBuf);
      const entry = zip.getEntry(jsonFileName);
      if (!entry) throw new Error(`JSON file "${jsonFileName}" not found inside artifact zip`);

      const jsonText = zip.readAsText(entry);
      const parsed = JSON.parse(jsonText);

      return {
        circleTxId: parsed?.circleTxId ?? null,
        txHash: parsed?.txHash ?? null,
        arcscan: parsed?.arcscan ?? null,
      };
    }

    await sleep(pollMs);
  }

  throw new Error("Timed out polling workflow result");
}
