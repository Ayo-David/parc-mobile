import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useLoanSummary } from "@/api/queries/useLoanSummary";
import type { LoanType } from "@/api/schemas";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  INSTANT: "Instant Loan",
  UNSECURED_PERSONAL: "Personal Loan",
  SALARY_BACKED: "Salary Loan",
  ASSET_FINANCE: "Asset Finance",
};

const KNOWN_LOAN_TYPES: readonly LoanType[] = ["INSTANT", "UNSECURED_PERSONAL", "SALARY_BACKED", "ASSET_FINANCE"];

function asLoanType(value: string): LoanType | null {
  return (KNOWN_LOAN_TYPES as readonly string[]).includes(value) ? (value as LoanType) : null;
}

/**
 * Figma "Loans Screen" (tab). RESOLVED: `GET /v1/loans/summary` now returns
 * fully typed `CustomerLoanProduct[]`/`CustomerLoan[]` (PLAN.md "Real
 * blockers"). `CustomerLoanProduct.type` is a plain string in the
 * contract, not a closed enum, so it's still validated against the known
 * 4 product types before use here.
 */
export default function LoansScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const summary = useLoanSummary();

  const styles = StyleSheet.create({
    header: {
      paddingTop: theme.semanticSpacing.section,
      marginBottom: theme.semanticSpacing.section,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
    },
    sectionLabel: {
      ...theme.typography.label,
      color: theme.colors.textMuted,
      marginBottom: theme.semanticSpacing.form,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.card,
      padding: theme.semanticSpacing.card,
      marginBottom: theme.semanticSpacing.form,
      ...theme.elevation.sm,
    },
    cardTitle: {
      ...theme.typography.h4,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    cardSubtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.textSecondary,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textMuted,
    },
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

  const eligibleProducts = summary.data?.eligibleProducts ?? [];
  const loans = summary.data?.loans ?? [];

  return (
    <ScreenContainer hasFloatingTabBar>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Loans</Text>
        </View>

        {loans.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Your loans</Text>
            {loans.map((loan) => (
              <Pressable key={loan.id} style={styles.card} onPress={() => router.push({ pathname: "/loans/repay/[loanId]", params: { loanId: loan.id } })}>
                <Text style={styles.cardTitle}>{formatMoney({ amount_minor: loan.outstanding_principal, currency: "NGN" })}</Text>
                <StatusBadge tone="info" label={loan.status} />
                <Text style={styles.cardSubtitle}>Tap to repay</Text>
              </Pressable>
            ))}
          </>
        ) : null}

        <Text style={styles.sectionLabel}>Apply for a loan</Text>
        {eligibleProducts.length === 0 ? (
          <Text style={styles.emptyText}>No loan products available right now.</Text>
        ) : (
          eligibleProducts.map((product) => {
            const loanType = asLoanType(product.type);
            return (
              <Pressable
                key={product.id}
                style={styles.card}
                onPress={() => loanType && router.push({ pathname: "/loans/[loanType]", params: { loanType, productVersionId: product.product_version_id } })}
              >
                <Text style={styles.cardTitle}>{product.name || (loanType ? LOAN_TYPE_LABELS[loanType] : "Loan product")}</Text>
                <Text style={styles.cardSubtitle}>
                  {formatMoney({ amount_minor: product.min_amount_minor, currency: "NGN" })} – {formatMoney({ amount_minor: product.max_amount_minor, currency: "NGN" })}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
