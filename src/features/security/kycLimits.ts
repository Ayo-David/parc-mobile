/**
 * Static reference data, not a computed/fetched value — no endpoint
 * anywhere returns per-tier limits to the mobile app (`GET /v1/bootstrap`
 * doesn't include them, and `GET /v1/profile` only returns the customer's
 * own `kyc_tier` number). Sourced directly from `parc-interview-answers.md`
 * §12 ("KYC tiers"), the confirmed business-rule document, not from
 * Figma's own sample numbers on "System 08 — KYC Tier & Limits" (node
 * 436:492), which differ and aren't the authoritative source. Displaying
 * fixed tenant policy text isn't "computing money" (AGENTS.md's rule
 * against duplicating financial business logic) — it's reference copy,
 * same category as onboarding's static PEP-disclosure text — but it will
 * drift if the real tenant ever changes these values, since there's no
 * live source to refresh from. Flagged in PLAN.md for replacement once/if
 * `GET /v1/bootstrap` exposes tier limits server-side.
 */
export interface KycTierLimit {
  tier: 1 | 2 | 3;
  label: string;
  dailyTransactionLimitNaira: string;
  balanceLimitNaira: string | null;
}

export const KYC_TIER_LIMITS: KycTierLimit[] = [
  { tier: 1, label: "Tier 1 – Basic", dailyTransactionLimitNaira: "₦50,000", balanceLimitNaira: "₦300,000" },
  { tier: 2, label: "Tier 2 – Standard", dailyTransactionLimitNaira: "₦200,000", balanceLimitNaira: "₦500,000" },
  { tier: 3, label: "Tier 3 – Full", dailyTransactionLimitNaira: "₦5,000,000", balanceLimitNaira: null },
];

export function kycLimitForTier(tier: number | undefined): KycTierLimit | undefined {
  return KYC_TIER_LIMITS.find((entry) => entry.tier === tier);
}
