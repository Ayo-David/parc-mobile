import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";
import { getDraftBvn, getDraftIdentityName, maskNamePart } from "@/features/onboarding/identityDraft";
import { useTheme } from "@/theme";

const COLLECTION_POINTS = [
  { icon: "person-outline" as const, title: "What we collect", body: "A short liveness video and one face photo, matched against your BVN record" },
  { icon: "time-outline" as const, title: "How long we keep it", body: "Retained for your relationship with Parc plus 5 years, per CBN KYC rules" },
  { icon: "lock-closed-outline" as const, title: "Never shared", body: "Only used to verify your identity — never sold or used for marketing" },
];

/**
 * Figma "Liveness 01 — Consent" (node 425:32, missing-mobile.md §2.1) —
 * the biometric-consent explanation that gap doc flagged as missing
 * entirely, distinct from the general Terms-of-Service checkbox at
 * registration. Entry point for `/(onboarding)/face` (see
 * features/onboarding/navigation.ts — unchanged, since a route folder's
 * index.tsx resolves the same as the old single file did).
 *
 * When the BVN lookup just succeeded, the record it matched (BVN plus
 * first name, and middle/last names masked to their first three letters)
 * is shown first so the customer can confirm it's theirs before the scan.
 * The draft lives in memory only, so after an app restart the card is
 * simply omitted.
 */
export default function FaceConsentScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const bvn = getDraftBvn();
  const identityName = getDraftIdentityName();
  const identityRows = identityName
    ? [
        { label: "BVN", value: bvn, isName: false },
        { label: "First Name", value: identityName.first_name.trim().toUpperCase(), isName: true },
        { label: "Middle Name", value: identityName.middle_name ? maskNamePart(identityName.middle_name) : null, isName: true },
        { label: "Last Name", value: maskNamePart(identityName.last_name), isName: true },
      ].filter((row): row is { label: string; value: string; isName: boolean } => Boolean(row.value))
    : [];

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.card,
      padding: theme.semanticSpacing.card,
      gap: theme.semanticSpacing.component,
      marginBottom: theme.semanticSpacing.section,
    },
    row: {
      flexDirection: "row",
      gap: theme.spacing.md,
      alignItems: "flex-start",
    },
    rowText: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    rowTitle: {
      ...theme.typography.bodySmall,
      fontFamily: theme.typography.label.fontFamily,
      fontWeight: theme.typography.label.fontWeight,
      color: theme.colors.textPrimary,
    },
    rowBody: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
    },
    identityCard: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.card,
      padding: theme.semanticSpacing.card,
      gap: theme.semanticSpacing.component,
      marginBottom: theme.semanticSpacing.component,
    },
    identityRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    identityLabel: {
      ...theme.typography.text14Regular,
      color: theme.colors.textSecondary,
    },
    identityValue: {
      ...theme.typography.text14BoldFigure,
      color: theme.colors.textPrimary,
    },
    identityName: {
      ...theme.typography.text14Bold,
      color: theme.colors.secondary,
    },
    caption: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
  });

  return (
    <StatusScreenLayout
      icon="shield-checkmark"
      tone="primary"
      title="Verify it's really you"
      body="We use a quick face scan to confirm you match your BVN record and to stop anyone else opening an account in your name."
      // Opens as a fresh step stack; BVN is already submitted, so there's nothing to go back to.
      showBackButton={router.canGoBack()}
      footer={
        <>
          <Button label="Continue to camera" onPress={() => router.push("/(onboarding)/face/capture")} />
          <Text style={styles.caption}>By continuing, you consent to Parc collecting this biometric data for identity verification.</Text>
        </>
      }
    >
      {identityRows.length > 0 ? (
        <View style={styles.identityCard} accessibilityLabel="Your BVN record">
          {identityRows.map((row) => (
            <View style={styles.identityRow} key={row.label}>
              <Text style={styles.identityLabel}>{row.label}</Text>
              <Text style={row.isName ? styles.identityName : styles.identityValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.card}>
        {COLLECTION_POINTS.map((point) => (
          <View style={styles.row} key={point.title}>
            <Ionicons name={point.icon} size={theme.icon.compact} color={theme.colors.textSecondary} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{point.title}</Text>
              <Text style={styles.rowBody}>{point.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </StatusScreenLayout>
  );
}
