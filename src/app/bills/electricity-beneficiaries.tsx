import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

/**
 * Figma "Bill 05 — My Electricity Beneficiaries" (node 439:235,
 * missing-mobile.md §5) — confirmed genuinely blocked, not just
 * undesigned. The generic, real `POST /v1/beneficiaries` (MOB-19) has a
 * fixed request shape (`bank_code`/`account_number`/`name`) built
 * specifically for bank transfer recipients — a meter number has no bank
 * code, so that endpoint structurally cannot represent a saved meter, and
 * no electricity-specific saved-meter/quick-recharge endpoint exists
 * anywhere in the confirmed payment contract. This renders the real
 * Figma chrome (header, empty state) honestly rather than filtering the
 * generic beneficiaries list into fake meter entries that could never
 * have real data.
 */
export default function ElectricityBeneficiariesScreen() {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    content: { flex: 1, paddingTop: theme.semanticSpacing.section },
    notice: { ...theme.typography.text12Regular, color: theme.colors.textMuted, textAlign: "center", marginTop: theme.semanticSpacing.component },
  });

  return (
    <ScreenContainer>
      <BackHeader title="My Meters" />
      <View style={styles.content}>
        <EmptyState emoji="⚡" title="No saved meters yet" body="Saving a meter for quick recharge isn't available in this app version yet." />
        <Text style={styles.notice}>You can still pay any meter directly from Electricity — just enter the number each time.</Text>
        <Button label="Add new meter" disabled onPress={() => {}} />
      </View>
    </ScreenContainer>
  );
}
