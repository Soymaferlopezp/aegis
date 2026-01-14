import {
  circlePost,
  encryptEntitySecretCiphertext,
  getEntityPublicKey,
  mustEnv,
  uuidv4,
} from "./_shared";

type CreateWalletSetResponse = {
  data: { walletSet: { id: string; name: string } };
};

async function main() {
  const entitySecretHex = mustEnv("CIRCLE_ENTITY_SECRET_HEX");
  const publicKey = await getEntityPublicKey();

  const entitySecretCiphertext = encryptEntitySecretCiphertext({
    entitySecretHex,
    entityPublicKey: publicKey,
  });

  const body = {
    idempotencyKey: uuidv4(),
    name: `Aegis-Agent-WalletSet-${Date.now()}`,
    entitySecretCiphertext,
  };

  const res = await circlePost<CreateWalletSetResponse>(
    "/developer/walletSets",
    body
  );

  const walletSetId = res.data.walletSet.id;
  console.log("✅ walletSetId:", walletSetId);
  console.log("➡️  Guarda en .env: CIRCLE_WALLET_SET_ID=", walletSetId);
}

main().catch((e) => {
  console.error(e?.response?.data ?? e);
  process.exit(1);
});
