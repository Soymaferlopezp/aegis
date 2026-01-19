import { spawn } from "child_process";

export type SubprocessResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

const isWin = process.platform === "win32";

/**
 * Ejecuta un subprocess de forma cross-platform.
 * - En Windows: usa npx.cmd
 * - En *nix: usa npx
 */
export async function runSubprocess(params: {
  cmd: string;
  args: string[];
  env: Record<string, string | undefined>;
}): Promise<SubprocessResult> {
  return new Promise((resolve) => {
    const command =
      isWin && params.cmd === "npx" ? "npx.cmd" : params.cmd;

    const child = spawn(command, params.args, {
      env: { ...process.env, ...params.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => {
      stdout += d.toString("utf8");
    });

    child.stderr.on("data", (d) => {
      stderr += d.toString("utf8");
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

/**
 * Extrae el circleTxId desde stdout de:
 * console.log("circleTxId:", res.data.id);
 *
 * Patrón exacto:
 *   circleTxId: <id>
 */
export function parseCircleTxId(stdout: string): string | null {
  const match = stdout.match(/circleTxId:\s*([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

/**
 * Extrae el txHash on-chain desde stdout de 06_waitTx.ts
 *
 * Patrón exacto:
 *   ✅ On-chain txHash: <0x...>
 */
export function parseOnChainTxHash(stdout: string): string | null {
  const match = stdout.match(
    /✅ On-chain txHash:\s*(0x[a-fA-F0-9]{64})/
  );
  return match ? match[1] : null;
}
