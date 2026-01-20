import { z } from "zod";

/**
 * Decisión producida por Gemini (JSON estricto).
 * - amount: minor units (USDC 6 decimales)
 * - tolera number o string y lo normaliza a string
 */
export const SimulateDecisionSchema = z.object({
  to: z.string(),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  currency: z.literal("USDC"),
  reason: z.string(),
  reason_model: z.string().optional(),
});

export type SimulateDecision = z.infer<typeof SimulateDecisionSchema>;
