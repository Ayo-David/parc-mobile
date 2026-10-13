import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useSupportTickets } from "@/api/queries/useSupport";
import { Button } from "@/components/Button/Button";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { firstString, ticketStatusTone } from "@/features/support/fieldProbe";
import { useTheme } from "@/theme";

/**
 * Figma "Support 03 — My Tickets" (node 433:106, missing-mobile.md §8).
 * `GET /v1/support/tickets` has no confirmed schema — subject/status/
 * reference/date are all best-effort probes (`firstString`), same as
 * the FAQ screens.
 */
export default function SupportTicketsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const tickets = useSupportTickets();

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.form },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    card: { backgroundColor: theme.colors.background, borderRadius: theme.radii.lg, padding: theme.semanticSpacing.form, gap: theme.spacing.xs },
    cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    subject: { ...theme.typography.text14Bold, color: theme.colors.textPrimary, flex: 1, marginRight: theme.spacing.sm },
    meta: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    footer: { paddingTop: theme.semanticSpacing.component, paddingBottom: theme.semanticSpacing.component },
  });

  if (tickets.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const ticketEntries = tickets.data ?? [];

  return (
    <ScreenContainer>
      <BackHeader title="My Support Tickets" />
      <View style={styles.content}>
        {ticketEntries.length === 0 ? (
          <EmptyState emoji="🎫" title="No tickets yet" body="Raise a new ticket and our support team will get back to you." />
        ) : (
          ticketEntries.map((entry, index) => {
            const subject = firstString(entry, ["subject", "title"]) ?? `Ticket ${index + 1}`;
            const status = firstString(entry, ["status"]);
            const reference = firstString(entry, ["reference", "ticket_number", "id"]);
            const date = firstString(entry, ["created_at", "date"]);
            return (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.subject}>{subject}</Text>
                  {status ? <StatusBadge tone={ticketStatusTone(status)} label={status} /> : null}
                </View>
                {reference || date ? <Text style={styles.meta}>{[reference, date].filter(Boolean).join(" · ")}</Text> : null}
              </View>
            );
          })
        )}
      </View>
      <View style={styles.footer}>
        <Button label="New ticket" onPress={() => router.push("/profile/support/new")} />
      </View>
    </ScreenContainer>
  );
}
