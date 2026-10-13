import { useLocalSearchParams, useRouter } from "expo-router";

import { useLoanSummary } from "@/api/queries/useLoanSummary";
import { TransactionResultLayout } from "@/components/TransactionResultLayout/TransactionResultLayout";

/**
 * Figma "Loan 03 — Overdue" (node 431:333, missing-mobile.md §6) —
 * deliberately scoped down from what Figma shows. `CustomerLoan` has no
 * confirmed `days_past_due`/`overdue_amount_minor`/`penalty_accrued_minor`
 * field anywhere in the Lending contract (only
 * `id/loan_number/currency/status/outstanding_principal` are documented),
 * so the "What's included" breakdown card Figma designs (overdue amount,
 * late penalty, days past due) is not built here — those would be
 * fabricated numbers, not a real gap the plan tolerates disclosing away.
 * What IS real (outstanding balance, status) is shown; "Repay now" routes
 * to the real repayment flow.
 */
export default function LoanOverdueScreen() {
  const router = useRouter();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const summary = useLoanSummary();
  const loan = summary.data?.loans.find((entry) => entry.id === loanId);

  return (
    <TransactionResultLayout
      allowBack={{ title: "Loan Overdue" }}
      tone="error"
      title="Payment overdue"
      money={loan ? { amount_minor: loan.outstanding_principal, currency: "NGN" } : undefined}
      detailLines={["This loan has an overdue payment. Repay as soon as possible to avoid further penalties."]}
      primaryAction={{ label: "Repay now", onPress: () => router.replace({ pathname: "/loans/repay/[loanId]", params: { loanId } }) }}
    />
  );
}
