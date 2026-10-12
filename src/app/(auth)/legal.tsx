import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { useBootstrap } from "@/api/queries/useBootstrap";
import { useOnboardingReferenceData } from "@/api/queries/useOnboardingReferenceData";
import { BackButton } from "@/components/BackButton/BackButton";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

/**
 * Figma "Misc 01 — Terms & Privacy Viewer" (node 439:439,
 * missing-mobile.md §2.2) — registration previously only had a checkbox
 * with implied links and no way to actually read the documents. This
 * lists the tenant's real consent documents (`GET
 * /v1/onboarding/reference-data`, public, already used by MOB-05) and
 * opens the real `ConsentDocument.policy_uri` for the full text.
 * Deliberately does NOT render invented legal text inline — Figma's body
 * copy on this frame is illustrative placeholder content, and presenting
 * fabricated legal terms as if real would be a much more serious problem
 * than a missing screen. A document with no `policy_uri` shows an honest
 * "not available yet" note instead.
 */
export default function LegalDocumentsScreen() {
  const { theme } = useTheme();
  const bootstrap = useBootstrap();
  const referenceData = useOnboardingReferenceData(bootstrap.data?.tenant_id);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const documents = referenceData.data?.consent_documents ?? [];
  const selected = documents[selectedIndex];

  const styles = StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", gap: theme.semanticSpacing.form, paddingTop: theme.semanticSpacing.section, marginBottom: theme.semanticSpacing.component },
    headerTitle: { ...theme.typography.h3, color: theme.colors.textPrimary },
    tabsRow: { flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.semanticSpacing.component, flexWrap: "wrap" },
    tab: { borderRadius: theme.radii.full, paddingHorizontal: theme.semanticSpacing.form, paddingVertical: theme.spacing.sm },
    tabActive: { backgroundColor: theme.colors.primary },
    tabInactive: { backgroundColor: theme.colors.surfaceAlt },
    tabLabel: { ...theme.typography.label },
    version: { ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: theme.semanticSpacing.component },
    body: { ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginBottom: theme.semanticSpacing.section },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  if (referenceData.isLoading) {
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
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>{selected?.title ?? "Legal documents"}</Text>
      </View>

      {documents.length === 0 ? (
        <Text style={styles.body}>No legal documents are configured for this tenant yet.</Text>
      ) : (
        <>
          <View style={styles.tabsRow}>
            {documents.map((doc, index) => (
              <Pressable key={doc.id} style={[styles.tab, index === selectedIndex ? styles.tabActive : styles.tabInactive]} onPress={() => setSelectedIndex(index)}>
                <Text style={[styles.tabLabel, { color: index === selectedIndex ? theme.colors.textInverse : theme.colors.textSecondary }]}>{doc.title ?? doc.consent_type}</Text>
              </Pressable>
            ))}
          </View>

          {selected ? (
            <>
              <Text style={styles.version}>Version {selected.document_version}</Text>
              <Text style={styles.body}>
                {selected.purpose ?? "This document governs your use of Parc. Open the full document below to read the complete terms."}
              </Text>
              {selected.policy_uri ? (
                <Button label="View full document" onPress={() => void Linking.openURL(selected.policy_uri!)} />
              ) : (
                <Text style={styles.body}>The full document text isn&apos;t available in this app version yet — contact support if you have questions.</Text>
              )}
            </>
          ) : null}
        </>
      )}
    </ScreenContainer>
  );
}
