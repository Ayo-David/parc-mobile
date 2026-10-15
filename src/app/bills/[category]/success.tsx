import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Share, StyleSheet, Text, View } from "react-native";

import { useBillPayment } from "@/api/queries/useBillPayment";
import { useBillReceipt } from "@/api/queries/useBillReceipt";
import type { BillCategory, BillStatus } from "@/api/schemas";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { TokenReveal } from "@/components/TokenReveal/TokenReveal";
import { TransactionResultLayout, type TransactionResultTone } from "@/components/TransactionResultLayout/TransactionResultLayout";
import { useBillDraftStore } from "@/features/bills/billDraftStore";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

const IDENTIFIER_LABELS: Record<BillCategory, string> = {
  airtime: "Phone number",
  data: "Phone number",
  electricity: "Meter number",
  cable_tv: "Smartcard number",
  internet: "Account number",
};

/**
 * Figma "Bill Success Screen", extended with the prepaid electricity
 * token-reveal state (PLAN.md Part 2), the real failed state ("Bill 01 —
 * Payment Failed", node 428:240, MOB-15), and now — for the first time —
 * the real designed receipt layout ("Bill 03 — Electricity Token
 * Success"/"Bill 04 — Cable TV Receipt", nodes 439:131/439:186,
 * missing-mobile.md §5). The receipt-detail rows only show fields the
 * confirmed contract and existing draft state actually have: provider
 * name and meter/smartcard number come from `billDraftStore` (already
 * known from earlier in the wizard), reference from the real
 * `BillReceipt.provider_reference`. Figma's "Units (kWh)" and "Valid
 * until" rows are deliberately omitted — no such field exists anywhere in
 * `BillPayment`/`BillReceipt`, and inventing a units-per-naira conversion
 * or a subscription-expiry date would be fabricating financial data, not
 * a design gap to close.
 */
export default function BillSuccessScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { billId, category } = useLocalSearchParams<{ billId: string; category: BillCategory }>();
  const payment = useBillPayment(billId);
  const isPaymentSuccessful = payment.data?.status === "SUCCESSFUL";
  const receipt = useBillReceipt(billId, isPaymentSuccessful);
  const draft = useBillDraftStore();
  const resetDraft = useBillDraftStore((state) => state.reset);

  function handleDone() {
    resetDraft();
    router.dismissTo("/(tabs)");
  }

  function handleTryAgain() {
    router.dismissTo({ pathname: "/bills/[category]", params: { category } });
  }

  if (payment.isLoading || !payment.data) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const { status, total_debit_minor } = payment.data;
  const money = { amount_minor: total_debit_minor, currency: "NGN" };
  const productLabel = draft.product?.product_name ?? "bill";
  const recipientLabel = draft.customerIdentifier ? ` for ${draft.customerIdentifier}` : "";

  if (status === "PENDING" || status === "PROCESSING") {
    return <TransactionResultLayout tone="success" isProcessing title={status === "PENDING" ? "Processing…" : "Still processing"} money={money} detailLines={status === "PROCESSING" ? ["This is taking a little longer than usual.", "We'll update you automatically."] : undefined} />;
  }

  const presentation: Partial<Record<BillStatus, { tone: TransactionResultTone; title: string; detailLines?: string[] }>> = {
    SUCCESSFUL: { tone: "success", title: "Payment Successful!", detailLines: [`${productLabel}${recipientLabel}`] },
    FAILED: { tone: "error", title: "Payment Failed", detailLines: [`We couldn't complete your ${productLabel}${recipientLabel}. You haven't been charged.`] },
    REVERSED: { tone: "warning", title: "Payment Reversed", detailLines: ["The amount has been returned to your wallet."] },
    REFUNDED: { tone: "warning", title: "Payment Refunded", detailLines: ["The amount has been refunded to your wallet."] },
  };

  const view = presentation[status];
  if (!view) {
    return <TransactionResultLayout tone="warning" isProcessing title="Processing…" money={money} />;
  }

  const styles = StyleSheet.create({
    card: { backgroundColor: theme.colors.background, borderRadius: theme.radii.card, width: "100%", marginBottom: theme.semanticSpacing.component },
    row: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: theme.semanticSpacing.form, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
    rowLast: { borderBottomWidth: 0 },
    rowLabel: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    rowValue: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
  });

  const receiptRows = isPaymentSuccessful
    ? [
        draft.product?.product_name ? { label: "Provider", value: draft.product.product_name } : null,
        draft.customerIdentifier ? { label: IDENTIFIER_LABELS[category] ?? "Reference number", value: draft.customerIdentifier } : null,
        receipt.data?.provider_reference ? { label: "Reference", value: receipt.data.provider_reference } : null,
      ].filter((row): row is { label: string; value: string } => row !== null)
    : [];

  const viewTitle = view.title;

  async function handleShare() {
    const lines = [viewTitle, formatMoney(money), ...receiptRows.map((row) => `${row.label}: ${row.value}`)];
    try {
      await Share.share({ message: lines.join("\n") });
    } catch {
      // Share sheet dismissal/failure isn't an app error — nothing to report.
    }
  }

  return (
    <TransactionResultLayout
      tone={view.tone}
      title={view.title}
      money={money}
      detailLines={isPaymentSuccessful ? undefined : view.detailLines}
      stackActions={isPaymentSuccessful}
      secondaryAction={isPaymentSuccessful ? { label: "Share receipt", onPress: () => void handleShare() } : undefined}
      primaryAction={status === "FAILED" ? { label: "Try again", onPress: handleTryAgain } : { label: "Done", onPress: handleDone }}
    >
      {isPaymentSuccessful && receipt.data?.token ? <TokenReveal token={receipt.data.token} /> : null}
      {receiptRows.length > 0 ? (
        <View style={styles.card}>
          {receiptRows.map((row, index) => (
            <View key={row.label} style={[styles.row, index === receiptRows.length - 1 ? styles.rowLast : null]}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </TransactionResultLayout>
  );
}
