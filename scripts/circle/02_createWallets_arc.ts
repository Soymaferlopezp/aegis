import {
  circlePost,
  encryptEntitySecretCiphertext,
  getEntityPublicKey,
  mustEnv,
  uuidv4,
} from "./_shared";

type CreateWalletsResponse = {
  data: {
    wallets: Array<{
      id: string;
      address: string;
      blockchain: string;
      walletSetId: string;
      accountType: "EOA" | "SCA";
    }>;
  };
};

async function main() {
  const walletSetId = mustEnv("CIRCLE_WALLET_SET_ID");
  const blockchain = process.env.CIRCLE_BLOCKCHAIN ?? "ARC";

  const entitySecretHex = mustEnv("CIRCLE_ENTITY_SECRET_HEX");
  const publicKey = await getEntityPublicKey();
  const entitySecretCiphertext = encryptEntitySecretCiphertext({
    entitySecretHex,
    entityPublicKey: publicKey,
  });

  const body = {
    idempotencyKey: uuidv4(),
    walletSetId,
    accountType: "EOA",
    blockchains: [blockchain],
    count: 2, // agente + receiver
    entitySecretCiphertext,
  };

  const res = await circlePost<CreateWalletsResponse>("/developer/wallets", body);

  console.log("✅ Created wallets:");
  res.data.wallets.forEach((w, i) => {
    console.log(
      `  [${i}] id=${w.id} address=${w.address} chain=${w.blockchain} type=${w.accountType}`
    );
  });

  console.log("\n➡️  Guarda en .env:");
  console.log("CIRCLE_WALLET_ID_AGENT=", res.data.wallets[0]?.id);
  console.log("CIRCLE_WALLET_ID_RECEIVER=", res.data.wallets[1]?.id);
  console.log("\n➡️  Guarda en .env también:");
  console.log("DESTINATION_ADDRESS=", res.data.wallets[1]?.address);
  console.log("\n🎯 Entregable: Agent address =", res.data.wallets[0]?.address);
}

main().catch((e) => {
  console.error(e?.response?.data ?? e);
  process.exit(1);
});
