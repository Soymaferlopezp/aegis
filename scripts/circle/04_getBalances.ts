import { circleGet, mustEnv } from "./_shared";

type BalancesResponse = {
  data: {
    tokenBalances: Array<{
      token: {
        id: string;
        symbol?: string;
        name?: string;
        blockchain?: string;
        tokenAddress?: string;
      };
      amount: string;
    }>;
  };
};

async function main() {
  const walletId = mustEnv("CIRCLE_WALLET_ID_AGENT");

  const res = await circleGet<BalancesResponse>(`/wallets/${walletId}/balances`);

  console.log(`Balances for walletId=${walletId}`);
  res.data.tokenBalances.forEach((b) => {
    console.log(
      `- tokenId=${b.token.id} symbol=${b.token.symbol ?? "?"} chain=${b.token.blockchain ?? "?"} tokenAddress=${b.token.tokenAddress ?? "?"} amount=${b.amount}`
    );
  });

  console.log("\n➡️  Copia el tokenId de USDC y ponlo en .env como TOKEN_ID_USDC=...");
}

main().catch((e) => {
  console.error(e?.response?.data ?? e);
  process.exit(1);
});
