import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useTransfer } from "@/api/queries/useTransfer";
import type { TransferStatus } from "@/api/schemas";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TransactionResultLayout, type TransactionResultTone } from "@/components/TransactionResultLayout/TransactionResultLayout";
import { useTransferDraftStore } from "@/features/transfers/transferDraftStore";
import { useTheme } from "@/theme";

const IN_FLIGHT_STATUSES: TransferStatus[] = ["CREATED", "RESERVED", "SUBMITTED"];

/**
 * Figma "Send Money — Success Screen" plus, for the first time, its real
 * failed/pending siblings ("Transfer 01 — Failed" node 428:62, "Transfer
 * 02 — Pending" node 428:157, missing-mobile.md §0/§4) — previously this
 * screen rendered the same plain centered text for every status. Still
 * polls `GET /v1/transfers/{id}` via useTransfer's refetchInterval and
 * still never resubmits on PENDING/AMBIGUOUS/MANUAL_REVIEW, matching the
 * confirmed durable-pending contract (PLAN.md Part 4/7) — only the
 * presentation changed.
 */
export default function TransferSuccessScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { transferId } = useLocalSearchParams<{ transferId: string }>();
  const transfer = useTransfer(transferId);
  const draft = useTransferDraftStore();
  const resetDraft = useTransferDraftStore((state) => state.reset);

  function handleDone() {
    resetDraft();
    router.dismissTo("/(tabs)");
  }

  function handleBackToWallet() {
    resetDraft();
    router.dismissTo("/(tabs)");
  }

  function handleTryAgain() {
    router.dismissTo("/transfers");
  }

  if (transfer.isLoading || !transfer.data) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const { status, amount_minor, currency } = transfer.data;
  const money = { amount_minor, currency };
  const recipientLines = draft.accountName && draft.accountNumber && draft.bankName ? [`To ${draft.accountName}`, `${draft.accountNumber} · ${draft.bankName}`] : undefined;

  if (IN_FLIGHT_STATUSES.includes(status)) {
    return <TransactionResultLayout tone="success" isProcessing title="Processing…" money={money} detailLines={recipientLines} />;
  }

  const presentation: Partial<Record<TransferStatus, { tone: TransactionResultTone; title: string; detailLines?: string[] }>> = {
    PENDING: { tone: "warning", title: "Still processing", detailLines: ["This is taking a little longer than usual.", "We'll update you automatically."] },
    AMBIGUOUS: { tone: "warning", title: "We're confirming this transfer", detailLines: recipientLines ? [...recipientLines, "This can take a few minutes."] : ["This can take a few minutes."] },
    MANUAL_REVIEW: { tone: "warning", title: "Under review", detailLines: ["This transfer needs a manual check.", "We'll notify you once it's resolved."] },
    SUCCEEDED: { tone: "success", title: "Transfer Successful!", detailLines: recipientLines },
    FAILED: { tone: "error", title: "Transfer Failed", detailLines: recipientLines ? [...recipientLines, "No funds were deducted."] : ["This transfer could not be completed.", "No funds were deducted."] },
    REVERSED: { tone: "warning", title: "Transfer Reversed", detailLines: ["The amount has been returned to your wallet."] },
  };

  const view = presentation[status];
  if (!view) {
    return <TransactionResultLayout tone="warning" isProcessing title="Processing…" money={money} />;
  }

  const isUncertain = status === "PENDING" || status === "AMBIGUOUS" || status === "MANUAL_REVIEW";
  const showBackToWallet = isUncertain || status === "FAILED";

  return (
    <TransactionResultLayout
      tone={view.tone}
      title={view.title}
      money={money}
      detailLines={view.detailLines}
      secondaryAction={showBackToWallet ? { label: "Back to wallet", onPress: handleBackToWallet } : undefined}
      primaryAction={isUncertain ? { label: "Check status", onPress: () => void transfer.refetch() } : status === "FAILED" ? { label: "Try again", onPress: handleTryAgain } : { label: "Done", onPress: handleDone }}
    />
  );
}
