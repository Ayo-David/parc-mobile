import { StyleSheet, Text, View } from "react-native";

import type { Transaction } from "@/api/schemas";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { transactionStatusPresentation } from "@/features/transactions/statusPresentation";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

/**
 * Figma "TxRow"/"TransactionRow" pattern. Only renders what the confirmed
 * TransactionPage schema actually contains (id, status, amount, occurred_at)
 * — no counterparty name/narration/reference field exists in the real
 * contract, unlike the richer row mobile-flow-map_planning.md envisioned
 * (PLAN.md Part 4/7).
 */
export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const { theme } = useTheme();
  const { tone, label } = transactionStatusPresentation(transaction.status);
  const isDebit = transaction.amount.amount_minor.startsWith("-");

  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: theme.semanticSpacing.form,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    left: {
      gap: theme.spacing.xs,
    },
    date: {
      ...theme.typography.bodySmall,
      color: theme.colors.textSecondary,
    },
    amount: {
      ...theme.typography.bodyMedium,
      fontWeight: "600",
      color: isDebit ? theme.colors.textPrimary : theme.colors.success,
    },
  });

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.date}>{new Date(transaction.occurred_at).toLocaleString()}</Text>
        <StatusBadge tone={tone} label={label} />
      </View>
      <Text style={styles.amount}>{formatMoney(transaction.amount)}</Text>
    </View>
  );
}
