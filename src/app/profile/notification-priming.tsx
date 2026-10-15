import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

/**
 * Figma "Account 04 — Push Notification Priming" (node 437:201,
 * missing-mobile.md §8/§9) — the standard "explain before the OS prompt"
 * pattern. Buildable now with no backend/SDK dependency, but the actual
 * OS permission request stays deferred: `expo-notifications` (needed to
 * request the permission and obtain a device push token for
 * `api.registerPushToken`, already built) is a new native dependency not
 * yet installed, same disclosed gap as MOB-13. "Enable notifications"
 * opens the OS Settings app as an honest fallback rather than a dead
 * button or a fake success state.
 */
export default function NotificationPrimingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  const styles = StyleSheet.create({
    content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: theme.semanticSpacing.section, gap: theme.semanticSpacing.component },
    iconBadge: {
      width: theme.control.iconButtonXl + theme.spacing.lg,
      height: theme.control.iconButtonXl + theme.spacing.lg,
      borderRadius: theme.radii.full,
      backgroundColor: theme.colors.secondarySubtle,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { ...theme.typography.text22ExtraBold, color: theme.colors.textPrimary, textAlign: "center" },
    body: { ...theme.typography.text14Regular, color: theme.colors.textSecondary, textAlign: "center" },
    notice: { ...theme.typography.text12Regular, color: theme.colors.textMuted, textAlign: "center" },
    footer: { width: "100%", paddingHorizontal: theme.semanticSpacing.screenX, paddingBottom: theme.semanticSpacing.section, gap: theme.semanticSpacing.form },
  });

  return (
    <ScreenContainer>
      <BackHeader title="Notifications" />
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Ionicons name="notifications-outline" size={theme.icon.large} color={theme.colors.secondary} />
        </View>
        <Text style={styles.title}>Stay on top of your money</Text>
        <Text style={styles.body}>Turn on notifications to get instant alerts for transfers, bill payments, savings goals, and login activity — so you&apos;re never caught off guard.</Text>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </View>
      <View style={styles.footer}>
        <Button
          label="Enable notifications"
          onPress={() => {
            setNotice("Opening Settings — push notifications for this app aren't available in this build yet, but you can revisit this anytime.");
            void Linking.openSettings();
          }}
        />
        <Button label="Not now" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenContainer>
  );
}
