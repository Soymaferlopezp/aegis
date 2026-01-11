import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Hello = await ethers.getContractFactory("HelloAegis");
  const hello = await Hello.deploy();
  await hello.waitForDeployment();

  const address = await hello.getAddress();
  const tx = hello.deploymentTransaction();

  console.log("HelloAegis deployed to:", address);
  if (tx?.hash) console.log("Tx:", tx.hash);

  const explorer =
    process.env.ARC_EXPLORER_URL || "https://testnet.arcscan.app";

  console.log("Explorer contract:", `${explorer}/address/${address}`);
  if (tx?.hash) console.log("Explorer tx:", `${explorer}/tx/${tx.hash}`);

  // ---- NEW: persist deployment ----
  const outDir = path.join(process.cwd(), "deployments");
  const outFile = path.join(outDir, "arcTestnet.json");

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const payload = {
    network: "arcTestnet",
    updatedAt: new Date().toISOString(),
    helloAegis: {
      address,
      deployer: deployer.address,
      deployTx: tx?.hash ?? null,
      explorer
    }
  };

  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log("Deployment saved to:", outFile);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
