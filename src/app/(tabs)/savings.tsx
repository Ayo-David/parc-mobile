import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useSavingsSummary } from "@/api/queries/useSavingsSummary";
import { useTrackedFixedDeposits } from "@/api/queries/useTrackedFixedDeposits";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useSavingsRecordsStore } from "@/state/stores/savingsRecordsStore";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

/**
 * Figma "Savings" tab. `GET /v1/savings/summary` is fully typed and real.
 * Goals/fixed-deposits/recurring plans have no list endpoint anywhere in
 * the savings contract (PLAN.md "Real blockers") — what's shown here for
 * those three sections comes from `savingsRecordsStore` (device-local
 * history of what this app created), refetching fixed deposits by id
 * (the one lookup the contract does support) for a live status.
 */
export default function SavingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const summary = useSavingsSummary();
  const goals = useSavingsRecordsStore((state) => state.goals);
  const recurringPlans = useSavingsRecordsStore((state) => state.recurringPlans);
  const fixedDepositQueries = useTrackedFixedDeposits();

  const styles = StyleSheet.create({
    header: { paddingTop: theme.semanticSpacing.section, marginBottom: theme.semanticSpacing.section },
    title: { ...theme.typography.h2, color: theme.colors.textPrimary },
    totalsCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.card, padding: theme.semanticSpacing.card, marginBottom: theme.semanticSpacing.section, ...theme.elevation.sm },
    totalsLabel: { ...theme.typography.label, color: theme.colors.textMuted },
    totalsAmount: { ...theme.typography.h1, color: theme.colors.textPrimary, marginTop: theme.spacing.xs },
    actionsRow: { flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.semanticSpacing.section },
    sectionLabel: { ...theme.typography.label, color: theme.colors.textMuted, marginBottom: theme.semanticSpacing.form },
    card: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.card, padding: theme.semanticSpacing.card, marginBottom: theme.semanticSpacing.form, ...theme.elevation.sm, gap: theme.spacing.xs },
    cardTitle: { ...theme.typography.h4, color: theme.colors.textPrimary },
    cardSubtitle: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
    emptyText: { ...theme.typography.bodyMedium, color: theme.colors.textMuted, marginBottom: theme.semanticSpacing.section },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  if (summary.isLoading) {
    return (
      <ScreenContainer hasFloatingTabBar>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const totals = summary.data?.totals ?? [];
  const primaryTotal = totals[0];

  return (
    <ScreenContainer hasFloatingTabBar>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Savings</Text>
        </View>

        {primaryTotal ? (
          <View style={styles.totalsCard}>
            <Text style={styles.totalsLabel}>Total savings balance</Text>
            <Text style={styles.totalsAmount}>{formatMoney({ amount_minor: primaryTotal.available_balance_minor, currency: primaryTotal.currency })}</Text>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <Button label="New Goal" size="small" onPress={() => router.push("/savings/goals/create")} />
          <Button label="Fixed Deposit" size="small" variant="secondary" onPress={() => router.push("/savings/fixed-deposits/create")} />
          <Button label="Auto-save" size="small" variant="secondary" onPress={() => router.push("/savings/recurring/create")} />
        </View>

        <Text style={styles.sectionLabel}>Your goals</Text>
        {goals.length === 0 ? (
          <Text style={styles.emptyText}>No savings goals yet.</Text>
        ) : (
          goals.map((goal) => (
            <Pressable key={goal.id} style={styles.card} onPress={() => router.push({ pathname: "/savings/goals/[goalId]", params: { goalId: goal.id } })}>
              <Text style={styles.cardTitle}>{goal.name}</Text>
              <Text style={styles.cardSubtitle}>Target: {formatMoney({ amount_minor: goal.targetAmountMinor, currency: goal.currency })} by {goal.targetDate}</Text>
              <StatusBadge tone={goal.status === "ACTIVE" ? "success" : "warning"} label={goal.status} />
            </Pressable>
          ))
        )}

        <Text style={styles.sectionLabel}>Fixed deposits</Text>
        {fixedDepositQueries.length === 0 ? (
          <Text style={styles.emptyText}>No fixed deposits yet.</Text>
        ) : (
          fixedDepositQueries.map((query, index) =>
            query.data ? (
              <Pressable key={query.data.fixed_deposit_id} style={styles.card} onPress={() => router.push({ pathname: "/savings/fixed-deposits/[fixedDepositId]", params: { fixedDepositId: query.data!.fixed_deposit_id } })}>
                <Text style={styles.cardTitle}>{formatMoney({ amount_minor: query.data.principal_minor, currency: query.data.currency })}</Text>
                <Text style={styles.cardSubtitle}>Matures {query.data.maturity_date}</Text>
                <StatusBadge tone={query.data.status === "ACTIVE" ? "success" : "warning"} label={query.data.status} />
              </Pressable>
            ) : (
              <View key={index} style={styles.card}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ),
          )
        )}

        <Text style={styles.sectionLabel}>Recurring plans</Text>
        {recurringPlans.length === 0 ? (
          <Text style={styles.emptyText}>No recurring savings plans yet.</Text>
        ) : (
          recurringPlans.map((plan) => (
            <View key={plan.id} style={styles.card}>
              <Text style={styles.cardTitle}>{formatMoney({ amount_minor: plan.amountMinor, currency: plan.currency })} / {plan.frequency.toLowerCase()}</Text>
              <Text style={styles.cardSubtitle}>Next: {plan.nextExecutionDate}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
