import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { Button } from "@/components/Button/Button";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TextField } from "@/components/TextField/TextField";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

const REASONS = ["I didn't authorize this transaction", "Wrong amount was charged", "Money sent but recipient didn't receive it", "Other issue"];

/**
 * Figma "Account 03 — Dispute Transaction" (node 437:147,
 * missing-mobile.md §1) — the Payment service owns "disputes, reversals"
 * as a first-class domain concept (`parc-backend-development-plan.md`
 * line 149), but there's no customer-facing dispute-submission endpoint
 * anywhere in the confirmed contract, so this routes through the real
 * Support-ticket flow (MOB-18) instead of a fabricated one. The
 * transaction context card only shows the confirmed `Transaction` fields
 * (amount/date/status/id) passed in as route params from the tappable row
 * in `transactions.tsx` — there's no counterparty/narration field
 * anywhere in the real contract, and no `GET` by transaction id to
 * re-fetch richer data even if there were.
 */
export default function DisputeTransactionScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { transactionId, amountMinor, currency, occurredAt, reference } = useLocalSearchParams<{ transactionId: string; amountMinor: string; currency: string; occurredAt: string; reference?: string }>();
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const description = [`Reason: ${reason}`, `Transaction: ${transactionId}`, reference ? `Reference: ${reference}` : null, details.trim() ? `Details: ${details.trim()}` : null].filter(Boolean).join("\n");
      await api.createSupportTicket({ subject: "Transaction dispute", description });
      router.replace("/profile/support/tickets");
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.form },
    contextCard: { backgroundColor: theme.colors.background, borderRadius: theme.radii.lg, padding: theme.semanticSpacing.form, gap: theme.spacing.xs },
    contextTitle: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    contextMeta: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    sectionLabel: { ...theme.typography.text13Bold, color: theme.colors.textSecondary },
    option: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, borderRadius: theme.radii.lg, borderWidth: theme.borderWidth.thin, padding: theme.semanticSpacing.form },
    optionSelected: { borderColor: theme.colors.primary },
    optionUnselected: { borderColor: theme.colors.border },
    radioOuter: { width: theme.spacing.xl, height: theme.spacing.xl, borderRadius: theme.radii.full, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    radioInner: { width: theme.spacing.sm, height: theme.spacing.sm, borderRadius: theme.radii.full, backgroundColor: theme.colors.primary },
    optionLabel: { ...theme.typography.text14Regular, color: theme.colors.textPrimary, flex: 1 },
    error: { ...theme.typography.text12Regular, color: theme.colors.error },
  });

  const money = amountMinor && currency ? formatMoney({ amount_minor: amountMinor, currency }) : null;

  return (
    <ScreenContainer>
      <BackHeader title="Dispute Transaction" />
      <View style={styles.content}>
        <View style={styles.contextCard}>
          <Text style={styles.contextTitle}>Transaction</Text>
          <Text style={styles.contextMeta}>
            {money ?? "—"} · {occurredAt ? new Date(occurredAt).toLocaleDateString() : "—"} · Ref: {reference ?? transactionId}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>What&apos;s the issue?</Text>
        {REASONS.map((option) => {
          const isSelected = option === reason;
          return (
            <Pressable key={option} style={[styles.option, isSelected ? styles.optionSelected : styles.optionUnselected]} onPress={() => setReason(option)}>
              <View style={[styles.radioOuter, { borderColor: isSelected ? theme.colors.primary : theme.colors.border }]}>{isSelected ? <View style={styles.radioInner} /> : null}</View>
              <Text style={styles.optionLabel}>{option}</Text>
            </Pressable>
          );
        })}

        <TextField value={details} onChangeText={setDetails} placeholder="Tell us more... (optional)" multiline numberOfLines={4} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Submit dispute" onPress={handleSubmit} loading={isSubmitting} />
      </View>
    </ScreenContainer>
  );
}
