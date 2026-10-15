import type { PaymentTransactionRow, PaymentType, Transaction } from "./schemas";

/**
 * Payment rows are listed by the customer who initiated them (payment's
 * query filters on customer_id), so every type is money leaving the wallet
 * except funding the account and refunds back to it. Presentation only —
 * balances always come from the server.
 */
const CREDIT_TYPES: ReadonlySet<PaymentType> = new Set(["ACCOUNT_FUNDING", "REFUND", "PLATFORM_REVENUE_REFUND"]);

export function transactionDirection(type: PaymentType): Transaction["direction"] {
  return CREDIT_TYPES.has(type) ? "credit" : "debit";
}

export function mapPaymentTransaction(row: PaymentTransactionRow): Transaction {
  return {
    id: row.id,
    type: row.payment_type,
    direction: transactionDirection(row.payment_type),
    status: row.status,
    amount: { amount_minor: row.amount, currency: row.currency },
    reference: row.reference,
    narration: row.narration,
    occurred_at: row.processed_at ?? row.requested_at,
  };
}
