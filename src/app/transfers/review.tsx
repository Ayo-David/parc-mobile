import { randomUUID } from "expo-crypto";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TransactionPinSheet } from "@/components/TransactionPinSheet/TransactionPinSheet";
import { useWalletSourceAccount } from "@/api/queries/useWalletSourceAccount";
import { useTransferDraftStore } from "@/features/transfers/transferDraftStore";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

/**
 * Figma "Send Money — Review & Confirm Screen". RESOLVED (PLAN.md "Real
 * blockers"): `source_account_id` now comes from the real
 * `GET /v1/wallet/source-account` endpoint. The final submit call still
 * targets `POST /v1/transfers`, which remains undocumented in the payment
 * contract (see api/client.ts submitTransfer).
 */
export default function TransferReviewScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const draft = useTransferDraftStore();
  const walletSourceAccount = useWalletSourceAccount();
  const [isPinVisible, setIsPinVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transferReference = useMemo(() => randomUUID(), []);

  const requestPayload = {
    bank_code: draft.bankCode,
    account_number: draft.accountNumber,
    amount_minor: draft.amountMinor,
    currency: draft.currency,
    narration: draft.narration,
  };

  async function handleAuthorized(authorizationToken: string) {
    const sourceAccountId = walletSourceAccount.data?.source_account_id;
    if (!sourceAccountId) {
      setError("We couldn't load your wallet account. Please try again.");
      return;
    }
    setIsPinVisible(false);
    setIsSubmitting(true);
    setError(null);
    try {
      const transfer = await api.submitTransfer({
        sourceAccountId,
        bankCode: draft.bankCode!,
        accountNumber: draft.accountNumber!,
        amountMinor: draft.amountMinor!,
        currency: draft.currency,
        narration: draft.narration,
        enquiryToken: draft.enquiryToken,
        quoteId: draft.quoteId,
        authorizationToken,
        idempotencyKey: createIdempotencyKey(),
      });
      router.replace({ pathname: "/transfers/success", params: { transferId: transfer.id } });
    } catch (submitError) {
      // A timeout/ambiguous network error here must never trigger a retry —
      // there is currently no way to look up an in-flight transfer by
      // idempotency key alone (no such endpoint is documented), so an
      // ambiguous outcome here is a real, disclosed limitation.
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't confirm this transfer went through. Please check your transaction history before trying again.");
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
    label: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
    },
    value: {
      ...theme.typography.bodyMedium,
      fontWeight: "600",
      color: theme.colors.textPrimary,
    },
    error: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      marginTop: theme.semanticSpacing.component,
    },
    footer: {
      paddingTop: theme.semanticSpacing.component,
      paddingBottom: theme.semanticSpacing.component,
    },
  });

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Review transfer</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Recipient</Text>
          <Text style={styles.value}>{draft.accountName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Bank</Text>
          <Text style={styles.value}>{draft.bankName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>{draft.amountMinor ? formatMoney({ amount_minor: draft.amountMinor, currency: draft.currency }) : "—"}</Text>
        </View>
        {draft.feeMinor ? (
          <View style={styles.row}>
            <Text style={styles.label}>Fee</Text>
            <Text style={styles.value}>{formatMoney({ amount_minor: draft.feeMinor, currency: draft.currency })}</Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <View style={styles.footer}>
        <Button label="Use Payment PIN" onPress={() => setIsPinVisible(true)} loading={isSubmitting} />
      </View>
      <TransactionPinSheet
        visible={isPinVisible}
        onClose={() => setIsPinVisible(false)}
        commandType="TRANSFER"
        resourceId={transferReference}
        requestPayload={requestPayload}
        onAuthorized={handleAuthorized}
      />
    </ScreenContainer>
  );
}
