import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useBeneficiaries } from "@/api/queries/useBeneficiaries";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { avatarColorFor, firstString, initialsFor } from "@/features/beneficiaries/fieldProbe";
import { useTheme, withAlpha } from "@/theme";

/**
 * Figma "PaymentScreen" (233:8859, re-verified 2026-09-21 against the
 * current dashboard export — supersedes the earlier 232:7305 pull, which
 * was stale: that version still had an "Internet" tile and labeled this
 * category "Cable TV"). The current design has 5 tiles, not 6 — Internet
 * was dropped entirely, and "Cable TV" was renamed "TV-Cable" (label
 * only; the route/key stays `cable_tv`, matching the real
 * `billCategorySchema` enum in `@/api/schemas`, which AGENTS.md's "do not
 * silently change enums" rule means this file can't rename). Chip colors
 * reuse `theme.components.status.{warning,info,success}` rather than new
 * tokens — their backgroundColor/borderColor values are pixel-identical
 * to this screen's Airtime/Data/TV-Cable tiles, so a new semantic token
 * would just duplicate an existing one (.clauderules rule 4). Electricity
 * reuses `secondarySubtle`; Transfer reuses `primarySubtle` — both
 * already exist. Beneficiary rows use the same `fieldProbe` best-effort
 * field-name probing as `/beneficiaries` (see that screen's doc comment —
 * `GET /v1/beneficiaries` has no documented response schema).
 */
