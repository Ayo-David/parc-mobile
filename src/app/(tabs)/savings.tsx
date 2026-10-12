import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useSavingsSummary } from "@/api/queries/useSavingsSummary";
import { useTrackedFixedDeposits } from "@/api/queries/useTrackedFixedDeposits";
import { avatarColorFor } from "@/features/beneficiaries/fieldProbe";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useSavingsRecordsStore } from "@/state/stores/savingsRecordsStore";
import { useTheme, withAlpha } from "@/theme";
import { formatMoney } from "@/utils/money";

const GOAL_ICONS: { icon: keyof typeof Ionicons.glyphMap; color: (typeof GOAL_COLOR_KEYS)[number] }[] = [
  { icon: "shield-checkmark-outline", color: "success" },
  { icon: "home-outline", color: "secondary" },
  { icon: "laptop-outline", color: "info" },
  { icon: "gift-outline", color: "warning" },
];
const GOAL_COLOR_KEYS = ["success", "secondary", "info", "warning"] as const;

const MATURITY_INSTRUCTION_LABEL: Record<string, string> = {
  payout: "At Maturity",
  renew_principal: "Renewal",
  renew_principal_and_interest: "Renewal",
};

/** Display-only title-casing of the raw status string (e.g. "ACTIVE" -> "Active", matching Figma's copy) — the `=== "ACTIVE"` tone check against the real value is untouched. */
function titleCase(value: string): string {
  return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1).toLowerCase();
}

/**
 * Figma "SavingsScreen" (239:14636), under the "Parc Dashboard" section
 * (326:968) — see redesign.md "Track B". The savings contract has no
 * endpoint to list a customer's goals or fixed deposits (only create +,
 * for fixed deposits, refetch-by-id) — `savingsRecordsStore` /
 * `useTrackedFixedDeposits` are this app's existing, already-built
 * workaround (device-local ids, refetched for live status), reused here
 * rather than inventing new fake goal data. Goal progress (%, "₦X saved")
 * is computed for real by cross-referencing each tracked goal's
 * `savingsAccountId` against `GET /v1/savings/summary`'s per-account
 * balances — not fabricated. The "Auto-save ₦X/mo" subtitle only appears
 * when a locally-tracked recurring plan is actually tagged to that goal
 * (`goalId`); otherwise it's omitted rather than guessed. Fixed-deposit
 * cards use real fields (`principal_minor`/`interest_rate`/
 * `accrued_interest`/`maturity_date`/`tenure_days`/`maturity_instruction`)
 * from `getFixedDeposit`. Goal icon/color is a deterministic hash over
 * the goal name (same `avatarColorFor` pattern as beneficiary avatars) —
 * purely decorative, Figma has no goal-category field to key off.
 */
