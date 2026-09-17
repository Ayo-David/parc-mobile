import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useProfile } from "@/api/queries/useProfile";
import { useWalletSourceAccount } from "@/api/queries/useWalletSourceAccount";
import type { BillCategory } from "@/api/schemas";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TransactionPinSheet } from "@/components/TransactionPinSheet/TransactionPinSheet";
import { useBillDraftStore } from "@/features/bills/billDraftStore";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

/**
 * Figma bill checkout pattern (Part 2 "BillCheckoutSheet"), fed by the
 * fully-typed Bills contract. RESOLVED (PLAN.md "Real blockers"):
 * `source_account_id` now comes from the real `GET /v1/wallet/source-account`
 * endpoint.
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
    content: {
      flex: 1,
      paddingTop: theme.semanticSpacing.section,
      gap: theme.semanticSpacing.form,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
      marginBottom: theme.semanticSpacing.section,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: theme.semanticSpacing.form,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    label: { ...theme.typography.bodyMedium, color: theme.colors.textSecondary },
    value: { ...theme.typography.bodyMedium, fontWeight: "600", color: theme.colors.textPrimary },
    error: { ...theme.typography.bodySmall, color: theme.colors.error, marginTop: theme.semanticSpacing.component },
    footer: { paddingTop: theme.semanticSpacing.component, paddingBottom: theme.semanticSpacing.component },
  });

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Review payment</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Product</Text>
          <Text style={styles.value}>{draft.product?.product_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{draft.customerName ? "Customer" : "Number"}</Text>
          <Text style={styles.value}>{draft.customerName ?? draft.customerIdentifier}</Text>
        </View>
        {isQuoting ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : draft.totalDebitMinor ? (
          <View style={styles.row}>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.value}>{formatMoney({ amount_minor: draft.totalDebitMinor, currency: "NGN" })}</Text>
          </View>
        ) : null}
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
