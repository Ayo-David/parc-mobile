import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useSecuritySummary } from "@/api/queries/useSecuritySummary";
import { queryClient } from "@/api/queryClient";
import { Button } from "@/components/Button/Button";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useDeviceId } from "@/auth/useDeviceId";
import { describeDevice, extractEntries, isCurrentEntry } from "@/features/security/fieldProbe";
import { useTheme } from "@/theme";

/**
 * Figma "Linked Devices" (node 436:253, missing-mobile.md §8) — split out
 * of the combined `profile/security.tsx`. `DELETE /v1/devices/:id` is
 * fully typed and real; device-list shape is still prose-only, same
 * defensive-probing pattern as Login Activity.
 *
 * Figma's checkbox-per-row + single bottom "Remove device" button implies
 * multi-select rather than the previous per-row button. There's no bulk
 * revoke endpoint, so multi-select here fires one real `api.revokeDevice`
 * call per checked device sequentially — a real UI improvement over the
 * per-row button, not a new capability the backend doesn't have.
 */
export default function LinkedDevicesScreen() {
  const { theme } = useTheme();
  const summary = useSecuritySummary();
  const deviceId = useDeviceId();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const devices = summary.data ? extractEntries(summary.data, ["devices", "trusted_devices"]) : [];

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleRemoveSelected() {
    if (selectedIds.size === 0) return;
    setIsRemoving(true);
    setError(null);
    try {
      for (const id of selectedIds) {
        await api.revokeDevice(id);
      }
      setSelectedIds(new Set());
      await queryClient.invalidateQueries({ queryKey: ["security-summary"] });
    } catch (revokeError) {
      setError(revokeError instanceof ApiError ? revokeError.message : "Something went wrong. Please try again.");
    } finally {
      setIsRemoving(false);
    }
  }

  const styles = StyleSheet.create({
    content: { paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.form, paddingBottom: theme.semanticSpacing.section },
    subtitle: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    card: { backgroundColor: theme.colors.background, borderRadius: theme.radii.lg, padding: theme.semanticSpacing.form, gap: theme.spacing.sm },
    row: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
    checkbox: { width: 22, height: 22, borderRadius: theme.radii.sm, borderWidth: theme.borderWidth.thin, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center" },
    checkboxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    iconBadge: { width: theme.control.iconButton, height: theme.control.iconButton, borderRadius: theme.radii.full, backgroundColor: theme.colors.surface, alignItems: "center", justifyContent: "center" },
    labelRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, flexWrap: "wrap" },
    label: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    error: { ...theme.typography.text12Regular, color: theme.colors.error },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    footer: { paddingTop: theme.semanticSpacing.form },
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

  const removableDevices = devices.filter((entry) => !isCurrentEntry(entry, deviceId) && typeof entry.id === "string");

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: "Linked Devices" }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Devices with biometric login or a saved passcode for your account.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {devices.length === 0 ? (
          <EmptyState emoji="📱" title="No linked devices" body="Devices you've enrolled for biometric login will appear here." />
        ) : (
          devices.map((entry, index) => {
            const id = typeof entry.id === "string" ? entry.id : null;
            const isCurrent = isCurrentEntry(entry, deviceId);
            const { title, subtitle: detail } = describeDevice(entry);
            const isSelected = !!id && selectedIds.has(id);
            return (
              <Pressable key={id ?? index} style={styles.card} onPress={() => id && !isCurrent && toggleSelected(id)} disabled={isCurrent || !id} accessibilityRole={id && !isCurrent ? "checkbox" : undefined}>
                <View style={styles.row}>
                  {!isCurrent && id ? <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>{isSelected ? <Ionicons name="checkmark" size={14} color={theme.colors.textInverse} /> : null}</View> : null}
                  <View style={styles.iconBadge}>
                    <Ionicons name="phone-portrait-outline" size={theme.icon.compact} color={theme.colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>{title}</Text>
                      {isCurrent && deviceId ? <StatusBadge tone="success" label="This device" /> : null}
                    </View>
                    {detail ? <Text style={styles.subtitle}>{detail}</Text> : null}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
      {removableDevices.length > 0 ? (
        <View style={styles.footer}>
          <Button label="Remove device" variant="destructive" onPress={handleRemoveSelected} disabled={selectedIds.size === 0} loading={isRemoving} />
        </View>
      ) : null}
    </ScreenContainer>
  );
}
