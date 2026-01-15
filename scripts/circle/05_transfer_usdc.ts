import {
  circlePost,
  encryptEntitySecretCiphertext,
  getEntityPublicKey,
  mustEnv,
  uuidv4,
} from "./_shared";

type TransferResponse = { data: { id: string; state: string } };

async function main() {
  const fromWalletId = mustEnv("CIRCLE_WALLET_ID_AGENT");
  const destinationAddress = mustEnv("DESTINATION_ADDRESS");
  const tokenId = mustEnv("TOKEN_ID_USDC");

  const amount = "1"; // ajusta si el faucet da menos/más

  const entitySecretHex = mustEnv("CIRCLE_ENTITY_SECRET_HEX");
  const publicKey = await getEntityPublicKey();
  const entitySecretCiphertext = encryptEntitySecretCiphertext({
    entitySecretHex,
    entityPublicKey: publicKey,
  });

  const body = {
    idempotencyKey: uuidv4(),
    walletId: fromWalletId,
    destinationAddress,
    tokenId,
    amounts: [amount],
    feeLevel: "MEDIUM",
    entitySecretCiphertext,
  };

  const res = await circlePost<TransferResponse>(
    "/developer/transactions/transfer",
    body
  );

  console.log("✅ Created transfer tx:");
  console.log("circleTxId:", res.data.id);
  console.log("state:", res.data.state);
  console.log("\n➡️  Ahora corre:");
  console.log("CIRCLE_TX_ID=<id> npx ts-node scripts/circle/06_waitTx.ts");
}

main().catch((e) => {
  console.error(e?.response?.data ?? e);
  process.exit(1);
});
