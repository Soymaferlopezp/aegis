import axios from "axios";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

type GHRun = {
  id: number;
  status: string; // queued | in_progress | completed
  conclusion: string | null; // success | failure | cancelled | ...
  created_at: string;
};

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function step(name: string, data?: any) {
  const payload = data ? ` ${JSON.stringify(data)}` : "";
  console.error(`[${new Date().toISOString()}] STEP ${name}${payload}`);
}

function ghClient() {
  const token = mustEnv("GITHUB_TOKEN");
  return axios.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      Accept: "application/vnd.github+json",
    },
    timeout: 60_000,
  });
}

function parseRepo(): { owner: string; repo: string } {
  const repoFull = mustEnv("GITHUB_REPO");
  const [owner, repo] = repoFull.split("/");
  if (!owner || !repo) throw new Error(`GITHUB_REPO must be like "owner/repo". Got: ${repoFull}`);
  return { owner, repo };
}

async function dispatchWorkflow(workflowFile: string, ref: string, inputs: Record<string, string>) {
  const { owner, repo } = parseRepo();
  const gh = ghClient();

  step("gh.dispatch.start", { workflowFile, ref, inputs });

  // 204 No Content on success
  await gh.post(`/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`, {
    ref,
    inputs,
  });

  step("gh.dispatch.ok");
}

async function listRecentRuns(workflowFile: string): Promise<GHRun[]> {
  const { owner, repo } = parseRepo();
  const gh = ghClient();

  const res = await gh.get(`/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs`, {
    params: { per_page: 10 },
  });

  return (res.data?.workflow_runs ?? []) as GHRun[];
}

function isoToMs(iso: string): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return t;
}

/**
 * Encuentra el run disparado por workflow_dispatch después del dispatch.
 * Usamos created_at >= dispatchedAt - 10s como tolerancia (clock skew).
 */
async function waitForDispatchedRun(workflowFile: string, dispatchedAtIso: string): Promise<number> {
  const dispatchedAtMs = isoToMs(dispatchedAtIso);
  const threshold = dispatchedAtMs - 10_000;

  for (let i = 0; i < 90; i++) {
    const runs = await listRecentRuns(workflowFile);

    const candidates = runs
      .filter((r) => isoToMs(r.created_at) >= threshold)
      .sort((a, b) => isoToMs(b.created_at) - isoToMs(a.created_at));

    const newest = candidates[0];

    step("gh.poll.runs", {
      iter: i,
      total: runs.length,
      candidates: candidates.length,
      newestId: newest?.id ?? null,
      newestStatus: newest?.status ?? null,
      newestCreatedAt: newest?.created_at ?? null,
    });

    if (newest?.id) return newest.id;

    await sleep(3000);
  }

  throw new Error("Timeout waiting for GitHub Actions run to appear after dispatch");
}

async function waitForRunCompletion(runId: number): Promise<void> {
  const { owner, repo } = parseRepo();
  const gh = ghClient();

  step("gh.run.url", { url: `https://github.com/${owner}/${repo}/actions/runs/${runId}` });

  for (let i = 0; i < 240; i++) {
    const res = await gh.get(`/repos/${owner}/${repo}/actions/runs/${runId}`);
    const status = res.data?.status as string;
    const conclusion = res.data?.conclusion as string | null;

    step("gh.poll.run_status", { iter: i, runId, status, conclusion });

    if (status === "completed") {
      if (conclusion !== "success") {
        throw new Error(`GitHub Actions run completed with conclusion=${conclusion ?? "null"}`);
      }
      step("gh.run.success", { runId });
      return;
    }

    await sleep(5000);
  }

  throw new Error("Timeout waiting for GitHub Actions run completion");
}

async function downloadResultArtifact(
  runId: number
): Promise<{ circleTxId: string; txHash: string; arcscan: string }> {
  const { owner, repo } = parseRepo();
  const gh = ghClient();

  step("gh.artifact.list", { runId });

  const list = await gh.get(`/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`);
  const artifacts = list.data?.artifacts ?? [];
  const artifact = artifacts.find((a: any) => a?.name === "aegis-circle-result");

  step("gh.artifact.found", { found: Boolean(artifact), count: artifacts.length });

  if (!artifact) {
    throw new Error(`Artifact "aegis-circle-result" not found for runId=${runId}`);
  }

  const zipUrl = artifact.archive_download_url as string;

  step("gh.artifact.download.start");

  const zipRes = await gh.get(zipUrl, { responseType: "arraybuffer" });

  const tmpDir = path.join(process.cwd(), ".tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  const zipPath = path.join(tmpDir, `aegis-circle-result-${runId}.zip`);
  fs.writeFileSync(zipPath, Buffer.from(zipRes.data));

  step("gh.artifact.download.ok", { zipPath });

  const zip = new AdmZip(zipPath);
  const entry = zip.getEntry("circle_result.json");
  if (!entry) throw new Error(`circle_result.json not found inside artifact zip (runId=${runId})`);

  const jsonStr = zip.readAsText(entry);

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Invalid JSON in circle_result.json: ${jsonStr.slice(0, 200)}`);
  }

  const circleTxId = String(parsed?.circleTxId ?? "").trim();
  const txHash = String(parsed?.txHash ?? "").trim();
  const arcscan = String(parsed?.arcscan ?? "").trim();

  if (!circleTxId || !txHash || !arcscan) {
    throw new Error(`circle_result.json missing fields: ${jsonStr}`);
  }

  step("gh.artifact.parsed.ok");

  return { circleTxId, txHash, arcscan };
}

export async function runCircleSpendViaGitHubActions(params: { to: string; amount: string }) {
  const workflowFile = process.env.GITHUB_WORKFLOW_FILE || "circle_spend_vault.yml";
  const ref = process.env.GITHUB_REF || "main";

  const dispatchedAtIso = new Date().toISOString();

  await dispatchWorkflow(workflowFile, ref, {
    to: params.to,
    amount: params.amount,
  });

  const runId = await waitForDispatchedRun(workflowFile, dispatchedAtIso);

  await waitForRunCompletion(runId);

  return await downloadResultArtifact(runId);
}
