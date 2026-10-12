import { useLocalSearchParams, useRouter } from "expo-router";

import { TransactionResultLayout } from "@/components/TransactionResultLayout/TransactionResultLayout";

/**
 * Figma "Savings 02 — Action Successful" (node 431:158, missing-mobile.md
 * §7) — one shared success screen for every Savings action (goal
 * withdrawal, break goal, FD liquidation, FD instruction change, auto-save
 * setup), matching the pattern already established for Transfers/Bills
 * (MOB-15's `TransactionResultLayout`) rather than each action inventing
 * its own confirmation copy inline. Params are plain display strings the
 * calling screen already computed from a real API response — nothing here
 * is fabricated.
 */
export default function SavingsActionSuccessScreen() {
  const router = useRouter();
  const { title, amountMinor, currency, detail } = useLocalSearchParams<{ title: string; amountMinor?: string; currency?: string; detail?: string }>();

  return (
    <TransactionResultLayout
      tone="success"
      title={title ?? "Action Successful!"}
      money={amountMinor && currency ? { amount_minor: amountMinor, currency } : undefined}
      detailLines={detail ? [detail] : undefined}
      primaryAction={{ label: "Done", onPress: () => router.replace("/(tabs)/savings") }}
    />
  );
}
