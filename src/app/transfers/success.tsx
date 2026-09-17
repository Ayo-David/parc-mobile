import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useTransfer } from "@/api/queries/useTransfer";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTransferDraftStore } from "@/features/transfers/transferDraftStore";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

/**
 * Figma "Send Money — Success Screen". `PENDING`/`AMBIGUOUS`/`MANUAL_REVIEW`
 * are durable states here — this screen keeps polling GET /v1/transfers/{id}
 * (via useTransfer's refetchInterval) rather than treating them as errors,
 * per the confirmed Transfer.status contract (PLAN.md Part 4/7) and the
 * platform-wide "never resubmit on ambiguity" rule.
 */
export default function TransferSuccessScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { transferId } = useLocalSearchParams<{ transferId: string }>();
  const transfer = useTransfer(transferId);
  const resetDraft = useTransferDraftStore((state) => state.reset);

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
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    subtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  });

  if (transfer.isLoading || !transfer.data) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const { status, amount_minor, currency } = transfer.data;
  const amountText = formatMoney({ amount_minor, currency });

  const presentation: Record<typeof status, { title: string; subtitle: string }> = {
    CREATED: { title: "Processing…", subtitle: `Sending ${amountText}` },
    RESERVED: { title: "Processing…", subtitle: `Sending ${amountText}` },
    SUBMITTED: { title: "Processing…", subtitle: `Sending ${amountText}` },
    PENDING: { title: "Still processing", subtitle: "This is taking a little longer than usual. We'll update this automatically." },
    AMBIGUOUS: { title: "Confirming outcome", subtitle: "We're verifying this transfer with the bank. This can take a few minutes." },
    MANUAL_REVIEW: { title: "Under review", subtitle: "This transfer needs a manual check. We'll notify you once it's resolved." },
    SUCCEEDED: { title: "Transfer successful!", subtitle: `${amountText} sent successfully.` },
    FAILED: { title: "Transfer failed", subtitle: "This transfer could not be completed. No funds were deducted." },
    REVERSED: { title: "Transfer reversed", subtitle: `${amountText} has been returned to your wallet.` },
  };

  const { title, subtitle } = presentation[status];
  const isTerminal = status === "SUCCEEDED" || status === "FAILED" || status === "REVERSED";

  return (
    <ScreenContainer>
      <View style={styles.content}>
        {!isTerminal ? <ActivityIndicator color={theme.colors.primary} /> : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {isTerminal ? <Button label="Done" onPress={handleDone} /> : null}
      </View>
    </ScreenContainer>
  );
}
