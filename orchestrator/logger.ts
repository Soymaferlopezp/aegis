export function step(name: string, data?: Record<string, any>) {
  const ts = new Date().toISOString();
  const payload = data ? ` ${JSON.stringify(data)}` : "";
  process.stderr.write(`[${ts}] STEP ${name}${payload}\n`);
}

export function errorLog(name: string, err: unknown) {
  const ts = new Date().toISOString();
  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
  process.stderr.write(`[${ts}] ERROR ${name} ${msg}\n`);
}
