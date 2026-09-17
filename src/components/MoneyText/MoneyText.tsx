import { Text, type TextProps } from "react-native";

import { useTheme } from "@/theme";
import type { Money } from "@/api/schemas";
import { formatMoney } from "@/utils/money";

export interface MoneyTextProps extends Omit<TextProps, "style" | "children"> {
  money: Money;
  variant?: "amountXl" | "h2" | "h3" | "bodyMedium";
}

export function MoneyText({ money, variant = "amountXl", ...textProps }: MoneyTextProps) {
  const { theme } = useTheme();
  return (
    <Text style={[theme.typography[variant], { color: theme.colors.textPrimary }]} {...textProps}>
      {formatMoney(money)}
    </Text>
  );
}
