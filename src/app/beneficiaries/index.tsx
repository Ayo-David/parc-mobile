import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useBeneficiaries } from "@/api/queries/useBeneficiaries";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { avatarColorFor, firstString, initialsFor } from "@/features/beneficiaries/fieldProbe";
import { useTheme } from "@/theme";

/**
 * Figma "Beneficiaries 01 — Manage" (node 435:133, missing-mobile.md
 * §4) — a real, referenced-but-previously-undesigned screen. `GET
 * /v1/beneficiaries` was newly confirmed real this phase (previously
 * documented as entirely missing from the Mobile BFF allowlist — PLAN.md
 * "Real blockers"); this is genuinely functional, not a fixture. The
 * response has no documented schema, so `name`/`bank_code`/`bank_name` are
 * best-effort probes matching the confirmed `POST` request's own field
 * names.
 */
export default function ManageBeneficiariesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const beneficiaries = useBeneficiaries();

  const palette = [theme.colors.secondary, theme.colors.primary, theme.colors.success, theme.colors.info, theme.colors.warning];

  const styles = StyleSheet.create({
    content: { paddingTop: theme.semanticSpacing.section, gap: theme.spacing.md, paddingBottom: theme.semanticSpacing.section },
    row: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, paddingVertical: theme.semanticSpacing.form, borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
    avatar: { width: 44, height: 44, borderRadius: theme.radii.avatar + 9, alignItems: "center", justifyContent: "center" },
    avatarText: { ...theme.typography.text15ExtraBold, color: theme.colors.textInverse },
    nameCol: { flex: 1 },
    name: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    bank: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    actions: { flexDirection: "row", gap: theme.spacing.sm },
    actionButton: { width: theme.control.iconButton, height: theme.control.iconButton, borderRadius: theme.radii.sm, alignItems: "center", justifyContent: "center" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  if (beneficiaries.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const entries = beneficiaries.data ?? [];

  return (
    <ScreenContainer>
      <BackHeader title="Manage Beneficiaries" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {entries.length === 0 ? (
          <EmptyState emoji="👥" title="No saved beneficiaries" body="Beneficiaries you save while sending money will appear here." />
        ) : (
          entries.map((entry, index) => {
            const name = firstString(entry, ["name"]) ?? `Beneficiary ${index + 1}`;
            const bankName = firstString(entry, ["bank_name", "bank_code"]);
            return (
              <View key={index} style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: avatarColorFor(name, palette) }]}>
                  <Text style={styles.avatarText}>{initialsFor(name)}</Text>
                </View>
                <View style={styles.nameCol}>
                  <Text style={styles.name}>{name}</Text>
                  {bankName ? <Text style={styles.bank}>{bankName}</Text> : null}
                </View>
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: theme.colors.surfaceAlt }]}
                    onPress={() => router.push({ pathname: "/beneficiaries/[beneficiaryIndex]/edit", params: { beneficiaryIndex: String(index) } })}
                  >
                    <Ionicons name="pencil-outline" size={theme.icon.compact} color={theme.colors.textPrimary} />
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: theme.components.status.error.backgroundColor }]}
                    onPress={() => router.push({ pathname: "/beneficiaries/[beneficiaryIndex]/delete", params: { beneficiaryIndex: String(index) } })}
                  >
                    <Ionicons name="trash-outline" size={theme.icon.compact} color={theme.colors.error} />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
