import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useBeneficiaries } from "@/api/queries/useBeneficiaries";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TextField } from "@/components/TextField/TextField";
import { avatarColorFor, firstString, initialsFor } from "@/features/beneficiaries/fieldProbe";
import { useTheme } from "@/theme";

/**
 * Figma "Beneficiaries 03 — Edit Beneficiary" (node 436:105,
 * missing-mobile.md §4) — a real, referenced-but-previously-undesigned
 * screen, built here with an honest limitation: the payment contract has
 * no `PATCH`/`PUT /v1/beneficiaries/{id}` at all (only the collection
 * `GET`/`POST` exist), so there is no way to actually save a nickname
 * change. The form renders for real (matching Figma exactly, including
 * the locked account-number/bank fields) but "Save changes" discloses the
 * gap rather than pretending to submit.
 */
export default function EditBeneficiaryScreen() {
  const { theme } = useTheme();
  const { beneficiaryIndex } = useLocalSearchParams<{ beneficiaryIndex: string }>();
  const beneficiaries = useBeneficiaries();
  const entry = beneficiaries.data?.[Number(beneficiaryIndex)];
  const [nickname, setNickname] = useState(entry ? (firstString(entry, ["name"]) ?? "") : "");
  const [showLimitation, setShowLimitation] = useState(false);

  const palette = [theme.colors.secondary, theme.colors.primary, theme.colors.success, theme.colors.info, theme.colors.warning];

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.form },
    avatarWrap: { alignItems: "center", marginBottom: theme.semanticSpacing.component },
    avatar: { width: theme.control.iconButtonXl, height: theme.control.iconButtonXl, borderRadius: theme.radii.full, alignItems: "center", justifyContent: "center" },
    avatarText: { ...theme.typography.text22ExtraBold, color: theme.colors.textInverse },
    helper: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    notice: { ...theme.typography.text12Regular, color: theme.colors.warning, backgroundColor: theme.components.status.warning.backgroundColor, borderRadius: theme.radii.lg, padding: theme.semanticSpacing.form },
  });

  if (!entry) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <Text style={styles.helper}>This beneficiary is no longer available.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const name = firstString(entry, ["name"]) ?? "Beneficiary";
  const accountNumber = firstString(entry, ["account_number"]);
  const bankName = firstString(entry, ["bank_name", "bank_code"]);

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: "Edit Beneficiary" }} />
      <View style={styles.content}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: avatarColorFor(name, palette) }]}>
            <Text style={styles.avatarText}>{initialsFor(name)}</Text>
          </View>
        </View>
        <TextField value={nickname} onChangeText={setNickname} placeholder="Nickname" />
        <TextField value={accountNumber ?? ""} onChangeText={() => {}} placeholder="Account Number" editable={false} />
        <TextField value={bankName ?? ""} onChangeText={() => {}} placeholder="Bank" editable={false} />
        <Text style={styles.helper}>Account number and bank can&apos;t be changed. To send to a different account, remove this beneficiary and add a new one.</Text>
        {showLimitation ? <Text style={styles.notice}>Editing beneficiaries isn&apos;t available in this app version yet — there&apos;s no way to save this change to the server.</Text> : null}
        <Button label="Save changes" onPress={() => setShowLimitation(true)} />
      </View>
    </ScreenContainer>
  );
}
