import {
  circlePost,
  encryptEntitySecretCiphertext,
  getEntityPublicKey,
  mustEnv,
  uuidv4,
} from "./_shared";

type ContractExecResponse = { data: { id: string; state: string } };

async function main() {
  const vault = mustEnv("VAULT_ADDRESS");
  const walletId = mustEnv("CIRCLE_WALLET_ID_AGENT");
  const blockchain = process.env.CIRCLE_BLOCKCHAIN ?? "ARC";

  // Confirmado por Lead:
  // function spend(address to, uint256 amount) external onlyAgent
  const abiFunctionSignature = "spend(address,uint256)";

  // SPEND_ABI_PARAMS_JSON='["0xDEST...","1000000"]'
  const abiParametersRaw = mustEnv("SPEND_ABI_PARAMS_JSON");
  const abiParameters = JSON.parse(abiParametersRaw);

  if (!Array.isArray(abiParameters) || abiParameters.length !== 2) {
    throw new Error(
      `SPEND_ABI_PARAMS_JSON must be JSON array with 2 elements: ["0xDEST...","amount"]`
    );
  }

  const [to, amount] = abiParameters;

  const entitySecretHex = mustEnv("CIRCLE_ENTITY_SECRET_HEX");
  const publicKey = await getEntityPublicKey();
  const entitySecretCiphertext = encryptEntitySecretCiphertext({
    entitySecretHex,
    entityPublicKey: publicKey,
  });

  const body = {
    idempotencyKey: uuidv4(),
    blockchain,
    walletId,
    contractAddress: vault,
    abiFunctionSignature,
    abiParameters: [String(to), String(amount)],
    feeLevel: "MEDIUM",
    entitySecretCiphertext,
  };

  const res = await circlePost<ContractExecResponse>(
    "/developer/transactions/contractExecution",
    body
  );

  console.log("✅ Created spend() contractExecution tx:");
  console.log("circleTxId:", res.data.id);
  console.log("state:", res.data.state);
  console.log("\n➡️  Next:");
  console.log("CIRCLE_TX_ID=<id> npx ts-node scripts/circle/06_waitTx.ts");
}

main().catch((e) => {
  console.error(e?.response?.data ?? e);
  process.exit(1);
});
