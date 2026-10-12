import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { Transaction } from "@/api/schemas";
import { isTransactionInFlight, transactionStatusPresentation, transactionTypePresentation } from "@/features/transactions/statusPresentation";
import { useTheme } from "@/theme";
import { formatMoney } from "@/utils/money";

/**
 * Figma "TxRow" (HomeScreen 226:2865, nodes 226:3020-226:3102): icon tile,
 * title + date, signed amount + category label. Title is the payment's real
 * narration, falling back to its type ("Bank transfer"); the label under the
 * amount is the category ("Income"/"Transfer"/"Bills") once settled, or the
 * status while it isn't. Icon follows Figma: trend-up on green for money in,
 * lightning on amber for bills, transfer arrows on neutral for money out.
 */
export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const { theme } = useTheme();
  const { tone, label: statusLabel } = transactionStatusPresentation(transaction.status);
  const { title, category } = transactionTypePresentation(transaction.type);
  const isSettled = transaction.status === "SUCCESSFUL";
  const isCredit = transaction.direction === "credit";
  const isBill = transaction.type === "BILL_PAYMENT";

  const settledIcon = isCredit
    ? { name: "trending-up" as const, background: theme.components.status.success.backgroundColor, color: theme.colors.success }
    : isBill
      ? { name: "flash-outline" as const, background: theme.components.status.warning.backgroundColor, color: theme.colors.warningStrong }
      : { name: "swap-horizontal" as const, background: theme.colors.primarySubtle, color: theme.colors.textPrimary };
  const icon = isSettled
    ? settledIcon
    : {
        name: isTransactionInFlight(transaction.status) ? ("time-outline" as const) : ("close-circle-outline" as const),
        background: theme.components.status[tone].backgroundColor,
        color: theme.components.status[tone].textColor,
      };
  const iconBackground = icon.background;
  const amountColor = !isSettled ? theme.colors.textSecondary : isCredit ? theme.colors.success : theme.colors.textPrimary;
  const occurredAt = new Date(transaction.occurred_at);
  const dateLabel = `${occurredAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · ${occurredAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;

  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md - 1,
      borderBottomWidth: theme.borderWidth.thin,
      borderBottomColor: theme.colors.divider,
    },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: theme.radii.button,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: iconBackground,
    },
    middle: {
      flex: 1,
    },
    title: {
      ...theme.typography.text13p5SemiBold,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.text11p5Regular,
      color: theme.colors.textSecondary,
      marginTop: 1,
    },
    right: {
      alignItems: "flex-end",
    },
    amount: {
      ...theme.typography.text14BoldMono,
      color: amountColor,
    },
    statusLabel: {
      ...theme.typography.text10p5Regular,
      color: theme.colors.textSecondary,
      marginTop: 1,
    },
  });

  return (
    <View style={styles.row}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon.name} size={theme.icon.nav} color={icon.color} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction.narration?.trim() || title}
        </Text>
        <Text style={styles.subtitle}>{dateLabel}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>
          {isCredit ? "+" : "-"}
          {formatMoney(transaction.amount)}
        </Text>
        <Text style={styles.statusLabel}>{isSettled ? category : statusLabel}</Text>
      </View>
    </View>
  );
}
