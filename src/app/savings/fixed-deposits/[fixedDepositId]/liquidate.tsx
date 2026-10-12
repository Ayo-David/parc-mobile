import { randomUUID } from "expo-crypto";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import type { FixedDepositQuoteResult } from "@/api/schemas";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

/**
 * Figma "FD 02 — Liquidate Early" (node 430:273, missing-mobile.md §7) —
 * the exact "disclose the penalty before confirming" gap that screen was
 * built to close. The previous version of this screen fetched the real
 * quote (`penalty_minor`/`payout_minor`, both fully typed) and then
 * immediately liquidated without ever showing them. This screen shows the
 * real figures first and only submits on explicit confirmation.
 */
export default function FixedDepositLiquidateScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { fixedDepositId } = useLocalSearchParams<{ fixedDepositId: string }>();
  const [quote, setQuote] = useState<FixedDepositQuoteResult | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getFixedDepositLiquidationQuote({ fixedDepositId, correlationId: randomUUID() })
      .then((result) => {
        if (!cancelled) setQuote(result);
      })
      .catch((quoteError) => {
        if (!cancelled) setError(quoteError instanceof ApiError ? quoteError.message : "We couldn't calculate your liquidation quote. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingQuote(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fixedDepositId]);

  async function handleLiquidate() {
    if (!quote) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const settlement = await api.liquidateFixedDeposit({ fixedDepositId, quoteId: quote.quote_id, quoteHash: quote.quote_hash, correlationId: randomUUID(), idempotencyKey: createIdempotencyKey() });
      router.replace({
        pathname: "/savings/success",
        params: { title: "Fixed Deposit Liquidated", amountMinor: settlement.payout_minor, currency: settlement.currency, detail: "Paid out to your Parc wallet" },
      });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't confirm this went through. Please check your savings tab before trying again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    warningCard: {
      backgroundColor: theme.components.status.error.backgroundColor,
      borderRadius: theme.radii.lg,
      padding: theme.semanticSpacing.form,
      gap: theme.spacing.xs,
    },
    warningTitle: { ...theme.typography.text13Bold, color: theme.colors.error },
    warningBody: { ...theme.typography.text12Regular, color: theme.colors.textSecondary },
    error: { ...theme.typography.text12Regular, color: theme.colors.error, marginTop: theme.semanticSpacing.form },
    footer: { marginTop: "auto" as const, paddingBottom: theme.semanticSpacing.section },
  });

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: "Liquidate Fixed Deposit" }} />
      <View style={styles.content}>
        {isLoadingQuote ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : quote ? (
          <>
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>You&apos;ll pay an early-liquidation penalty</Text>
              <Text style={styles.warningBody}>
                A penalty of {formatMoney({ amount_minor: quote.penalty_minor, currency: quote.currency })} applies to your accrued interest (expected interest at maturity was{" "}
                {formatMoney({ amount_minor: quote.expected_interest_minor, currency: quote.currency })}). You&apos;ll receive {formatMoney({ amount_minor: quote.payout_minor, currency: quote.currency })} in total today.
              </Text>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.footer}>
              <Button label="Liquidate now" variant="destructive" onPress={handleLiquidate} loading={isSubmitting} />
            </View>
          </>
        ) : (
          <Text style={styles.error}>{error ?? "We couldn't calculate your liquidation quote."}</Text>
        )}
      </View>
    </ScreenContainer>
  );
}
