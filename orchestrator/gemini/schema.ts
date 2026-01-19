import { z } from "zod";

export const SimulateDecisionSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string().regex(/^\d+$/), // minor units (6 decimals), integer string
  currency: z.literal("USDC"),
  reason: z.string().min(1) // model reason (simulate)
});

export type SimulateDecision = z.infer<typeof SimulateDecisionSchema>;
