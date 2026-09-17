import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBootstrap } from "@/api/queries/useBootstrap";
import type { LoanType } from "@/api/schemas";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TextField } from "@/components/TextField/TextField";
import { useLoanApplicationDraftStore } from "@/features/loans/loanApplicationDraftStore";
import { useTheme } from "@/theme";
import { formatMoney, parseMajorUnitsToMinor } from "@/utils/money";

/**
 * Figma loan-application review step. RESOLVED (PLAN.md "Real blockers" —
 * the most serious gap found this session): `underwriting_evidence`
 * (including a client-asserted `fraud_flag`) has been removed from the
 * request entirely. The client now only declares its own monthly income
 * (a normal, honest thing to ask a customer) and a consent reference — the
 * backend computes authoritative underwriting evidence itself.
 */
export default function LoanReviewScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const bootstrap = useBootstrap();
  const { loanType } = useLocalSearchParams<{ loanType: LoanType }>();
  const draft = useLoanApplicationDraftStore();
  const [monthlyIncomeNaira, setMonthlyIncomeNaira] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const declaredMonthlyIncomeMinor = parseMajorUnitsToMinor(monthlyIncomeNaira);
  const canSubmit = !!draft.productVersionId && !!draft.amountMinor && !!draft.tenor && !!declaredMonthlyIncomeMinor;

  async function handleSubmit() {
    if (!canSubmit || !draft.productVersionId || !draft.amountMinor || !draft.tenor || !declaredMonthlyIncomeMinor) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const referenceData = await api.getOnboardingReferenceData(bootstrap.data!.tenant_id);
      const consentReference = referenceData.consent_documents[0]?.id;
      if (!consentReference) {
        setError("No consent document is configured for this tenant.");
        return;
      }
      const application = await api.submitLoanApplication({
        productVersionId: draft.productVersionId,
        amountMinor: draft.amountMinor,
        currency: "NGN",
        tenureDays: draft.tenor,
        purpose: draft.purpose,
        declaredMonthlyIncomeMinor,
        consentReference,
        correlationId: randomUUID(),
        idempotencyKey: createIdempotencyKey(),
      });
      router.replace({ pathname: "/loans/[loanType]/success", params: { loanType, applicationId: application.application_id } });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "We couldn't submit your application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    content: {
      flex: 1,
      paddingTop: theme.semanticSpacing.section,
      gap: theme.semanticSpacing.form,
    },
    title: { ...theme.typography.h2, color: theme.colors.textPrimary, marginBottom: theme.semanticSpacing.section },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: theme.semanticSpacing.form, borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
    label: { ...theme.typography.bodyMedium, color: theme.colors.textSecondary },
    value: { ...theme.typography.bodyMedium, fontWeight: "600", color: theme.colors.textPrimary },
    error: { ...theme.typography.bodySmall, color: theme.colors.error, marginTop: theme.semanticSpacing.component },
    footer: { paddingTop: theme.semanticSpacing.component, paddingBottom: theme.semanticSpacing.component },
  });

  const quote = draft.quote;

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Review application</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>{draft.amountMinor ? formatMoney({ amount_minor: draft.amountMinor, currency: "NGN" }) : "—"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tenure</Text>
          <Text style={styles.value}>{draft.tenor} days</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Purpose</Text>
          <Text style={styles.value}>{draft.purpose}</Text>
        </View>
        {quote ? (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Total interest</Text>
              <Text style={styles.value}>{formatMoney({ amount_minor: quote.totalInterestMinor, currency: quote.currency })}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total fees</Text>
              <Text style={styles.value}>{formatMoney({ amount_minor: quote.totalFeesMinor, currency: quote.currency })}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total repayable</Text>
              <Text style={styles.value}>{formatMoney({ amount_minor: quote.totalRepayableMinor, currency: quote.currency })}</Text>
            </View>
          </>
        ) : null}
        <TextField value={monthlyIncomeNaira} onChangeText={setMonthlyIncomeNaira} placeholder="Your monthly income (₦)" keyboardType="decimal-pad" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <View style={styles.footer}>
        <Button label="Submit Application" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />
      </View>
    </ScreenContainer>
  );
}
