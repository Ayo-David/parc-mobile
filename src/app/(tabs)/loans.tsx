import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useLoanSummary } from "@/api/queries/useLoanSummary";
import type { LoanType } from "@/api/schemas";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { isLoanOverdue, loanStatusTone } from "@/features/loans/loanStatus";
import { useTheme, withAlpha } from "@/theme";
import { formatTenureDays } from "@/features/loans/tenure";
import { formatMoney, formatMoneyCompact } from "@/utils/money";

const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  INSTANT: "Instant Loan",
  UNSECURED_PERSONAL: "Personal Loan",
  SALARY_BACKED: "Salary Loan",
  ASSET_FINANCE: "Asset Funding",
};

const LOAN_TYPE_ICONS: Record<LoanType, keyof typeof Ionicons.glyphMap> = {
  INSTANT: "flash",
  UNSECURED_PERSONAL: "person",
  SALARY_BACKED: "briefcase",
  ASSET_FINANCE: "business",
};

const KNOWN_LOAN_TYPES: readonly LoanType[] = ["INSTANT", "UNSECURED_PERSONAL", "SALARY_BACKED", "ASSET_FINANCE"];

function asLoanType(value: string): LoanType | null {
  return (KNOWN_LOAN_TYPES as readonly string[]).includes(value) ? (value as LoanType) : null;
}

/** Display-only title-casing of the raw status string (e.g. "ACTIVE" -> "Active", matching Figma's copy) — `loanStatusTone`'s case-insensitive matching against the real value is untouched. */
function titleCase(value: string): string {
  return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1).toLowerCase();
}

const REPAYMENT_INFO: { key: string; icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { key: "daily", icon: "pulse-outline", title: "Daily Deductions", body: "Spread across business days" },
  { key: "weekly", icon: "sync-outline", title: "Weekly Installments", body: "Every Monday, auto-deducted" },
  { key: "monthly", icon: "calendar-outline", title: "Monthly Payment", body: "On your selected due date" },
];

/**
 * Figma "LoanScreen" (236:11465), under the "Parc Dashboard" section
 * (326:968) — see redesign.md "Track B". Two Figma elements are
 * deliberately NOT built, same gap already documented on the previous
 * version of this screen: the credit-score card ("742 · Excellent",
 * "Loan limit: ₦2,000,000.00", "Interest from 2%/mo") — no
 * credit-scoring endpoint exists anywhere in the confirmed Lending
 * contract (missing-mobile.md §10) — and the Active Loan card's
 * Monthly-payment/progress-bar/"Next: <date>" row — `CustomerLoan` only
 * has `outstanding_principal`/`status`/`loan_number`, no repayment
 * schedule or next-due-date field (that only exists on a loan *quote*,
 * before acceptance, not on an accepted loan). Per-product-type
 * icon/color recipe below (236:11547–236:11606) is cosmetic Figma
 * styling, not data, so it's fine to keep as a fixed lookup table.
 * "Flexible Repayment" is static informational copy in Figma too — not
 * customer-specific data.
 */
