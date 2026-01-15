import { encryptEntitySecretCiphertext, getEntityPublicKey, mustEnv } from "./_shared";

async function main() {
  const entitySecretHex = mustEnv("CIRCLE_ENTITY_SECRET_HEX");
  const publicKey = await getEntityPublicKey();

  const ciphertext = encryptEntitySecretCiphertext({
    entitySecretHex,
    entityPublicKey: publicKey,
  });

  console.log("=== ENTITY_SECRET_CIPHERTEXT_BASE64 ===");
  console.log(ciphertext);
  console.log("=== END ===");
}

main().catch((e) => {
  console.error(e?.response?.data ?? e);
  process.exit(1);
});
