import { mapPaymentTransaction, transactionDirection } from "../transactionMapping";
import { paymentTransactionListSchema, type PaymentTransactionRow } from "../schemas";

// Captured from the live shared server (GET /v1/transactions, 2026-10-12).
const LIVE_ROW: PaymentTransactionRow = {
  id: "e0c54901-968d-425f-b954-fc3f46561fbe",
  payment_type: "ACCOUNT_FUNDING",
  amount: "250000",
  currency: "NGN",
  status: "SUCCESSFUL",
  reference: "PR01-COLLECTION-A-0001",
  narration: null,
  requested_at: "2026-10-09T13:37:36.530Z",
  processed_at: "2026-10-09T13:37:39.466Z",
};

describe("transaction mapping", () => {
  it("accepts the live payment response shape", () => {
    expect(paymentTransactionListSchema.safeParse({ items: [LIVE_ROW] }).success).toBe(true);
  });

  it("rejects the outdated contract shape the app used to expect", () => {
    const outdated = { items: [{ id: LIVE_ROW.id, status: "posted", amount: { amount_minor: "250000", currency: "NGN" }, occurred_at: LIVE_ROW.requested_at }] };
    expect(paymentTransactionListSchema.safeParse(outdated).success).toBe(false);
  });

  it("maps a funding row to a settled credit in minor units", () => {
    expect(mapPaymentTransaction(LIVE_ROW)).toEqual({
      id: LIVE_ROW.id,
      type: "ACCOUNT_FUNDING",
      direction: "credit",
      status: "SUCCESSFUL",
      amount: { amount_minor: "250000", currency: "NGN" },
      reference: "PR01-COLLECTION-A-0001",
      narration: null,
      occurred_at: "2026-10-09T13:37:39.466Z",
    });
  });

  it("falls back to requested_at while unprocessed", () => {
    expect(mapPaymentTransaction({ ...LIVE_ROW, status: "PENDING", processed_at: null }).occurred_at).toBe(LIVE_ROW.requested_at);
  });

  it.each([
    ["ACCOUNT_FUNDING", "credit"],
    ["REFUND", "credit"],
    ["BANK_TRANSFER", "debit"],
    ["INTERNAL_TRANSFER", "debit"],
    ["BILL_PAYMENT", "debit"],
    ["WITHDRAWAL", "debit"],
  ] as const)("treats %s as a %s", (type, direction) => {
    expect(transactionDirection(type)).toBe(direction);
  });
});
