import { spawn } from "child_process";
import https from "https";

function checkRpc(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: [],
      id: 1,
    });

    const req = https.request(
      url,
      { method: "POST", headers: { "Content-Type": "application/json" } },
      (res) => {
        resolve(res.statusCode === 200);
      }
    );

    req.on("error", () => resolve(false));
    req.write(data);
    req.end();
  });
}

async function main() {
  const primary = process.env.ARC_TESTNET_RPC_PRIMARY!;
  const fallbacks = (process.env.ARC_TESTNET_RPC_FALLBACKS || "").split(",");

  const candidates = [primary, ...fallbacks].filter(Boolean);

  for (const rpc of candidates) {
    process.stdout.write(`🔍 Probing RPC: ${rpc} ... `);
    const ok = await checkRpc(rpc);
    console.log(ok ? "OK" : "FAIL");

    if (ok) {
      console.log(`✅ Using RPC: ${rpc}`);
      const cmd = process.argv.slice(2);
      if (!cmd.length) {
        console.log("No command provided. RPC selected only.");
        return;
      }

      const child = spawn(cmd[0], cmd.slice(1), {
        stdio: "inherit",
        env: { ...process.env, ARC_TESTNET_RPC_URL: rpc },
      });

      child.on("exit", (code) => process.exit(code ?? 0));
      return;
    }
  }

  console.error("❌ No available Arc Testnet RPCs");
  process.exit(1);
}

main();
