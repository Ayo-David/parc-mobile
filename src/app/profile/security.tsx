import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useSecuritySummary } from "@/api/queries/useSecuritySummary";
import { queryClient } from "@/api/queryClient";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

const LABEL_FIELDS = ["device_name", "name", "description", "user_agent", "ip_address", "last_seen_at", "last_active_at", "created_at"];

/** Best-effort label from an entry whose shape isn't documented anywhere (see PLAN.md "Real blockers"). */
function describeEntry(entry: Record<string, unknown>): string {
  const parts = LABEL_FIELDS.map((field) => entry[field]).filter((value): value is string => typeof value === "string" && value.length > 0);
  return parts.length > 0 ? parts.join(" · ") : typeof entry.id === "string" ? entry.id : "Unknown";
}

function extractEntries(summary: Record<string, unknown>, keys: string[]): Array<Record<string, unknown>> {
  for (const key of keys) {
    const value = summary[key];
    if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
  }
  return [];
}

/**
 * Figma "Security" screen. `GET /v1/security` documents no response schema
 * beyond "masked credentials, trusted devices, and active sessions" (PLAN.md
 * "Real blockers") — this defensively probes a few plausible field names
 * for the sessions/devices arrays and their per-entry labels rather than
 * assuming a shape. Revoke actions (`DELETE /v1/security/sessions/:id`,
 * `DELETE /v1/devices/:id`) and transaction-PIN rotation are fully typed
 * and real.
 */
export default function SecurityScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const summary = useSecuritySummary();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessions = summary.data ? extractEntries(summary.data, ["sessions", "active_sessions"]) : [];
  const devices = summary.data ? extractEntries(summary.data, ["devices", "trusted_devices"]) : [];

  async function handleRevokeSession(id: string) {
    setPendingId(id);
    setError(null);
    try {
      await api.revokeSession(id);
      await queryClient.invalidateQueries({ queryKey: ["security-summary"] });
    } catch (revokeError) {
      setError(revokeError instanceof ApiError ? revokeError.message : "Something went wrong. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleRevokeDevice(id: string) {
    setPendingId(id);
    setError(null);
    try {
      await api.revokeDevice(id);
      await queryClient.invalidateQueries({ queryKey: ["security-summary"] });
    } catch (revokeError) {
      setError(revokeError instanceof ApiError ? revokeError.message : "Something went wrong. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  const styles = StyleSheet.create({
    content: { paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.form, paddingBottom: theme.semanticSpacing.section },
    sectionLabel: { ...theme.typography.label, color: theme.colors.textMuted, marginTop: theme.semanticSpacing.section },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.card,
      padding: theme.semanticSpacing.card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.semanticSpacing.form,
      ...theme.elevation.sm,
    },
    cardLabel: { ...theme.typography.bodySmall, color: theme.colors.textPrimary, flex: 1 },
    emptyText: { ...theme.typography.bodyMedium, color: theme.colors.textMuted },
    error: { ...theme.typography.bodySmall, color: theme.colors.error },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
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

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Change transaction PIN" onPress={() => router.push("/security/transaction-pin/create")} />

        <Text style={styles.sectionLabel}>Active sessions</Text>
        {sessions.length === 0 ? (
          <Text style={styles.emptyText}>No active sessions found.</Text>
        ) : (
          sessions.map((entry, index) => {
            const id = typeof entry.id === "string" ? entry.id : null;
            return (
              <View key={id ?? index} style={styles.card}>
                <Text style={styles.cardLabel}>{describeEntry(entry)}</Text>
                {id ? <Button label="Revoke" variant="destructive" size="small" onPress={() => handleRevokeSession(id)} loading={pendingId === id} /> : null}
              </View>
            );
          })
        )}

        <Text style={styles.sectionLabel}>Trusted devices</Text>
        {devices.length === 0 ? (
          <Text style={styles.emptyText}>No trusted devices found.</Text>
        ) : (
          devices.map((entry, index) => {
            const id = typeof entry.id === "string" ? entry.id : null;
            return (
              <View key={id ?? index} style={styles.card}>
                <Text style={styles.cardLabel}>{describeEntry(entry)}</Text>
                {id ? <Button label="Revoke" variant="destructive" size="small" onPress={() => handleRevokeDevice(id)} loading={pendingId === id} /> : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
