import { getEntityPublicKey } from "./_shared";

async function main() {
  const pk = await getEntityPublicKey();
  console.log("Entity publicKey (raw):", pk);
}

main().catch((e) => {
  console.error(e?.response?.data ?? e);
  process.exit(1);
});