export default function SavingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const summary = useSavingsSummary();
  const trackedGoals = useSavingsRecordsStore((state) => state.goals);
  const trackedRecurringPlans = useSavingsRecordsStore((state) => state.recurringPlans);
  const trackedFixedDepositQueries = useTrackedFixedDeposits();
  const goals = trackedGoals;
  const recurringPlans = trackedRecurringPlans;
  const fixedDepositQueries = trackedFixedDepositQueries;

  const goalColors = { success: theme.colors.success, secondary: theme.colors.secondary, info: theme.colors.info, warning: theme.colors.warning };

  const styles = StyleSheet.create({
    header: { paddingTop: theme.semanticSpacing.component },
    title: { ...theme.typography.text22ExtraBold, color: theme.colors.textPrimary },
    subtitle: { ...theme.typography.text13Regular, color: theme.colors.textMuted, marginTop: 4 },
    heroCard: {
      marginTop: theme.semanticSpacing.card,
      padding: theme.semanticSpacing.card + 2,
      borderRadius: theme.radii.cardLg - 2,
      backgroundColor: theme.colors.surfaceInverse,
      overflow: "hidden",
    },
    heroDecor: { position: "absolute", top: -30, right: -20, width: 120, height: 120, borderRadius: theme.radii.full, backgroundColor: withAlpha(theme.colors.success, 0.1) },
    heroLabel: { ...theme.typography.text12SemiBold, color: withAlpha(theme.colors.textInverse, 0.45) },
    heroAmount: { ...theme.typography.text28ExtraBoldMono, color: theme.colors.textInverse, marginTop: theme.spacing.xs },
    heroColumns: { flexDirection: "row", gap: theme.spacing.lg, marginTop: theme.spacing.lg },
    heroColumn: { gap: 2 },
    heroDivider: { width: 1, alignSelf: "stretch", backgroundColor: withAlpha(theme.colors.textInverse, 0.1) },
    heroColumnLabel: { ...theme.typography.text10p5Regular, color: withAlpha(theme.colors.textInverse, 0.35) },
    heroColumnValue: { ...theme.typography.text14Bold, color: theme.colors.textInverse },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: theme.semanticSpacing.card },
    sectionTitle: { ...theme.typography.text15Bold, color: theme.colors.textPrimary },
    newButton: { flexDirection: "row", alignItems: "center", gap: theme.spacing.xs + 2, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs + 2, borderRadius: theme.radii.chip, backgroundColor: theme.colors.primarySubtle },
    newButtonLabel: { ...theme.typography.text12Bold, color: theme.colors.textSecondary },
    goalCard: { marginTop: theme.spacing.md, padding: theme.semanticSpacing.card, borderRadius: theme.radii.lg + 2, backgroundColor: theme.colors.surface, borderWidth: theme.borderWidth.thin, borderColor: theme.colors.border },
    goalTopRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm + 2 },
    goalIcon: { width: 38, height: 38, borderRadius: theme.radii.chip + 2, alignItems: "center", justifyContent: "center" },
    goalInfo: { flex: 1, gap: 1 },
    goalName: { ...theme.typography.text14ExtraBold, color: theme.colors.textPrimary },
    goalMeta: { ...theme.typography.text11p5Regular, color: theme.colors.textMuted },
    goalPercentCol: { alignItems: "flex-end", gap: 1 },
    goalPercent: { ...theme.typography.text13ExtraBold, color: theme.colors.textPrimary },
    goalPercentLabel: { ...theme.typography.text10p5Regular, color: theme.colors.textMuted },
    progressTrack: { height: 8, borderRadius: theme.radii.xs + 2, backgroundColor: theme.colors.primarySubtle, marginTop: theme.spacing.md, overflow: "hidden" },
    progressFill: { height: 8, borderRadius: theme.radii.xs + 2 },
    goalBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: theme.spacing.sm },
    goalSaved: { ...theme.typography.text12Bold },
    goalTarget: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    fdCard: { marginTop: theme.spacing.md, padding: theme.semanticSpacing.card, borderRadius: theme.radii.lg + 2, backgroundColor: theme.colors.surface, borderWidth: theme.borderWidth.thin, borderColor: theme.colors.border },
    fdTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
    fdTitle: { ...theme.typography.text13ExtraBold, color: theme.colors.textPrimary },
    fdMeta: { ...theme.typography.text11p5Regular, color: theme.colors.textMuted, marginTop: 2 },
    fdColumns: { flexDirection: "row", justifyContent: "space-between", marginTop: theme.spacing.md },
    fdColumn: { gap: 2 },
    fdColumnLabel: { ...theme.typography.text10p5Regular, color: theme.colors.textMuted },
    fdColumnValueMono: { ...theme.typography.text16ExtraBoldMono, color: theme.colors.textPrimary },
    fdColumnValueRate: { ...theme.typography.text16ExtraBold, color: theme.colors.success },
    fdColumnValueInterest: { ...theme.typography.text14Bold, color: theme.colors.success },
    emptyText: { ...theme.typography.caption, color: theme.colors.textMuted, paddingTop: theme.spacing.md },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: theme.semanticSpacing.section },
  });

  if (summary.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const summaryData = summary.data;
  const totals = summaryData?.totals ?? [];
  const primaryTotal = totals[0];
  const accounts = summaryData?.accounts ?? [];
  const targetBalanceMinor = accounts.filter((a) => a.product_type === "TARGET").reduce((sum, a) => sum + BigInt(a.available_balance_minor), 0n);
  const fixedDepositBalanceMinor = accounts.filter((a) => a.product_type === "FIXED_DEPOSIT").reduce((sum, a) => sum + BigInt(a.available_balance_minor), 0n);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Savings</Text>
          <Text style={styles.subtitle}>Grow your money, reach your goals</Text>
        </View>

        {primaryTotal && (
          <View style={styles.heroCard}>
            <View style={styles.heroDecor} />
            <Text style={styles.heroLabel}>Total in Savings</Text>
            <Text style={styles.heroAmount}>{formatMoney({ amount_minor: primaryTotal.available_balance_minor, currency: primaryTotal.currency })}</Text>
            <View style={styles.heroColumns}>
              <View style={styles.heroColumn}>
                <Text style={styles.heroColumnLabel}>Target Savings</Text>
                <Text style={styles.heroColumnValue}>{formatMoney({ amount_minor: targetBalanceMinor.toString(), currency: primaryTotal.currency })}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroColumn}>
                <Text style={styles.heroColumnLabel}>Fixed Deposits</Text>
                <Text style={[styles.heroColumnValue, { color: theme.colors.success }]}>{formatMoney({ amount_minor: fixedDepositBalanceMinor.toString(), currency: primaryTotal.currency })}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Target Savings</Text>
          <Pressable style={styles.newButton} onPress={() => router.push("/savings/goals/create")} accessibilityRole="button">
            <Ionicons name="add" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.newButtonLabel}>New</Text>
          </Pressable>
        </View>
        {goals.length === 0 ? (
          <Text style={styles.emptyText}>No savings goals yet.</Text>
        ) : (
          goals.map((goal) => {
            const account = accounts.find((a) => a.savings_account_id === goal.savingsAccountId);
            const savedMinor = account ? BigInt(account.available_balance_minor) : 0n;
            const targetMinor = BigInt(goal.targetAmountMinor || "1");
            const percent = targetMinor > 0n ? Math.min(100, Math.round((Number(savedMinor) / Number(targetMinor)) * 100)) : 0;
            const plan = recurringPlans.find((p) => p.goalId === goal.id);
            const meta = plan ? `Auto-save ${formatMoney({ amount_minor: plan.amountMinor, currency: plan.currency })}/${plan.frequency.toLowerCase()} · Due ${goal.targetDate}` : `Due ${goal.targetDate}`;
            const style = GOAL_ICONS[Math.abs(goal.name.length + goal.id.length) % GOAL_ICONS.length];
            const color = goalColors[style.color];
            return (
              <Pressable key={goal.id} style={styles.goalCard} onPress={() => router.push({ pathname: "/savings/goals/[goalId]", params: { goalId: goal.id } })} accessibilityRole="button">
                <View style={styles.goalTopRow}>
                  <View style={[styles.goalIcon, { backgroundColor: withAlpha(color, 0.09) }]}>
                    <Ionicons name={style.icon} size={20} color={color} />
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalMeta}>{meta}</Text>
                  </View>
                  <View style={styles.goalPercentCol}>
                    <Text style={styles.goalPercent}>{percent}%</Text>
                    <Text style={styles.goalPercentLabel}>of goal</Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
                </View>
                <View style={styles.goalBottomRow}>
                  <Text style={[styles.goalSaved, { color }]}>{formatMoney({ amount_minor: savedMinor.toString(), currency: goal.currency })} saved</Text>
                  <Text style={styles.goalTarget}>Goal: {formatMoney({ amount_minor: goal.targetAmountMinor, currency: goal.currency })}</Text>
                </View>
              </Pressable>
            );
          })
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fixed Deposits</Text>
          <Pressable style={styles.newButton} onPress={() => router.push("/savings/fixed-deposits/create")} accessibilityRole="button">
            <Ionicons name="add" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.newButtonLabel}>New</Text>
          </Pressable>
        </View>
        {fixedDepositQueries.length === 0 ? (
          <Text style={styles.emptyText}>No fixed deposits yet.</Text>
        ) : (
          fixedDepositQueries.map((query, index) =>
            query.data ? (
              <Pressable
                key={query.data.fixed_deposit_id}
                style={styles.fdCard}
                onPress={() => router.push({ pathname: "/savings/fixed-deposits/[fixedDepositId]", params: { fixedDepositId: query.data!.fixed_deposit_id } })}
                accessibilityRole="button"
              >
                <View style={styles.fdTopRow}>
                  <View>
                    <Text style={styles.fdTitle}>Fixed Deposit · {query.data.tenure_days} Days</Text>
                    <Text style={styles.fdMeta}>
                      Matures: {query.data.maturity_date} · {MATURITY_INSTRUCTION_LABEL[query.data.maturity_instruction] ?? query.data.maturity_instruction}
                    </Text>
                  </View>
                  <StatusBadge tone={query.data.status === "ACTIVE" ? "success" : "warning"} label={titleCase(query.data.status)} />
                </View>
                <View style={styles.fdColumns}>
                  <View style={styles.fdColumn}>
                    <Text style={styles.fdColumnLabel}>Principal</Text>
                    <Text style={styles.fdColumnValueMono}>{formatMoney({ amount_minor: query.data.principal_minor, currency: query.data.currency })}</Text>
                  </View>
                  <View style={styles.fdColumn}>
                    <Text style={styles.fdColumnLabel}>Rate</Text>
                    <Text style={styles.fdColumnValueRate}>{query.data.interest_rate}% p.a.</Text>
                  </View>
                  <View style={[styles.fdColumn, { alignItems: "flex-end" }]}>
                    <Text style={styles.fdColumnLabel}>Interest</Text>
                    <Text style={styles.fdColumnValueInterest}>+{formatMoney({ amount_minor: query.data.accrued_interest, currency: query.data.currency })}</Text>
                  </View>
                </View>
              </Pressable>
            ) : (
              <View key={index} style={styles.fdCard}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ),
          )
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
