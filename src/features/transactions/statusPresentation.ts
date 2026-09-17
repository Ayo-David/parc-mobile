import type { TransactionStatus } from "@/api/schemas";
import type { StatusTone } from "@/theme";

export function transactionStatusPresentation(status: TransactionStatus): { tone: StatusTone; label: string } {
  switch (status) {
    case "posted":
      return { tone: "success", label: "Posted" };
    case "pending":
      return { tone: "info", label: "Pending" };
    case "failed":
      return { tone: "error", label: "Failed" };
    case "reversed":
      return { tone: "warning", label: "Reversed" };
  }
}
