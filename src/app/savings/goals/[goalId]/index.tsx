import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useSavingsSummary } from "@/api/queries/useSavingsSummary";
import { Button } from "@/components/Button/Button";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useSavingsRecordsStore } from "@/state/stores/savingsRecordsStore";
import { useTheme, withAlpha } from "@/theme";
import { formatMoney } from "@/utils/money";

/**
 * Figma "Goal 01 — Detail" (node 429:70, missing-mobile.md §7). Real
 * fields only: target/date/status come from `savingsRecordsStore` (no
 * `GET` to refetch a single goal exists — PLAN.md "Real blockers"), and a
 * matching auto-save plan is looked up by the real `goal_id` tag
 * (`RecurringPlanInput.goal_id`, confirmed in `parc-contracts`).
 *
 * Figma's progress bar/percentage and per-contribution history are NOT
 * built here — a genuine, newly-confirmed contract gap, not an oversight:
 * every goal shares the customer's single ORDINARY savings account (see
 * `goals/create.tsx`), and `SavingsGoalResult` has no balance/progress
 * field at all, so there is no real per-goal "saved so far" figure to
 * show. Showing the pooled account balance labeled as this goal's own
 * progress would be actively misleading, not just incomplete, so it's
 * disclosed instead.
 */
export default function GoalDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const goal = useSavingsRecordsStore((state) => state.goals.find((entry) => entry.id === goalId));
  const autoSavePlan = useSavingsRecordsStore((state) => state.recurringPlans.find((plan) => plan.goalId === goalId));
  const summary = useSavingsSummary();
  const savingsAccount = summary.data?.accounts.find((account) => account.product_type === "ORDINARY") ?? null;

  const styles = StyleSheet.create({
    content: { flex: 1 },
    scrollContent: { paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.component, paddingBottom: theme.semanticSpacing.section },
    footer: { paddingBottom: theme.semanticSpacing.section, paddingTop: theme.semanticSpacing.form },
    card: { backgroundColor: theme.colors.surfaceInverse, borderRadius: theme.radii.card, padding: theme.semanticSpacing.card, gap: theme.spacing.sm },
    cardLabel: { ...theme.typography.text12SemiBold, color: withAlpha(theme.colors.textInverse, 0.45) },
    cardTarget: { ...theme.typography.text28ExtraBoldMono, color: theme.colors.textInverse },
    cardMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    cardMetaText: { ...theme.typography.text11p5Regular, color: withAlpha(theme.colors.textInverse, 0.5) },
    disclosure: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    autoSaveRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      backgroundColor: theme.colors.primarySubtle,
      borderRadius: theme.radii.lg,
      padding: theme.semanticSpacing.form,
    },
    autoSaveText: { ...theme.typography.text13SemiBold, color: theme.colors.textPrimary, flex: 1 },
    sectionLabel: { ...theme.typography.text15Bold, color: theme.colors.textPrimary },
    actions: { flexDirection: "row", gap: theme.spacing.md },
    actionButton: { flex: 1 },
  });

  if (!goal) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: "Savings goal" }} />
        <View style={styles.content}>
          <Text style={styles.disclosure}>This goal is no longer available on this device.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: goal.name }} />
      <View style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Target</Text>
            <Text style={styles.cardTarget}>{formatMoney({ amount_minor: goal.targetAmountMinor, currency: goal.currency })}</Text>
            <View style={styles.cardMeta}>
              <StatusBadge tone={goal.status === "ACTIVE" ? "success" : "warning"} label={goal.status} />
              <Text style={styles.cardMetaText}>Due {goal.targetDate}</Text>
            </View>
          </View>
          <Text style={styles.disclosure}>Per-goal progress isn&apos;t available yet — your savings balance is shared across all your goals until the backend adds per-goal tracking.</Text>

          {autoSavePlan ? (
            <View style={styles.autoSaveRow}>
              <Text style={styles.autoSaveText}>
                Auto-saving {formatMoney({ amount_minor: autoSavePlan.amountMinor, currency: autoSavePlan.currency })} {autoSavePlan.frequency.toLowerCase()}
              </Text>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Contribution history</Text>
          <EmptyState emoji="🧾" title="Not available yet" body="Per-contribution history for this goal isn't exposed by the backend yet." />
        </ScrollView>
        <View style={styles.footer}>
          {goal.status === "ACTIVE" ? (
            <View style={styles.actions}>
              <View style={styles.actionButton}>
                <Button label="Withdraw" variant="secondary" onPress={() => router.push({ pathname: "/savings/goals/[goalId]/withdraw", params: { goalId: goal.id } })} disabled={!savingsAccount} />
              </View>
              <View style={styles.actionButton}>
                <Button label="Break Goal" variant="destructive" onPress={() => router.push({ pathname: "/savings/goals/[goalId]/break", params: { goalId: goal.id } })} />
              </View>
            </View>
          ) : (
            <Button label="Done" onPress={() => router.replace("/(tabs)/savings")} />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
