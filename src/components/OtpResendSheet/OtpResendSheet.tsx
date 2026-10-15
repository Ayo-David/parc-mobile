import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet/BottomSheet";
import { Button } from "@/components/Button/Button";
import { useTheme } from "@/theme";

export interface OtpResendSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Masked destination shown under SMS/WhatsApp options, e.g. "0803•••••21" — omitted for email OTP. */
  maskedDestination?: string;
}

const CHANNELS = [
  { key: "sms", icon: "chatbubble-outline" as const, label: "Resend via SMS", showDestination: true },
  { key: "whatsapp", icon: "logo-whatsapp" as const, label: "Resend via WhatsApp", showDestination: true },
  { key: "call", icon: "call-outline" as const, label: "Call me with the code", showDestination: false },
];

/**
 * Figma "Misc 02 — OTP Resend Channel Selection" (node 439:481,
 * missing-mobile.md §2.2) — shared by phone and email OTP screens. No
 * resend endpoint of any kind exists anywhere in the confirmed
 * auth-customer contract (grepped directly — not even a plain "resend the
 * same channel" operation), so every channel option here honestly
 * discloses that instead of pretending to trigger a resend. This is real,
 * reusable UI ready to wire the moment a resend endpoint exists.
 */
export function OtpResendSheet({ visible, onClose, maskedDestination }: OtpResendSheetProps) {
  const { theme } = useTheme();
  const [notice, setNotice] = useState<string | null>(null);

  const styles = StyleSheet.create({
    title: { ...theme.typography.h4, color: theme.colors.textPrimary, textAlign: "center", marginBottom: theme.spacing.xs },
    subtitle: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, textAlign: "center", marginBottom: theme.semanticSpacing.component },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.card,
      padding: theme.semanticSpacing.form,
      marginBottom: theme.spacing.sm,
    },
    iconBadge: { width: theme.control.iconButton, height: theme.control.iconButton, borderRadius: theme.radii.md, backgroundColor: theme.colors.surface, alignItems: "center", justifyContent: "center" },
    optionLabel: { ...theme.typography.label, color: theme.colors.textPrimary },
    optionMeta: { ...theme.typography.caption, color: theme.colors.textMuted },
    notice: { ...theme.typography.bodySmall, color: theme.colors.warning, textAlign: "center", marginBottom: theme.semanticSpacing.form },
  });

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Didn&apos;t get the code?</Text>
      <Text style={styles.subtitle}>Choose how you&apos;d like to receive your verification code.</Text>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {CHANNELS.map((channel) => (
        <Pressable key={channel.key} style={styles.option} onPress={() => setNotice("Resend isn't available in this app version yet — please wait for the original code or go back and start again.")}>
          <View style={styles.iconBadge}>
            <Ionicons name={channel.icon} size={theme.icon.default} color={theme.colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionLabel}>{channel.label}</Text>
            {channel.showDestination && maskedDestination ? <Text style={styles.optionMeta}>To {maskedDestination}</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={theme.icon.compact} color={theme.colors.textMuted} />
        </Pressable>
      ))}
      <Button label="Cancel" variant="tertiary" onPress={onClose} />
    </BottomSheet>
  );
}
