import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useFaqs, useSupportTickets } from "@/api/queries/useSupport";
import { queryClient } from "@/api/queryClient";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { TextField } from "@/components/TextField/TextField";
import { useTheme } from "@/theme";

function firstString(record: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    const value = record[field];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

/**
 * Figma "Help & Support" screen. `GET /v1/support/faqs`, `GET/POST
 * /v1/support/tickets` all document no response schema (PLAN.md "Real
 * blockers") — FAQ/ticket fields and the ticket-creation body are all
 * best-effort probes/guesses, not confirmed shapes.
 */
export default function SupportScreen() {
  const { theme } = useTheme();
  const faqs = useFaqs();
  const tickets = useSupportTickets();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = subject.trim().length >= 3 && message.trim().length >= 3;

  async function handleCreateTicket() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.createSupportTicket({ subject: subject.trim(), message: message.trim() });
      setSubject("");
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = StyleSheet.create({
    content: { paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.form, paddingBottom: theme.semanticSpacing.section },
    sectionLabel: { ...theme.typography.label, color: theme.colors.textMuted, marginTop: theme.semanticSpacing.section },
    card: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.card, padding: theme.semanticSpacing.card, gap: theme.spacing.xs, ...theme.elevation.sm },
    question: { ...theme.typography.h4, color: theme.colors.textPrimary },
    answer: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
    ticketSubject: { ...theme.typography.bodyMedium, color: theme.colors.textPrimary, fontWeight: "600" },
    emptyText: { ...theme.typography.bodyMedium, color: theme.colors.textMuted },
    error: { ...theme.typography.bodySmall, color: theme.colors.error },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  if (faqs.isLoading || tickets.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const faqEntries = faqs.data ?? [];
  const ticketEntries = tickets.data ?? [];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Frequently asked questions</Text>
        {faqEntries.length === 0 ? (
          <Text style={styles.emptyText}>No FAQs available right now.</Text>
        ) : (
          faqEntries.map((entry, index) => {
            const question = firstString(entry, ["question", "title"]) ?? `Question ${index + 1}`;
            const answer = firstString(entry, ["answer", "body"]);
            return (
              <View key={index} style={styles.card}>
                <Text style={styles.question}>{question}</Text>
                {answer ? <Text style={styles.answer}>{answer}</Text> : null}
              </View>
            );
          })
        )}

        <Text style={styles.sectionLabel}>Your support tickets</Text>
        {ticketEntries.length === 0 ? (
          <Text style={styles.emptyText}>No support tickets yet.</Text>
        ) : (
          ticketEntries.map((entry, index) => {
            const subjectText = firstString(entry, ["subject", "title"]) ?? `Ticket ${index + 1}`;
            const status = firstString(entry, ["status"]);
            return (
              <View key={index} style={styles.card}>
                <Text style={styles.ticketSubject}>{subjectText}</Text>
                {status ? <StatusBadge tone="info" label={status} /> : null}
              </View>
            );
          })
        )}

        <Text style={styles.sectionLabel}>Contact support</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextField value={subject} onChangeText={setSubject} placeholder="Subject" />
        <TextField value={message} onChangeText={setMessage} placeholder="How can we help?" multiline numberOfLines={4} />
        <Button label="Send" onPress={handleCreateTicket} disabled={!canSubmit} loading={isSubmitting} />
      </ScrollView>
    </ScreenContainer>
  );
}
