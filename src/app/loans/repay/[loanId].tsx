import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import type { RepaymentSource } from "@/api/schemas";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";
import { useTheme } from "@/theme";
import { formatMoney, parseMajorUnitsToMinor } from "@/utils/money";

const SOURCES: Array<{ label: string; value: RepaymentSource }> = [
  { label: "Wallet", value: "wallet" },
  { label: "Direct Debit", value: "direct_debit" },
  { label: "Virtual Account", value: "virtual_account" },
  { label: "Bank Transfer", value: "manual_bank_transfer" },
];

/**
 * Figma "Loan Repayment Screen". Unlike transfers/bills, repayment doesn't
 * need a `source_account_id` — funding source is the `source` enum
 * (confirmed against the Lending contract), and a PIN-authorization token
 * is optional at submit time, not required, so this doesn't use
 * TransactionPinSheet. RESOLVED: both the quote and submission responses
 * are now fully typed (`CustomerRepaymentQuote`/`CustomerRepaymentRequest`).
 */
export default function LoanRepaymentScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const [amountNaira, setAmountNaira] = useState("");
  const [source, setSource] = useState<RepaymentSource>("wallet");
  const [repaymentQuoteId, setRepaymentQuoteId] = useState<string | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountMinor = parseMajorUnitsToMinor(amountNaira) ?? "";
  const isValidAmount = /^[1-9][0-9]*$/.test(amountMinor);

  async function handleQuote() {
    setIsQuoting(true);
    setError(null);
    try {
      const quote = await api.quoteLoanRepayment({ loanId, amountMinor, currency: "NGN", source, idempotencyKey: createIdempotencyKey() });
      setRepaymentQuoteId(quote.id);
    } catch (quoteError) {
      setError(quoteError instanceof ApiError ? quoteError.message : "Something went wrong. Please try again.");
    } finally {
      setIsQuoting(false);
    }
  }

  async function handleSubmit() {
    if (!repaymentQuoteId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.submitLoanRepayment({ loanId, repaymentQuoteId, correlationId: randomUUID(), idempotencyKey: createIdempotencyKey() });
      setIsDone(true);
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't confirm this repayment went through. Please check your loan balance before trying again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    sourceRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
    chip: { borderRadius: theme.radii.full, borderWidth: 1, paddingHorizontal: theme.semanticSpacing.form, paddingVertical: theme.spacing.xs },
    chipLabel: { ...theme.typography.label },
    quoteText: { ...theme.typography.bodyMedium, color: theme.colors.textPrimary },
    successText: { ...theme.typography.h3, color: theme.colors.success, textAlign: "center" },
  });

  if (isDone) {
    return (
      <FormScreenLayout title="Repayment submitted" footer={<Button label="Done" onPress={() => router.replace("/(tabs)/loans")} />}>
        <Text style={styles.successText}>Your repayment has been submitted.</Text>
      </FormScreenLayout>
    );
  }

  return (
    <FormScreenLayout
      title="Repay loan"
      errorMessage={error}
      footer={
        repaymentQuoteId ? (
          <Button label="Confirm Repayment" onPress={handleSubmit} loading={isSubmitting} />
        ) : (
          <Button label="Get Quote" onPress={handleQuote} disabled={!isValidAmount} loading={isQuoting} />
        )
      }
    >
      <TextField value={amountNaira} onChangeText={setAmountNaira} placeholder="Amount (₦)" keyboardType="decimal-pad" editable={!repaymentQuoteId} autoFocus />
      <View style={styles.sourceRow}>
        {SOURCES.map((option) => {
          const isActive = option.value === source;
          return (
            <Pressable
              key={option.value}
              disabled={!!repaymentQuoteId}
              onPress={() => setSource(option.value)}
              style={[styles.chip, { borderColor: isActive ? theme.colors.primary : theme.colors.border, backgroundColor: isActive ? theme.colors.primarySubtle : theme.colors.surface }]}
            >
              <Text style={[styles.chipLabel, { color: isActive ? theme.colors.primary : theme.colors.textSecondary }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {repaymentQuoteId ? <Text style={styles.quoteText}>Repaying {formatMoney({ amount_minor: amountMinor, currency: "NGN" })} via {source.replace("_", " ")}.</Text> : null}
    </FormScreenLayout>
  );
}
