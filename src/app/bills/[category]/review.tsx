import { randomUUID } from "expo-crypto";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useProfile } from "@/api/queries/useProfile";
import { useWalletSourceAccount } from "@/api/queries/useWalletSourceAccount";
import type { BillCategory } from "@/api/schemas";
import { Button } from "@/components/Button/Button";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TransactionPinSheet } from "@/components/TransactionPinSheet/TransactionPinSheet";
import { useBillDraftStore } from "@/features/bills/billDraftStore";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

/**
 * Figma's own review step is really just the amount + summary rows shown
 * inside the "Use Payment PIN" bottom sheet (node 233:9806) — a modal, not
 * a separate full screen. This keeps the existing full-screen review (so
 * `TransactionPinSheet`, already a real shared component, still opens as
 * its own sheet on top) but restyles it to match that modal's visual
 * language: a large mono amount headline, then the same row layout Figma
 * uses for Product/Number.
 */
export default function BillReviewScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: BillCategory }>();
  const profile = useProfile();
  const walletSourceAccount = useWalletSourceAccount();
  const draft = useBillDraftStore();
  const [isQuoting, setIsQuoting] = useState(false);
  const [isPinVisible, setIsPinVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const billReference = useMemo(() => randomUUID(), []);

  useEffect(() => {
    if (draft.quoteId || !draft.product || !draft.customerIdentifier || !profile.data || draft.product.denomination_type !== "FIXED" || !draft.product.amount_minor) {
      return;
    }
    setIsQuoting(true);
    api
      .quoteBillPayment({ customerId: profile.data.id, productId: draft.product.id, customerIdentifier: draft.customerIdentifier, amountMinor: draft.product.amount_minor, idempotencyKey: createIdempotencyKey() })
      .then((quote) => draft.setQuote(draft.product!.amount_minor!, quote.quote_id, quote.total_debit_minor))
      .catch((quoteError) => setError(quoteError instanceof ApiError ? quoteError.message : "Something went wrong getting a quote."))
      .finally(() => setIsQuoting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAuthorized() {
    const sourceAccountId = walletSourceAccount.data?.source_account_id;
    if (!sourceAccountId || !profile.data || !draft.quoteId || !draft.customerIdentifier) {
      setIsPinVisible(false);
      setError("Missing account or quote reference. Please go back and try again.");
      return;
    }
    setIsPinVisible(false);
    setIsSubmitting(true);
    setError(null);
    try {
      const payment = await api.submitBillPayment({
        customerId: profile.data.id,
        sourceAccountId,
        quoteId: draft.quoteId,
        customerIdentifier: draft.customerIdentifier,
        idempotencyKey: createIdempotencyKey(),
      });
      router.replace({ pathname: "/bills/[category]/success", params: { category, billId: payment.bill_transaction_id } });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't confirm this payment went through. Please check your transaction history before trying again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4, paddingTop: theme.semanticSpacing.component, paddingBottom: theme.spacing.sm },
    title: { ...theme.typography.text16Bold, color: theme.colors.textPrimary, flex: 1 },
    content: {
      flex: 1,
      gap: theme.semanticSpacing.form,
    },
    amountWrap: { alignItems: "center", paddingVertical: theme.semanticSpacing.section },
    amount: { ...theme.typography.text30ExtraBoldFigure, color: theme.colors.textPrimary },
    card: {
      backgroundColor: theme.components.card.backgroundColor,
      borderRadius: theme.components.card.radius,
      padding: theme.components.card.padding,
      ...theme.components.card.shadow,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: theme.semanticSpacing.form,
      borderBottomWidth: theme.borderWidth.thin,
      borderBottomColor: theme.colors.divider,
    },
    rowLast: { borderBottomWidth: 0 },
    label: { ...theme.typography.text13Regular, color: theme.colors.textSecondary },
    value: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    error: { ...theme.typography.text12Regular, color: theme.colors.error, marginTop: theme.semanticSpacing.component },
    footer: { paddingTop: theme.semanticSpacing.component, paddingBottom: theme.semanticSpacing.component },
  });

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />
      <BackHeader title="Review Payment" />
      <View style={styles.content}>
        <View style={styles.amountWrap}>
          {isQuoting ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Text style={styles.amount}>{draft.totalDebitMinor ? formatMoney({ amount_minor: draft.totalDebitMinor, currency: "NGN" }) : "—"}</Text>
          )}
        </View>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Product</Text>
            <Text style={styles.value}>{draft.product?.product_name}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.label}>{draft.customerName ? "Customer" : "Number"}</Text>
            <Text style={styles.value}>{draft.customerName ?? draft.customerIdentifier}</Text>
          </View>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <View style={styles.footer}>
        <Button label="Use Payment PIN" onPress={() => setIsPinVisible(true)} disabled={!draft.quoteId || isQuoting} loading={isSubmitting} />
      </View>
      <TransactionPinSheet
        visible={isPinVisible}
        onClose={() => setIsPinVisible(false)}
        commandType="BILL_PAYMENT"
        resourceId={billReference}
        requestPayload={{ product_id: draft.product?.id, customer_identifier: draft.customerIdentifier, quote_id: draft.quoteId }}
        onAuthorized={handleAuthorized}
      />
    </ScreenContainer>
  );
}
