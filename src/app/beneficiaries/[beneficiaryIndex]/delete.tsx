import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useBeneficiaries } from "@/api/queries/useBeneficiaries";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { firstString } from "@/features/beneficiaries/fieldProbe";
import { useTheme } from "@/theme";

/**
 * Figma "Beneficiaries 02 — Delete Confirmation" (node 435:217,
 * missing-mobile.md §4). Same honest limitation as `edit.tsx`: there is
 * no `DELETE /v1/beneficiaries/{id}` anywhere in the payment contract
 * (only the collection `GET`/`POST` exist), so "Remove beneficiary"
 * discloses the gap rather than pretending to delete anything.
 */
export default function DeleteBeneficiaryScreen() {
  const { theme } = useTheme();
  const { beneficiaryIndex } = useLocalSearchParams<{ beneficiaryIndex: string }>();
  const beneficiaries = useBeneficiaries();
  const entry = beneficiaries.data?.[Number(beneficiaryIndex)];
  const [showLimitation, setShowLimitation] = useState(false);

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section },
    warningCard: { backgroundColor: theme.components.status.error.backgroundColor, borderRadius: theme.radii.lg, padding: theme.semanticSpacing.form, gap: theme.spacing.xs },
    warningTitle: { ...theme.typography.text13Bold, color: theme.colors.error },
    warningBody: { ...theme.typography.text12Regular, color: theme.colors.textSecondary },
    notice: { ...theme.typography.text12Regular, color: theme.colors.warning, backgroundColor: theme.components.status.warning.backgroundColor, borderRadius: theme.radii.lg, padding: theme.semanticSpacing.form, marginTop: theme.semanticSpacing.form },
    footer: { marginTop: "auto" as const, paddingBottom: theme.semanticSpacing.section },
  });

  if (!entry) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.warningBody}>This beneficiary is no longer available.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const name = firstString(entry, ["name"]) ?? "this beneficiary";

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: `Remove ${name}?` }} />
      <View style={styles.content}>
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>This can&apos;t be undone</Text>
          <Text style={styles.warningBody}>You&apos;ll need to re-enter their account details next time you send them money. This won&apos;t affect any past transfers.</Text>
        </View>
        {showLimitation ? <Text style={styles.notice}>Removing beneficiaries isn&apos;t available in this app version yet — there&apos;s no way to delete this from the server.</Text> : null}
        <View style={styles.footer}>
          <Button label="Remove beneficiary" variant="destructive" onPress={() => setShowLimitation(true)} />
        </View>
      </View>
    </ScreenContainer>
  );
}
