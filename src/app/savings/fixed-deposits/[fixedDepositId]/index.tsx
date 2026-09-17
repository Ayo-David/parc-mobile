import { useQuery, useQueryClient } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import type { MaturityInstruction } from "@/api/schemas";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

const INSTRUCTIONS: Array<{ label: string; value: MaturityInstruction }> = [
  { label: "Pay out to wallet", value: "payout" },
  { label: "Renew principal", value: "renew_principal" },
  { label: "Renew principal + interest", value: "renew_principal_and_interest" },
];

/** Figma fixed-deposit detail. `GET /v1/fixed-deposits/:id` is fully typed and real. */
export default function FixedDepositDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { fixedDepositId } = useLocalSearchParams<{ fixedDepositId: string }>();
  const detail = useQuery({ queryKey: ["fixed-deposit", fixedDepositId], queryFn: () => api.getFixedDeposit(fixedDepositId) });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleLiquidate() {
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const quote = await api.getFixedDepositLiquidationQuote({ fixedDepositId, correlationId: randomUUID() });
      const settlement = await api.liquidateFixedDeposit({ fixedDepositId, quoteId: quote.quote_id, quoteHash: quote.quote_hash, correlationId: randomUUID(), idempotencyKey: createIdempotencyKey() });
      setResult(`Liquidated. ${formatMoney({ amount_minor: settlement.payout_minor, currency: settlement.currency })} paid out.`);
      await queryClient.invalidateQueries({ queryKey: ["fixed-deposit", fixedDepositId] });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't confirm this went through. Please check your savings tab before trying again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSetInstruction(instruction: MaturityInstruction) {
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    try {
      await api.setFixedDepositMaturityInstruction({ fixedDepositId, instruction, correlationId: randomUUID(), idempotencyKey: createIdempotencyKey() });
      setResult("Maturity instruction updated.");
      await queryClient.invalidateQueries({ queryKey: ["fixed-deposit", fixedDepositId] });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.form },
    title: { ...theme.typography.h2, color: theme.colors.textPrimary },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: theme.semanticSpacing.form, borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
    label: { ...theme.typography.bodyMedium, color: theme.colors.textSecondary },
    value: { ...theme.typography.bodyMedium, fontWeight: "600", color: theme.colors.textPrimary },
    sectionLabel: { ...theme.typography.label, color: theme.colors.textMuted, marginTop: theme.semanticSpacing.section },
    chip: { borderRadius: theme.radii.full, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: theme.semanticSpacing.form, paddingVertical: theme.spacing.xs, marginBottom: theme.spacing.xs },
    chipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySubtle },
    chipLabel: { ...theme.typography.label },
    result: { ...theme.typography.bodySmall, color: theme.colors.success },
    error: { ...theme.typography.bodySmall, color: theme.colors.error },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  if (detail.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!detail.data) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.label}>We couldn't load this fixed deposit.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const fd = detail.data;

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>{formatMoney({ amount_minor: fd.principal_minor, currency: fd.currency })}</Text>
        <StatusBadge tone={fd.status === "ACTIVE" ? "success" : "info"} label={fd.status} />
        <View style={styles.row}>
          <Text style={styles.label}>Interest rate</Text>
          <Text style={styles.value}>{fd.interest_rate}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Accrued interest</Text>
          <Text style={styles.value}>{formatMoney({ amount_minor: fd.accrued_interest, currency: fd.currency })}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Maturity date</Text>
          <Text style={styles.value}>{fd.maturity_date}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Maturity instruction</Text>
          <Text style={styles.value}>{fd.maturity_instruction}</Text>
        </View>
        {result ? <Text style={styles.result}>{result}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {fd.status === "ACTIVE" ? (
          <>
            <Text style={styles.sectionLabel}>Change maturity instruction</Text>
            {INSTRUCTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.chip, option.value === fd.maturity_instruction && styles.chipActive]}
                disabled={isSubmitting}
                onPress={() => handleSetInstruction(option.value)}
              >
                <Text style={styles.chipLabel}>{option.label}</Text>
              </Pressable>
            ))}
            <Button label="Liquidate Now" variant="destructive" onPress={handleLiquidate} loading={isSubmitting} />
          </>
        ) : null}
        <Button label="Done" variant="secondary" onPress={() => router.replace("/(tabs)/savings")} />
      </View>
    </ScreenContainer>
  );
}
