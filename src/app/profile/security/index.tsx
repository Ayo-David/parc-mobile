import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

const MENU_ITEMS = [
  { label: "Login Activity", icon: "time-outline" as const, href: "/profile/security/sessions" as const },
  { label: "Linked Devices", icon: "phone-portrait-outline" as const, href: "/profile/security/devices" as const },
];

/**
 * Figma "Security & Privacy" hub. RESOLVED this phase (previously
 * documented as read-only-only, PLAN.md "Real blockers"): session/device
 * revocation (`DELETE /v1/security/sessions/:id`, `DELETE /v1/devices/:id`)
 * are confirmed real — see the dedicated `sessions.tsx`/`devices.tsx`
 * screens this hub now links to, split out of what used to be one combined
 * screen (Figma "Beneficiaries 04/05 — Login Activity"/"Linked Devices",
 * nodes 436:161/436:253, missing-mobile.md §4/§8).
 */
export default function SecurityHomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    content: { paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.form, paddingBottom: theme.semanticSpacing.section },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.semanticSpacing.form,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.card,
      padding: theme.semanticSpacing.card,
      ...theme.elevation.sm,
    },
    menuLabel: { ...theme.typography.bodyMedium, color: theme.colors.textPrimary, flex: 1 },
  });

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: "Security & Privacy" }} />
      <View style={styles.content}>
        <Button label="Change transaction PIN" onPress={() => router.push("/security/transaction-pin/create")} />
        {MENU_ITEMS.map((item) => (
          <Pressable key={item.href} style={styles.menuItem} onPress={() => router.push(item.href)}>
            <Ionicons name={item.icon} size={theme.icon.default} color={theme.colors.textSecondary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={theme.icon.compact} color={theme.colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}
