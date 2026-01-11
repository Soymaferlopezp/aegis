import { ethers } from "hardhat";

async function main() {
  const address = process.env.HELLO_ADDRESS;
  if (!address) {
    throw new Error("HELLO_ADDRESS env var not set");
  }

  const hello = await ethers.getContractAt("HelloAegis", address);

  const tx = await hello.ping();
  const receipt = await tx.wait();

  console.log("Ping tx:", receipt?.hash);

  const explorer = process.env.ARC_EXPLORER_URL || "https://testnet.arcscan.app";
  console.log("Explorer tx:", `${explorer}/tx/${receipt?.hash}`);
  console.log("Explorer contract:", `${explorer}/address/${address}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
