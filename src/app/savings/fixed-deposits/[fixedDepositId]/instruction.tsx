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
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

const OPTIONS: { value: MaturityInstruction; label: string; body: string }[] = [
  { value: "payout", label: "Pay out to wallet", body: "Principal + interest credited to your wallet" },
  { value: "renew_principal", label: "Renew principal", body: "Principal rolls into a new fixed deposit of the same term" },
  { value: "renew_principal_and_interest", label: "Renew principal + interest", body: "Principal and interest both roll into a new fixed deposit" },
];

/**
 * Figma "FD 03 — Change Maturity Instruction" (node 430:409,
 * missing-mobile.md §7). Previously this action submitted immediately on
 * tap with no way to review before confirming; now it's select-then-save,
 * matching the Figma radio-list + "Save instruction" button pattern.
 */
export default function FixedDepositInstructionScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { fixedDepositId } = useLocalSearchParams<{ fixedDepositId: string }>();
  const detail = useQuery({ queryKey: ["fixed-deposit", fixedDepositId], queryFn: () => api.getFixedDeposit(fixedDepositId) });
  const [selectedOverride, setSelectedOverride] = useState<MaturityInstruction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = selectedOverride ?? detail.data?.maturity_instruction ?? null;

  async function handleSave() {
    if (!selected) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.setFixedDepositMaturityInstruction({ fixedDepositId, instruction: selected, correlationId: randomUUID(), idempotencyKey: createIdempotencyKey() });
      await queryClient.invalidateQueries({ queryKey: ["fixed-deposit", fixedDepositId] });
      router.replace({ pathname: "/savings/success", params: { title: "Maturity Instruction Updated" } });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.form },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      borderRadius: theme.radii.lg,
      borderWidth: theme.borderWidth.thin,
      padding: theme.semanticSpacing.form,
    },
    optionSelected: { backgroundColor: theme.colors.primarySubtle, borderColor: theme.colors.primary },
    optionUnselected: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
    radioOuter: { width: theme.spacing.xl, height: theme.spacing.xl, borderRadius: theme.radii.full, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    radioInner: { width: theme.spacing.sm, height: theme.spacing.sm, borderRadius: theme.radii.full, backgroundColor: theme.colors.primary },
    optionLabel: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    optionBody: { ...theme.typography.text11p5Regular, color: theme.colors.textMuted, marginTop: theme.spacing.xs },
    error: { ...theme.typography.text12Regular, color: theme.colors.error },
    footer: { marginTop: "auto" as const, paddingBottom: theme.semanticSpacing.section },
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

  return (
    <ScreenContainer>
      <BackHeader title="Maturity instruction" />
      <View style={styles.content}>
        {OPTIONS.map((option) => {
          const isSelected = option.value === selected;
          return (
            <Pressable key={option.value} style={[styles.option, isSelected ? styles.optionSelected : styles.optionUnselected]} onPress={() => setSelectedOverride(option.value)}>
              <View style={[styles.radioOuter, { borderColor: isSelected ? theme.colors.primary : theme.colors.border }]}>{isSelected ? <View style={styles.radioInner} /> : null}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionBody}>{option.body}</Text>
              </View>
            </Pressable>
          );
        })}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.footer}>
          <Button label="Save instruction" onPress={handleSave} disabled={!selected || selected === detail.data?.maturity_instruction} loading={isSubmitting} />
        </View>
      </View>
    </ScreenContainer>
  );
}
