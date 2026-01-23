export function safeTrim(s: unknown): string {
  return typeof s === "string" ? s.trim() : "";
}

export function isHexAddress(s: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(s);
}

export function isHexTx(s: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(s);
}

export function shortHex(s: string, left = 6, right = 4): string {
  if (!s || s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}…${s.slice(-right)}`;
}

export function asString(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}
