import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useSecuritySummary } from "@/api/queries/useSecuritySummary";
import { queryClient } from "@/api/queryClient";
import { Button } from "@/components/Button/Button";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useDeviceId } from "@/auth/useDeviceId";
import { describeSession, extractEntries, isCurrentEntry } from "@/features/security/fieldProbe";
import { useTheme } from "@/theme";

/**
 * Figma "Login Activity" (node 436:161, missing-mobile.md §8) — split out
 * of the combined `profile/security.tsx`. `DELETE
 * /v1/security/sessions/:id` is fully typed and real; the session-list
 * shape itself is still prose-only, so labels are probed defensively
 * (same as before), including which session is "this device" (no
 * confirmed field name, so it's a best-effort probe too).
 */
export default function LoginActivityScreen() {
  const { theme } = useTheme();
  const summary = useSecuritySummary();
  const deviceId = useDeviceId();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessions = summary.data ? extractEntries(summary.data, ["sessions", "active_sessions"]) : [];

  async function handleRevoke(id: string) {
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

  const styles = StyleSheet.create({
    content: { paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.form, paddingBottom: theme.semanticSpacing.section },
    card: { backgroundColor: theme.colors.background, borderRadius: theme.radii.card, padding: theme.semanticSpacing.form, gap: theme.spacing.sm },
    row: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
    iconBadge: { width: theme.control.iconButton, height: theme.control.iconButton, borderRadius: theme.radii.full, backgroundColor: theme.colors.surface, alignItems: "center", justifyContent: "center" },
    labelRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, flexWrap: "wrap" },
    label: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    meta: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    error: { ...theme.typography.text12Regular, color: theme.colors.error },
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
      <Stack.Screen options={{ title: "Login Activity" }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {sessions.length === 0 ? (
          <EmptyState emoji="🔐" title="No sessions found" body="Active login sessions for your account will appear here." />
        ) : (
          sessions.map((entry, index) => {
            const id = typeof entry.id === "string" ? entry.id : null;
            const isCurrent = isCurrentEntry(entry, deviceId);
            const { title, subtitle } = describeSession(entry);
            return (
              <View key={id ?? index} style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.iconBadge}>
                    <Ionicons name="phone-portrait-outline" size={theme.icon.compact} color={theme.colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>{title}</Text>
                      {isCurrent && deviceId ? <StatusBadge tone="success" label="This device" /> : null}
                    </View>
                    {subtitle ? <Text style={styles.meta}>{subtitle}</Text> : null}
                  </View>
                </View>
                {!isCurrent && id ? <Button label="Log out this device" variant="secondary" onPress={() => handleRevoke(id)} loading={pendingId === id} /> : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
