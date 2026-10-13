import { useQuery } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { createIdempotencyKey } from "@/api/idempotency";
import { useBootstrap } from "@/api/queries/useBootstrap";
import type { LoanType } from "@/api/schemas";
import { Button } from "@/components/Button/Button";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TransactionPinSheet } from "@/components/TransactionPinSheet/TransactionPinSheet";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

interface ScheduleRow {
  installment_number?: number;
  due_date?: string;
  total_minor?: string;
}

/**
 * Figma "Loan 07 — Agreement (E-Signature)" (node 438:185,
 * missing-mobile.md §6). This is the real functional home for that screen,
 * not a decorative document viewer: `api.getLoanOffer`/`api.acceptLoanOffer`
 * already existed fully built in `api/client.ts` before this phase but no
 * screen called either — applications had no way to ever become a funded
 * loan. Presenting the binding schedule and requiring an explicit PIN
 * authorization before calling accept *is* the e-signature moment.
 *
 * Genuine, disclosed contract gap: `CustomerLoanOffer`'s confirmed GET
 * response only documents `id/application_id/status/schedule` — the
 * `offer_version`/`document_hash` values `acceptLoanOffer` requires
 * verbatim (to prove the customer is agreeing to the exact offer version
 * the backend generated) aren't in that documented shape at all, even
 * though the schema allows extra fields (`additionalProperties: true`).
 * This probes for them defensively and disables acceptance with an honest
 * explanation if they're missing, rather than guessing values that would
 * make the accept call fail against a real backend anyway.
 */
export default function LoanOfferScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const bootstrap = useBootstrap();
  const { loanType, applicationId } = useLocalSearchParams<{ loanType: LoanType; applicationId: string }>();
  const [isPinVisible, setIsPinVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const offerQuery = useQuery({ queryKey: ["loan-offer", applicationId], queryFn: () => api.getLoanOffer(applicationId) });
  const offer = offerQuery.data as (typeof offerQuery.data & Record<string, unknown>) | undefined;

  const offerVersion = typeof offer?.offer_version === "number" ? offer.offer_version : undefined;
  const documentHash = typeof offer?.document_hash === "string" ? offer.document_hash : undefined;
  const canAccept = offerVersion !== undefined && documentHash !== undefined;
  const scheduleRows: ScheduleRow[] = Array.isArray(offer?.schedule) ? (offer!.schedule as ScheduleRow[]) : [];

  async function handleAuthorized(authorizationToken: string) {
    if (!offer || offerVersion === undefined || documentHash === undefined || !bootstrap.data) return;
    setIsPinVisible(false);
    setIsAccepting(true);
    setError(null);
    try {
      const referenceData = await api.getOnboardingReferenceData(bootstrap.data.tenant_id);
      const consentReference = referenceData.consent_documents[0]?.id;
      if (!consentReference) {
        setError("No consent document is configured for this tenant.");
        return;
      }
      const acceptance = await api.acceptLoanOffer({
        offerId: offer.id,
        offerVersion,
        documentHash,
        consentReference,
        authorizationToken,
        correlationId: randomUUID(),
        idempotencyKey: createIdempotencyKey(),
      });
      router.replace({ pathname: "/loans/[loanType]/approved", params: { loanType, loanId: acceptance.loanId } });
    } catch (acceptError) {
      setError(acceptError instanceof ApiError ? acceptError.message : "We couldn't confirm this went through. Please check your loans tab before trying again.");
    } finally {
      setIsAccepting(false);
    }
  }

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.form },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    title: { ...theme.typography.h2, color: theme.colors.textPrimary },
    subtitle: { ...theme.typography.bodyMedium, color: theme.colors.textSecondary },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: theme.semanticSpacing.form, borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
    label: { ...theme.typography.bodyMedium, color: theme.colors.textSecondary },
    value: { ...theme.typography.bodyMedium, fontWeight: "600", color: theme.colors.textPrimary },
    notice: {
      ...theme.typography.bodySmall,
      color: theme.colors.warning,
      backgroundColor: theme.components.status.warning.backgroundColor,
      borderRadius: theme.radii.card,
      padding: theme.semanticSpacing.form,
    },
    error: { ...theme.typography.bodySmall, color: theme.colors.error },
    footer: { paddingTop: theme.semanticSpacing.component, paddingBottom: theme.semanticSpacing.component },
  });

  if (offerQuery.isLoading) {
    return (
      <ScreenContainer>
        <BackHeader title="Loan Offer" />
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!offer) {
    return (
      <ScreenContainer>
        <BackHeader title="Loan Offer" />
        <View style={styles.content}>
          <Text style={styles.subtitle}>We couldn&apos;t load your loan offer. Please try again shortly.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <BackHeader title="Loan Offer" />
      <View style={styles.content}>
        <Text style={styles.title}>Your loan offer</Text>
        <Text style={styles.subtitle}>Review the repayment schedule below before accepting.</Text>

        {scheduleRows.length > 0 ? (
          scheduleRows.map((row, index) => (
            <View style={styles.row} key={row.installment_number ?? index}>
              <Text style={styles.label}>
                Installment {row.installment_number ?? index + 1}
                {row.due_date ? ` · ${row.due_date}` : ""}
              </Text>
              <Text style={styles.value}>{row.total_minor ? formatMoney({ amount_minor: row.total_minor, currency: "NGN" }) : "—"}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.subtitle}>Your repayment schedule isn&apos;t available yet.</Text>
        )}

        {!canAccept ? (
          <Text style={styles.notice}>
            We can&apos;t confirm this offer&apos;s version details yet, so acceptance isn&apos;t available in this build. Please check back shortly or contact support.
          </Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <View style={styles.footer}>
        <Button label="Accept & Sign" onPress={() => setIsPinVisible(true)} disabled={!canAccept} loading={isAccepting} />
      </View>
      {canAccept ? (
        <TransactionPinSheet
          visible={isPinVisible}
          onClose={() => setIsPinVisible(false)}
          commandType="LOAN_OFFER_ACCEPT"
          resourceId={offer.id}
          requestPayload={{ offer_version: offerVersion, document_hash: documentHash }}
          onAuthorized={handleAuthorized}
        />
      ) : null}
    </ScreenContainer>
  );
}
