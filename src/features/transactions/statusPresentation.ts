import type { PaymentType, TransactionStatus } from "@/api/schemas";
import type { StatusTone } from "@/theme";

export function transactionStatusPresentation(status: TransactionStatus): { tone: StatusTone; label: string } {
  switch (status) {
    case "SUCCESSFUL":
      return { tone: "success", label: "Successful" };
    case "PENDING":
      return { tone: "info", label: "Pending" };
    case "PROCESSING":
      return { tone: "info", label: "Processing" };
    case "FAILED":
      return { tone: "error", label: "Failed" };
    case "REVERSED":
      return { tone: "warning", label: "Reversed" };
    case "CANCELLED":
      return { tone: "warning", label: "Cancelled" };
    case "EXPIRED":
      return { tone: "warning", label: "Expired" };
  }
}

/** Still in flight — not yet a final outcome. */
export function isTransactionInFlight(status: TransactionStatus): boolean {
  return status === "PENDING" || status === "PROCESSING";
}

/**
 * `title` is the row heading when the payment has no narration; `category`
 * is the small label under the amount (Figma TxRow 226:3038 "Income",
 * 226:3082 "Transfer", 226:3102 "Bills").
 */
export function transactionTypePresentation(type: PaymentType): { title: string; category: string } {
  switch (type) {
    case "ACCOUNT_FUNDING":
      return { title: "Wallet funding", category: "Income" };
    case "REFUND":
    case "PLATFORM_REVENUE_REFUND":
      return { title: "Refund", category: "Income" };
    case "BANK_TRANSFER":
      return { title: "Bank transfer", category: "Transfer" };
    case "INTERNAL_TRANSFER":
      return { title: "Parc transfer", category: "Transfer" };
    case "WITHDRAWAL":
      return { title: "Withdrawal", category: "Withdrawal" };
    case "PAYOUT":
      return { title: "Payout", category: "Transfer" };
    case "BILL_PAYMENT":
      return { title: "Bill payment", category: "Bills" };
    case "PLATFORM_REVENUE_SETTLEMENT":
      return { title: "Settlement", category: "Other" };
  }
}
