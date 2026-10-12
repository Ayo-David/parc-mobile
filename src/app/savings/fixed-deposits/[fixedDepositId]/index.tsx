import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useTheme, withAlpha } from "@/theme";
import { formatMoney } from "@/utils/money";

const INSTRUCTION_LABELS: Record<string, string> = {
  payout: "Pay out to wallet",
  renew_principal: "Renew principal",
  renew_principal_and_interest: "Renew principal + interest",
};

/**
 * Figma "FD 01 — Detail" (node 430:157, missing-mobile.md §7). Every field
 * here is real and fully typed (`GET /v1/fixed-deposits/:id`) — this is a
 * pure UI/UX pass, not new backend work. Change-instruction and
 * early-liquidation are now dedicated screens (see `instruction.tsx`/
 * `liquidate.tsx`) instead of being crammed into this one screen with no
 * confirmation step.
 */
export default function FixedDepositDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { fixedDepositId } = useLocalSearchParams<{ fixedDepositId: string }>();
  const detail = useQuery({ queryKey: ["fixed-deposit", fixedDepositId], queryFn: () => api.getFixedDeposit(fixedDepositId) });

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.component },
    card: { backgroundColor: theme.colors.surfaceInverse, borderRadius: theme.radii.card, padding: theme.semanticSpacing.card, gap: theme.spacing.sm },
    cardLabel: { ...theme.typography.text12SemiBold, color: withAlpha(theme.colors.textInverse, 0.45) },
    cardPrincipal: { ...theme.typography.text28ExtraBoldMono, color: theme.colors.textInverse },
    cardMeta: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
    cardMetaText: { ...theme.typography.text11p5Regular, color: withAlpha(theme.colors.textInverse, 0.5) },
    statsRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: theme.colors.primarySubtle, borderRadius: theme.radii.lg, padding: theme.semanticSpacing.form },
    statLabel: { ...theme.typography.text10p5Regular, color: theme.colors.textMuted },
    statValue: { ...theme.typography.text13ExtraBold, color: theme.colors.textPrimary, marginTop: theme.spacing.xs },
    instructionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: theme.colors.primarySubtle,
      borderRadius: theme.radii.lg,
      padding: theme.semanticSpacing.form,
    },
    instructionLabel: { ...theme.typography.text10p5Regular, color: theme.colors.textMuted },
    instructionValue: { ...theme.typography.text13Bold, color: theme.colors.textPrimary, marginTop: theme.spacing.xs },
    actions: { flexDirection: "row", gap: theme.spacing.md, marginTop: "auto" as const, paddingBottom: theme.semanticSpacing.section },
    actionButton: { flex: 1 },
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
          <Text style={styles.cardMetaText}>We couldn&apos;t load this fixed deposit.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const fd = detail.data;

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: "Fixed Deposit" }} />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Principal</Text>
          <Text style={styles.cardPrincipal}>{formatMoney({ amount_minor: fd.principal_minor, currency: fd.currency })}</Text>
          <View style={styles.cardMeta}>
            <StatusBadge tone={fd.status === "ACTIVE" ? "success" : "info"} label={fd.status} />
            <Text style={styles.cardMetaText}>
              Matures {fd.maturity_date} · {INSTRUCTION_LABELS[fd.maturity_instruction] ?? fd.maturity_instruction}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statLabel}>Rate</Text>
            <Text style={styles.statValue}>{fd.interest_rate}% p.a.</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Interest earned</Text>
            <Text style={styles.statValue}>{formatMoney({ amount_minor: fd.accrued_interest, currency: fd.currency })}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Tenure</Text>
            <Text style={styles.statValue}>{fd.tenure_days} days</Text>
          </View>
        </View>

        {fd.status === "ACTIVE" ? (
          <View style={styles.instructionRow}>
            <View>
              <Text style={styles.instructionLabel}>At maturity</Text>
              <Text style={styles.instructionValue}>{INSTRUCTION_LABELS[fd.maturity_instruction] ?? fd.maturity_instruction}</Text>
            </View>
          </View>
        ) : null}

        {fd.status === "ACTIVE" ? (
          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <Button label="Change instruction" variant="secondary" onPress={() => router.push({ pathname: "/savings/fixed-deposits/[fixedDepositId]/instruction", params: { fixedDepositId } })} />
            </View>
            <View style={styles.actionButton}>
              <Button label="Liquidate early" variant="destructive" onPress={() => router.push({ pathname: "/savings/fixed-deposits/[fixedDepositId]/liquidate", params: { fixedDepositId } })} />
            </View>
          </View>
        ) : (
          <Button label="Done" variant="secondary" onPress={() => router.replace("/(tabs)/savings")} />
        )}
      </View>
    </ScreenContainer>
  );
}
