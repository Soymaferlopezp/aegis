export function arcscanTxLink(txHash: string): string {
  const base = process.env.ARC_EXPLORER_TX || "https://testnet.arcscan.app/tx/";
  return `${base}${txHash}`;
}