export default function LoansScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const summary = useLoanSummary();

  const productStyles: Record<LoanType, { bg: string; border?: string; iconColor: string; titleColor: string; bodyColor: string; decor: string }> = {
    INSTANT: { bg: theme.colors.surfaceInverse, iconColor: theme.colors.textInverse, titleColor: theme.colors.textInverse, bodyColor: theme.colors.textInverse, decor: withAlpha(theme.colors.warning, 0.15) },
    UNSECURED_PERSONAL: { bg: theme.colors.secondary, iconColor: theme.colors.textInverse, titleColor: theme.colors.textInverse, bodyColor: theme.colors.textInverse, decor: withAlpha(theme.colors.textInverse, 0.15) },
    ASSET_FINANCE: { bg: theme.colors.background, border: theme.colors.border, iconColor: theme.colors.textPrimary, titleColor: theme.colors.textPrimary, bodyColor: theme.colors.textPrimary, decor: withAlpha(theme.colors.secondary, 0.15) },
    SALARY_BACKED: { bg: theme.colors.background, border: theme.colors.border, iconColor: theme.colors.textPrimary, titleColor: theme.colors.textPrimary, bodyColor: theme.colors.textPrimary, decor: withAlpha(theme.colors.success, 0.15) },
  };

  const styles = StyleSheet.create({
    header: { paddingTop: theme.semanticSpacing.component },
    title: { ...theme.typography.text22ExtraBold, color: theme.colors.textPrimary },
    subtitle: { ...theme.typography.text13Regular, color: theme.colors.textMuted, marginTop: 4 },
    activeLoanCard: {
      marginTop: theme.semanticSpacing.card,
      padding: theme.semanticSpacing.card,
      borderRadius: theme.radii.card,
      backgroundColor: theme.colors.secondarySubtle,
      borderWidth: theme.borderWidth.thin,
      borderColor: withAlpha(theme.colors.secondary, 0.15),
      gap: theme.spacing.md,
    },
    activeLoanHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
    activeLoanLabel: { ...theme.typography.text12SemiBold, color: theme.colors.textMuted },
    outstandingLabel: { ...theme.typography.text11Regular, color: theme.colors.textMuted, marginTop: theme.spacing.sm },
    outstandingAmount: { ...theme.typography.text20ExtraBoldFigure, color: theme.colors.secondary, marginTop: 2 },
    repayButton: {
      height: theme.control.buttonLarge,
      borderRadius: theme.radii.button,
      backgroundColor: theme.colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.md,
    },
    repayButtonLabel: { ...theme.typography.text14ExtraBold, color: theme.colors.textInverse, textAlign: "center" },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: theme.semanticSpacing.card },
    sectionTitle: { ...theme.typography.text15Bold, color: theme.colors.textPrimary },
    productGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: theme.spacing.md },
    productTile: { width: "47%", borderRadius: theme.radii.card, padding: theme.spacing.lg, overflow: "hidden", minHeight: 110, borderWidth: theme.borderWidth.thin, borderColor: "transparent" },
    productDecor: { position: "absolute", right: -25, bottom: 14, width: 70, height: 70, borderRadius: theme.radii.full },
    productTitle: { ...theme.typography.text14ExtraBold, marginTop: theme.spacing.sm },
    productBody: { ...theme.typography.text11p5Regular, marginTop: 3, opacity: 0.55 },
    infoCard: {
      marginTop: theme.semanticSpacing.card + 4,
      padding: theme.semanticSpacing.card,
      borderRadius: theme.radii.lg + 2,
      backgroundColor: theme.colors.primarySubtle,
      gap: theme.spacing.sm,
    },
    infoCardTitle: { ...theme.typography.text14ExtraBold, color: theme.colors.textPrimary },
    infoRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, paddingVertical: theme.spacing.sm, borderBottomWidth: theme.borderWidth.thin, borderBottomColor: theme.colors.border },
    infoIcon: { width: 32, height: 32, borderRadius: theme.radii.chip, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.border },
    infoBody: { flex: 1 },
    infoTitle: { ...theme.typography.text13Bold, color: theme.colors.textPrimary },
    infoSubtitle: { ...theme.typography.text11p5Regular, color: theme.colors.textMuted, marginTop: 1 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: theme.semanticSpacing.section },
    emptyText: { ...theme.typography.caption, color: theme.colors.textMuted, paddingTop: theme.spacing.md },
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

  const eligibleProducts = summary.data?.eligibleProducts ?? [];
  const loans = summary.data?.loans ?? [];

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Loans</Text>
          <Text style={styles.subtitle}>Quick access to smart credit</Text>
        </View>

        {loans.map((loan) => {
          const overdue = isLoanOverdue(loan.status);
          const outstanding = formatMoney({ amount_minor: loan.outstanding_principal, currency: loan.currency });
          return (
            <View key={loan.id} style={styles.activeLoanCard}>
              <View style={styles.activeLoanHeader}>
                <Text style={styles.activeLoanLabel}>Active Loan</Text>
                <StatusBadge tone={loanStatusTone(loan.status)} label={titleCase(loan.status)} />
              </View>
              <View>
                <Text style={styles.outstandingLabel}>Outstanding</Text>
                <Text style={styles.outstandingAmount}>{outstanding}</Text>
              </View>
              <Pressable
                style={styles.repayButton}
                onPress={() =>
                  overdue
                    ? router.push({ pathname: "/loans/overdue/[loanId]", params: { loanId: loan.id } })
                    : router.push({ pathname: "/loans/repay/[loanId]", params: { loanId: loan.id } })
                }
                accessibilityRole="button"
              >
                <Text style={styles.repayButtonLabel}>Make Repayment · {outstanding} outstanding</Text>
              </Pressable>
            </View>
          );
        })}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Loan Products</Text>
        </View>
        {eligibleProducts.length === 0 ? (
          <Text style={styles.emptyText}>No loan products available right now.</Text>
        ) : (
          <View style={styles.productGrid}>
            {eligibleProducts.map((product) => {
              const loanType = asLoanType(product.type);
              const style = loanType ? productStyles[loanType] : productStyles.ASSET_FINANCE;
              const icon = loanType ? LOAN_TYPE_ICONS[loanType] : "cash";
              const label = product.name || (loanType ? LOAN_TYPE_LABELS[loanType] : "Loan product");
              return (
                <Pressable
                  key={product.id}
                  style={[styles.productTile, { backgroundColor: style.bg, borderColor: style.border ?? "transparent" }]}
                  onPress={() => loanType && router.push({ pathname: "/loans/[loanType]", params: { loanType, productVersionId: product.product_version_id } })}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <View style={[styles.productDecor, { backgroundColor: style.decor }]} />
                  <Ionicons name={icon} size={22} color={style.iconColor} />
                  <Text style={[styles.productTitle, { color: style.titleColor }]}>{label}</Text>
                  <Text style={[styles.productBody, { color: style.bodyColor }]}>
                    Up to {formatMoneyCompact({ amount_minor: product.max_amount_minor, currency: product.currency })} · {formatTenureDays(product.max_tenure_days)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Flexible Repayment</Text>
          {REPAYMENT_INFO.map((item) => (
            <View key={item.key} style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name={item.icon} size={18} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.infoBody}>
                <Text style={styles.infoTitle}>{item.title}</Text>
                <Text style={styles.infoSubtitle}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
