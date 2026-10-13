import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import type { LoanType } from "@/api/schemas";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TransactionResultLayout } from "@/components/TransactionResultLayout/TransactionResultLayout";
import { useLoanApplicationDraftStore } from "@/features/loans/loanApplicationDraftStore";
import { useTheme } from "@/theme";

const IN_PROGRESS_ACTIONS = new Set(["WAIT", "WAIT_FOR_REVIEW", "PROVIDE_INFORMATION"]);

/** `customer_reason_codes` are machine codes (e.g. "INSUFFICIENT_INCOME") — there's no confirmed code→copy mapping anywhere in the contract, so this humanizes the raw code rather than inventing curated prose for codes that may not even exist yet. */
function humanizeReasonCode(code: string): string {
  return code.replace(/_/g, " ").toLowerCase().replace(/^./, (char) => char.toUpperCase());
}

/**
 * Figma "Loan 02 — Application Under Review" (node 431:271) and "Loan 01 —
 * Declined" (node 431:207), missing-mobile.md §6. Previously this screen
 * was a static "we'll let you know" message that never checked the
 * application again — the most significant gap in this specific file: an
 * application that was actually declined or ready for an offer looked
 * identical to one still pending. Now it polls the real, fully-typed
 * `GET /v1/loan-applications/{id}` and branches on `next_action` (a real
 * closed enum) instead of the free-string `status` field, which has no
 * confirmed enum anywhere in the Lending contract.
 *
 * `next_action === "NONE"` is genuinely ambiguous between "declined" and
 * "approved and already disbursed" — the contract doesn't disambiguate.
 * The real, confirmed `customer_reason_codes` array is used as the signal
 * instead: reason codes only make sense to return for a negative outcome,
 * so their presence (not an assumed status string) drives the Declined
 * view. This is disclosed here rather than treated as a confirmed rule.
 */
export default function LoanApplicationStatusScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { loanType, applicationId } = useLocalSearchParams<{ loanType: LoanType; applicationId: string }>();
  const resetDraft = useLoanApplicationDraftStore((state) => state.reset);

  const application = useQuery({
    queryKey: ["loan-application", applicationId],
    queryFn: () => api.getLoanApplication(applicationId),
    refetchInterval: (query) => (query.state.data && IN_PROGRESS_ACTIONS.has(query.state.data.next_action) ? 4000 : false),
  });

  const nextAction = application.data?.next_action;

  useEffect(() => {
    if (nextAction === "REVIEW_OFFER") {
      router.replace({ pathname: "/loans/[loanType]/offer", params: { loanType, applicationId } });
    }
  }, [nextAction, loanType, applicationId, router]);

  function handleDone() {
    resetDraft();
    router.dismissTo("/(tabs)/loans");
  }

  const styles = StyleSheet.create({
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    card: { backgroundColor: theme.colors.background, borderRadius: theme.radii.card, padding: theme.semanticSpacing.form, gap: theme.spacing.sm, width: "100%" },
    cardTitle: { ...theme.typography.label, color: theme.colors.textPrimary },
    reasonRow: { flexDirection: "row", gap: theme.spacing.sm, alignItems: "flex-start" },
    bullet: { width: theme.spacing.xs, height: theme.spacing.xs, borderRadius: theme.radii.xs, backgroundColor: theme.colors.textPrimary, marginTop: theme.spacing.sm },
    reasonText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, flex: 1 },
  });

  if (application.isLoading || !application.data || nextAction === "REVIEW_OFFER") {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary }}>Loading your application…</Text>
        </View>
      </ScreenContainer>
    );
  }

  const app = application.data;
  const money = { amount_minor: app.requested_amount_minor, currency: app.currency };

  if (nextAction && IN_PROGRESS_ACTIONS.has(nextAction)) {
    return (
      <TransactionResultLayout
        tone="warning"
        title="Reviewing your application"
        money={money}
        detailLines={["This can take up to a few minutes.", "We'll notify you the moment there's a decision."]}
        primaryAction={{ label: "Back to Loans", onPress: () => router.dismissTo("/(tabs)/loans") }}
      />
    );
  }

  if (app.customer_reason_codes.length > 0) {
    return (
      <TransactionResultLayout
        tone="error"
        title="Application Declined"
        money={money}
        detailLines={["We couldn't approve this application right now."]}
        primaryAction={{ label: "See other loan options", onPress: () => router.dismissTo("/(tabs)/loans") }}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What affected this decision</Text>
          {app.customer_reason_codes.map((code) => (
            <View style={styles.reasonRow} key={code}>
              <View style={styles.bullet} />
              <Text style={styles.reasonText}>{humanizeReasonCode(code)}</Text>
            </View>
          ))}
        </View>
      </TransactionResultLayout>
    );
  }

  return <TransactionResultLayout tone="success" title="Application submitted" money={money} detailLines={["We'll let you know as soon as a decision is ready."]} primaryAction={{ label: "Done", onPress: handleDone }} />;
}