export default function PaymentsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const beneficiaries = useBeneficiaries();
  const beneficiariesData = beneficiaries.data;

  const avatarPalette = [theme.colors.secondary, theme.colors.primary, theme.colors.success, theme.colors.info, theme.colors.warning];

  const billCategories: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; bg: string; border: string; route: string }[] = [
    { key: "airtime", label: "Airtime", icon: "call-outline", bg: theme.components.status.warning.backgroundColor, border: theme.components.status.warning.borderColor, route: "/bills/airtime" },
    { key: "data", label: "Data", icon: "wifi-outline", bg: theme.components.status.info.backgroundColor, border: theme.components.status.info.borderColor, route: "/bills/data" },
    { key: "electricity", label: "Electricity", icon: "flash-outline", bg: theme.colors.secondarySubtle, border: withAlpha(theme.colors.secondary, 0.13), route: "/bills/electricity" },
    { key: "cable_tv", label: "TV-Cable", icon: "tv-outline", bg: theme.components.status.success.backgroundColor, border: theme.components.status.success.borderColor, route: "/bills/cable_tv" },
    { key: "transfer", label: "Transfer", icon: "repeat-outline", bg: theme.colors.primarySubtle, border: theme.colors.border, route: "/transfers" },
  ];

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: theme.semanticSpacing.component,
    },
    title: { ...theme.typography.text22ExtraBold, color: theme.colors.textPrimary },
    historyButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs + 2,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 7,
      borderRadius: theme.radii.chip + 1,
      backgroundColor: theme.colors.primarySubtle,
    },
    historyLabel: { ...theme.typography.text12Bold, color: theme.colors.textSecondary },
    sendCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md + 2,
      marginTop: theme.semanticSpacing.card,
      paddingHorizontal: theme.semanticSpacing.card,
      paddingVertical: theme.spacing.lg + 2,
      borderRadius: theme.radii.card,
      backgroundColor: theme.colors.surfaceInverse,
      overflow: "hidden",
    },
    sendCardDecor: {
      position: "absolute",
      top: -20,
      right: -20,
      width: 100,
      height: 100,
      borderRadius: theme.radii.full,
      backgroundColor: withAlpha(theme.colors.secondary, 0.12),
    },
    sendIconCircle: {
      width: 48,
      height: 48,
      borderRadius: theme.radii.quickAction - 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.secondary,
    },
    sendCardBody: { flex: 1, gap: 2 },
    sendCardTitle: { ...theme.typography.text16ExtraBold, color: theme.colors.textInverse },
    sendCardSubtitle: { ...theme.typography.text12Regular, color: withAlpha(theme.colors.textInverse, 0.5) },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: theme.semanticSpacing.card,
    },
    sectionTitle: { ...theme.typography.text15Bold, color: theme.colors.textPrimary },
    sectionLink: { ...theme.typography.text13SemiBold, color: theme.colors.secondary },
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      paddingTop: theme.spacing.md,
    },
    chip: {
      width: "31%",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.radii.lg,
      borderWidth: theme.borderWidth.thin,
    },
    chipLabel: { ...theme.typography.text12Bold, color: theme.colors.textPrimary },
    beneficiaryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md + 2,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: theme.borderWidth.thin,
      borderBottomColor: theme.colors.primarySubtle,
    },
    beneficiaryAvatar: {
      width: 44,
      height: 44,
      borderRadius: theme.radii.avatar + 9,
      alignItems: "center",
      justifyContent: "center",
    },
    beneficiaryAvatarLabel: { ...theme.typography.text15ExtraBold, color: theme.colors.textInverse },
    beneficiaryInfo: { flex: 1, gap: 1 },
    beneficiaryName: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    beneficiaryBank: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    sendButton: {
      paddingHorizontal: theme.spacing.md + 2,
      paddingVertical: 7,
      borderRadius: theme.radii.chip,
      backgroundColor: theme.colors.primarySubtle,
    },
    sendButtonLabel: { ...theme.typography.text12Bold, color: theme.colors.textPrimary },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: theme.semanticSpacing.section },
    emptyText: { ...theme.typography.text12Regular, color: theme.colors.textMuted, paddingTop: theme.spacing.md },
  });

  const entries = beneficiariesData ?? [];

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Payments</Text>
          <Pressable style={styles.historyButton} onPress={() => router.push("/transactions")} accessibilityRole="button" accessibilityLabel="History">
            <Ionicons name="receipt-outline" size={15} color={theme.colors.textSecondary} />
            <Text style={styles.historyLabel}>History</Text>
          </Pressable>
        </View>

        <Pressable style={styles.sendCard} onPress={() => router.push("/transfers")} accessibilityRole="button" accessibilityLabel="Send Money">
          <View style={styles.sendCardDecor} />
          <View style={styles.sendIconCircle}>
            <Ionicons name="paper-plane-outline" size={22} color={theme.colors.textInverse} />
          </View>
          <View style={styles.sendCardBody}>
            <Text style={styles.sendCardTitle}>Send Money</Text>
            <Text style={styles.sendCardSubtitle}>Transfer to any Nigerian bank instantly</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={withAlpha(theme.colors.textInverse, 0.4)} />
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bills & Services</Text>
        </View>
        <View style={styles.chipGrid}>
          {billCategories.map((category) => (
            <Pressable
              key={category.key}
              style={[styles.chip, { backgroundColor: category.bg, borderColor: category.border }]}
              onPress={() => router.push(category.route as never)}
              accessibilityRole="button"
              accessibilityLabel={category.label}
            >
              <Ionicons name={category.icon} size={22} color={theme.colors.textPrimary} />
              <Text style={styles.chipLabel}>{category.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Beneficiaries</Text>
          <Pressable onPress={() => router.push("/beneficiaries")} accessibilityRole="button">
            <Text style={styles.sectionLink}>Manage</Text>
          </Pressable>
        </View>
        {beneficiaries.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : entries.length === 0 ? (
          <Text style={styles.emptyText}>No saved beneficiaries yet.</Text>
        ) : (
          entries.slice(0, 4).map((entry, index) => {
            const name = firstString(entry, ["name"]) ?? `Beneficiary ${index + 1}`;
            const bankName = firstString(entry, ["bank_name", "bank_code"]);
            return (
              <View key={index} style={styles.beneficiaryRow}>
                <View style={[styles.beneficiaryAvatar, { backgroundColor: avatarColorFor(name, avatarPalette) }]}>
                  <Text style={styles.beneficiaryAvatarLabel}>{initialsFor(name)}</Text>
                </View>
                <View style={styles.beneficiaryInfo}>
                  <Text style={styles.beneficiaryName}>{name}</Text>
                  {bankName ? <Text style={styles.beneficiaryBank}>{bankName}</Text> : null}
                </View>
                <Pressable style={styles.sendButton} onPress={() => router.push("/transfers")} accessibilityRole="button" accessibilityLabel={`Send to ${name}`}>
                  <Text style={styles.sendButtonLabel}>Send</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
