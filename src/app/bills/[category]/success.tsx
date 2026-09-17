import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useBillPayment } from "@/api/queries/useBillPayment";
import { useBillReceipt } from "@/api/queries/useBillReceipt";
import type { BillStatus } from "@/api/schemas";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TokenReveal } from "@/components/TokenReveal/TokenReveal";
import { useBillDraftStore } from "@/features/bills/billDraftStore";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

/**
 * Figma "Bill Success Screen", extended with the prepaid electricity
 * token-reveal state (PLAN.md Part 2) once BillReceipt.token is available —
 * a confirmed real contract field, not a design invention.
 */
export default function BillSuccessScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { billId } = useLocalSearchParams<{ billId: string }>();
  const payment = useBillPayment(billId);
  const isPaymentSuccessful = payment.data?.status === "SUCCESSFUL";
  const receipt = useBillReceipt(billId, isPaymentSuccessful);
  const resetDraft = useBillDraftStore((state) => state.reset);

  function handleDone() {
    resetDraft();
    router.replace("/(tabs)");
  }

  const styles = StyleSheet.create({
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.semanticSpacing.component,
      paddingBottom: theme.semanticSpacing.section,
    },
    title: { ...theme.typography.h2, color: theme.colors.textPrimary, textAlign: "center" },
    subtitle: { ...theme.typography.bodyMedium, color: theme.colors.textSecondary, textAlign: "center" },
  });

  if (payment.isLoading || !payment.data) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const { status, total_debit_minor } = payment.data;
  const amountText = formatMoney({ amount_minor: total_debit_minor, currency: "NGN" });

  const presentation: Record<BillStatus, { title: string; subtitle: string }> = {
    PENDING: { title: "Processing…", subtitle: `Paying ${amountText}` },
    PROCESSING: { title: "Still processing", subtitle: "This is taking a little longer than usual. We'll update this automatically." },
    SUCCESSFUL: { title: "Payment successful!", subtitle: `${amountText} paid successfully.` },
    FAILED: { title: "Payment failed", subtitle: "This payment could not be completed. No funds were deducted." },
    REVERSED: { title: "Payment reversed", subtitle: `${amountText} has been returned to your wallet.` },
    REFUNDED: { title: "Payment refunded", subtitle: `${amountText} has been refunded to your wallet.` },
  };

  const { title, subtitle } = presentation[status];
  const isTerminal = status === "SUCCESSFUL" || status === "FAILED" || status === "REVERSED" || status === "REFUNDED";

  return (
    <ScreenContainer>
      <View style={styles.content}>
        {!isTerminal ? <ActivityIndicator color={theme.colors.primary} /> : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {isPaymentSuccessful && receipt.data?.token ? <TokenReveal token={receipt.data.token} /> : null}
        {isTerminal ? <Button label="Done" onPress={handleDone} /> : null}
      </View>
    </ScreenContainer>
  );
}
