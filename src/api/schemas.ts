import { z } from "zod";

/**
 * Schemas mirror the concrete OpenAPI definitions exactly (Mobile BFF
 * `openapi/mobile-bff/v1/openapi.yaml` for Bootstrap/Dashboard, and the
 * underlying Auth & Customer contract for the passcode-login body/result,
 * since the Mobile BFF relays that route as an untyped JsonCommand — see
 * PLAN.md Part 4). Runtime-validating responses here means a downstream
 * shape drift the BFF doesn't catch surfaces as a clear ApiError instead of
 * a silent `undefined` deep in a screen.
 */

export const moneySchema = z.object({
  amount_minor: z.string().regex(/^-?(0|[1-9][0-9]*)$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
});
export type Money = z.infer<typeof moneySchema>;

export const bootstrapSchema = z.object({
  tenant_id: z.string().uuid(),
  minimum_supported_version: z.string(),
  maintenance: z.boolean(),
  features: z.record(z.string(), z.boolean()),
});
export type Bootstrap = z.infer<typeof bootstrapSchema>;

const dashboardSectionSchema = z.object({
  available: z.boolean(),
  error_code: z.string().optional(),
});

/** wallet now includes source_account_id (confirmed against parc-mobile-bff/src/composition.ts's WalletSummary — the BFF's own TS source, more authoritative here than any OpenAPI file). */
export const walletSummarySchema = z.object({
  source_account_id: z.string().uuid(),
  available_balance: moneySchema,
});
export type WalletSummary = z.infer<typeof walletSummarySchema>;

export const dashboardSchema = z.object({
  wallet: walletSummarySchema,
  sections: z.record(z.string(), dashboardSectionSchema),
});
export type Dashboard = z.infer<typeof dashboardSchema>;

/** Confirmed against `parc-contracts/openapi/payment/v1/openapi.yaml`'s `WalletFundingDetails` — used for the Add Money screen. */
export const walletFundingDetailsSchema = z.object({
  id: z.string().uuid(),
  source_account_id: z.string().uuid(),
  account_number: z.string(),
  account_name: z.string(),
  bank_code: z.string(),
  bank_name: z.string(),
  currency: z.string(),
});
export type WalletFundingDetails = z.infer<typeof walletFundingDetailsSchema>;

/** `POST /v1/wallet/virtual-account` — 202 while Paystack validates and opens the account, 200 once it's active. */
export const virtualAccountRequestResultSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE"]),
});

export const tokenPairSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.literal("Bearer"),
  expires_in: z.number().int().positive(),
});
export type TokenPair = z.infer<typeof tokenPairSchema>;

export const mfaRequiredSchema = z.object({
  mfa_required: z.literal(true),
  // The contract allows either a generic OTP-style Challenge or a much
  // larger WebAuthn PasskeyAuthenticationChallenge here. Only challenge_id
  // is validated since passkey login isn't built yet; .passthrough() keeps
  // the rest of whichever shape arrives without rejecting it.
  challenge: z.object({ challenge_id: z.string().uuid() }).passthrough(),
});

export const authResultSchema = z.union([tokenPairSchema, mfaRequiredSchema]);
export type AuthResult = z.infer<typeof authResultSchema>;

/** Confirmed real schema for POST /v1/onboarding/phone/verify (previously undocumented, treated as a bare TokenPair). */
export const onboardingPhoneVerificationResultSchema = z.object({
  tokens: authResultSchema,
  onboarding: z.lazy(() => onboardingStateSchema),
});
export type OnboardingPhoneVerificationResult = z.infer<typeof onboardingPhoneVerificationResultSchema>;

export const challengeSchema = z.object({
  challenge_id: z.string().uuid(),
  expires_at: z.string(),
});
export type Challenge = z.infer<typeof challengeSchema>;

/**
 * Confirmed against `parc-mobile-bff/src/composition.ts`'s `OnboardingReferenceData`
 * (the BFF's own TS source) — closes three previously-confirmed gaps at
 * once: consent-document discovery for registration/NIN submission, and
 * states/LGAs + occupation/income-band pickers for the Address/Income
 * onboarding screens (previously free text, no reference data existed).
 */
export const consentDocumentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  consent_type: z.string(),
  document_version: z.string(),
  title: z.string().optional(),
  purpose: z.string().optional(),
  channel: z.string().optional(),
  policy_uri: z.string().optional(),
  evidence_digest: z.string().optional(),
  required_at_registration: z.boolean().optional(),
});
export type ConsentDocument = z.infer<typeof consentDocumentSchema>;

export const onboardingReferenceDataSchema = z.object({
  consent_documents: z.array(consentDocumentSchema),
  states: z.array(z.object({ code: z.string(), name: z.string(), lgas: z.array(z.string()) })),
  occupations: z.array(z.string()),
  annual_income_bands: z.array(z.object({ code: z.string(), label: z.string() })),
});
export type OnboardingReferenceData = z.infer<typeof onboardingReferenceDataSchema>;

/**
 * Onboarding schemas mirror `parc-contracts/openapi/auth-customer/v1/openapi.yaml`
 * exactly (registration + status are the only two onboarding operations with a
 * documented response schema; the rest are description-only — see
 * PLAN.md Part 2 "Onboarding contract gaps"). Every other onboarding mutation
 * is treated as "succeeded or threw an ApiError," then the app refetches
 * onboardingStateSchema as the single source of truth for what's next,
 * rather than guessing at an undocumented response shape.
 */
export const onboardingRegistrationSchema = z.object({
  onboarding_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  current_step: z.literal("PHONE_VERIFICATION"),
  phone_challenge: challengeSchema,
});
export type OnboardingRegistration = z.infer<typeof onboardingRegistrationSchema>;

export const onboardingStepSchema = z.enum(["PHONE_VERIFICATION", "EMAIL", "IDENTITY", "FACE_VERIFICATION", "ADDRESS", "COMPLIANCE", "INCOME", "LOGIN_PASSCODE", "BIOMETRIC", "COMPLETED"]);
export type OnboardingStep = z.infer<typeof onboardingStepSchema>;

export const onboardingStateSchema = z.object({
  onboarding_id: z.string().uuid(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "EXPIRED"]),
  current_step: onboardingStepSchema,
  completed_steps: z.array(onboardingStepSchema),
  expires_at: z.string(),
  completed_at: z.string().nullable(),
  updated_at: z.string(),
});
export type OnboardingState = z.infer<typeof onboardingStateSchema>;

/** Confirmed real schema for PUT /v1/onboarding/email (previously undocumented — the client had to probe for a challenge_id). */
export const onboardingEmailResultSchema = z.object({
  onboarding: onboardingStateSchema,
  email_challenge: challengeSchema.optional(),
});
export type OnboardingEmailResult = z.infer<typeof onboardingEmailResultSchema>;

/**
 * Identity and face verification results. `provider` is whichever KYC
 * provider the tenant is configured with; the app never branches on it.
 * `identity` is the legal name from the NIN register, returned once the NIN
 * is verified.
 */
export const kycVerificationSchema = z.object({
  id: z.string().uuid(),
  identity_type: z.enum(["NIN", "BVN", "BIOMETRIC"]),
  masked_identity: z.string(),
  provider: z.enum(["VERIFYME", "PREMBLY"]),
  status: z.enum(["PENDING", "VERIFIED", "FAILED", "MANUAL_REVIEW"]),
  created_at: z.string(),
});
export type KycVerification = z.infer<typeof kycVerificationSchema>;

export const registeredIdentityNameSchema = z.object({
  first_name: z.string(),
  middle_name: z.string().nullable(),
  last_name: z.string(),
});
export type RegisteredIdentityName = z.infer<typeof registeredIdentityNameSchema>;

export const onboardingVerificationResultSchema = z.object({
  verification: kycVerificationSchema,
  onboarding: onboardingStateSchema,
  identity: registeredIdentityNameSchema.optional(),
});
export type OnboardingVerificationResult = z.infer<typeof onboardingVerificationResultSchema>;

/**
 * GET /v1/transactions — the Mobile BFF relays this unchanged to payment's
 * `customer-payment-query-service.ts`, which returns raw `payment_transactions`
 * rows (confirmed against the live server and parc-payment's
 * db/schema/current.sql). The mobile-bff OpenAPI's TransactionPage
 * (id/status/amount/occurred_at + cursor) does not match what is served.
 * Enums mirror the Postgres enums exactly; `amount` is bigint minor units
 * (kobo), serialized as a positive digit string. No cursor: one page of up
 * to `page_size` (max 100) newest-first rows.
 */
export const transactionStatusSchema = z.enum(["PENDING", "PROCESSING", "SUCCESSFUL", "FAILED", "CANCELLED", "REVERSED", "EXPIRED"]);
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

export const paymentTypeSchema = z.enum([
  "BANK_TRANSFER",
  "INTERNAL_TRANSFER",
  "ACCOUNT_FUNDING",
  "WITHDRAWAL",
  "REFUND",
  "PAYOUT",
  "PLATFORM_REVENUE_SETTLEMENT",
  "PLATFORM_REVENUE_REFUND",
  "BILL_PAYMENT",
]);
export type PaymentType = z.infer<typeof paymentTypeSchema>;

export const paymentTransactionRowSchema = z.object({
  id: z.string().uuid(),
  payment_type: paymentTypeSchema,
  amount: z.string().regex(/^(0|[1-9][0-9]*)$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
  status: transactionStatusSchema,
  reference: z.string(),
  narration: z.string().nullable(),
  requested_at: z.string(),
  processed_at: z.string().nullable(),
});
export type PaymentTransactionRow = z.infer<typeof paymentTransactionRowSchema>;

export const paymentTransactionListSchema = z.object({
  items: z.array(paymentTransactionRowSchema),
});

/** The app's own transaction model, mapped from PaymentTransactionRow in api/client.ts. */
export interface Transaction {
  id: string;
  type: PaymentType;
  /** Whether money entered (credit) or left (debit) the customer's wallet. */
  direction: "credit" | "debit";
  status: TransactionStatus;
  /** Always positive — `direction` carries the sign. */
  amount: Money;
  reference: string;
  narration: string | null;
  /** processed_at when settled, otherwise requested_at. */
  occurred_at: string;
}

export interface TransactionPage {
  items: Transaction[];
  page: { next_cursor: string | null; has_more: boolean };
}

/**
 * POST /v1/statements has a concrete, typed request body, but neither
 * statements operation documents a response schema (PLAN.md Part 4/7) —
 * `getStatement` below probes a few plausible field names for status/URL
 * rather than assuming a shape.
 */
export const statementStatusSchema = z.enum(["pending", "processing", "ready", "failed", "expired"]);

/**
 * Confirmed against parc-ledger (customer-statement-service.ts, relayed by
 * the BFF): request → `{ id, status, replayed }`; status → lower-cased
 * status + period + format, and when READY a storage `download_reference`
 * (not a URL — no download route exists for the app yet).
 */
export const statementRequestResultSchema = z.object({ id: z.string().uuid(), status: z.string(), replayed: z.boolean() });
export const statementStatusResultSchema = z.object({
  status: statementStatusSchema,
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  format: z.string().optional(),
  download_reference: z.string().optional(),
  download_expires_at: z.string().optional(),
});
export type StatementStatusResult = z.infer<typeof statementStatusResultSchema>;
export type StatementStatus = z.infer<typeof statementStatusSchema>;

/**
 * Confirmed against `parc-contracts/openapi/auth-customer/v1/openapi.yaml`
 * (`POST /v1/transaction-authorizations`, fully typed end to end) — used
 * for every money-movement confirmation via the shared bottom-sheet PIN
 * pattern (PLAN.md Part 1).
 */
export const transactionAuthorizationSchema = z.object({
  authorization_token: z.string().min(32),
  expires_at: z.string(),
});
export type TransactionAuthorization = z.infer<typeof transactionAuthorizationSchema>;

/**
 * Confirmed against `parc-contracts/openapi/payment/v1/openapi.yaml`
 * (`GET /v1/transfers/{id}`, fully typed). `PENDING`/`AMBIGUOUS`/
 * `MANUAL_REVIEW` are durable non-terminal states the app must keep
 * polling — never resubmit — per the backend's own provider-routing model
 * (parc-interview-answers.md §11).
 */
export const transferStatusSchema = z.enum(["CREATED", "RESERVED", "SUBMITTED", "PENDING", "AMBIGUOUS", "SUCCEEDED", "FAILED", "REVERSED", "MANUAL_REVIEW"]);
export type TransferStatus = z.infer<typeof transferStatusSchema>;

export const transferSchema = z.object({
  id: z.string().uuid(),
  status: transferStatusSchema,
  amount_minor: z.string().regex(/^[1-9][0-9]*$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
  provider: z.enum(["PAYSTACK", "WEMA", "BANKONE"]).optional(),
});
export type Transfer = z.infer<typeof transferSchema>;

export const TRANSFER_TERMINAL_STATUSES: readonly TransferStatus[] = ["SUCCEEDED", "FAILED", "REVERSED"];

/** Confirmed against auth-customer's `Customer` schema (`GET /v1/customers/me`, fully typed). */
export const customerSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  status: z.enum(["PENDING_VERIFICATION", "ACTIVE", "RESTRICTED", "CLOSED"]),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  masked_phone_number: z.string().optional(),
  masked_email: z.string().optional(),
  kyc_tier: z.number().int().min(0).max(3).optional(),
  created_at: z.string(),
});
export type Customer = z.infer<typeof customerSchema>;

/**
 * Confirmed against `parc-contracts/openapi/payment/v1/openapi.yaml` —
 * Bills is the one money-movement feature with a fully typed contract end
 * to end (unlike Transfers/Statements — PLAN.md "Real blockers"). Both
 * `BillPaymentCommand` and `TransferInput` require a `source_account_id`,
 * RESOLVED via the real `GET /v1/wallet/source-account` endpoint
 * (`api.getWalletSourceAccount`).
 */
export const billProductSchema = z.object({
  id: z.string().uuid(),
  product_code: z.string(),
  product_name: z.string(),
  description: z.string().nullable().optional(),
  denomination_type: z.enum(["FIXED", "VARIABLE"]),
  amount_minor: z.string().nullable().optional(),
  min_amount_minor: z.string().nullable().optional(),
  max_amount_minor: z.string().nullable().optional(),
  currency: z.literal("NGN"),
  catalogue_version: z.number().int().min(1),
});
export type BillProduct = z.infer<typeof billProductSchema>;

export const billValidationSchema = z.object({
  validation_id: z.string().uuid(),
  customer_name: z.string().optional(),
  expires_at: z.string(),
  replayed: z.boolean(),
});
export type BillValidation = z.infer<typeof billValidationSchema>;

export const billQuoteSchema = z.object({
  quote_id: z.string().uuid(),
  total_debit_minor: z.string().regex(/^[1-9][0-9]*$/),
  expires_at: z.string(),
  replayed: z.boolean(),
});
export type BillQuote = z.infer<typeof billQuoteSchema>;

export const billStatusSchema = z.enum(["PENDING", "PROCESSING", "SUCCESSFUL", "FAILED", "REVERSED", "REFUNDED"]);
export type BillStatus = z.infer<typeof billStatusSchema>;
export const BILL_TERMINAL_STATUSES: readonly BillStatus[] = ["SUCCESSFUL", "FAILED", "REVERSED", "REFUNDED"];

export const billPaymentStateSchema = z.object({
  bill_transaction_id: z.string().uuid(),
  status: billStatusSchema,
  replayed: z.boolean(),
});
export type BillPaymentState = z.infer<typeof billPaymentStateSchema>;

export const billPaymentSchema = z.object({
  id: z.string().uuid(),
  status: billStatusSchema,
  amount_minor: z.string().regex(/^[1-9][0-9]*$/),
  fee_minor: z.string().regex(/^[0-9]+$/),
  tax_minor: z.string().regex(/^[0-9]+$/),
  total_debit_minor: z.string().regex(/^[1-9][0-9]*$/),
  currency: z.literal("NGN"),
  provider_reference: z.string().nullable().optional(),
});
export type BillPayment = z.infer<typeof billPaymentSchema>;

export const billReceiptSchema = z.object({
  bill_id: z.string().uuid(),
  provider_reference: z.string().nullable(),
  receipt: z.string().nullable(),
  token: z.string().nullable(),
  completed_at: z.string().nullable(),
});
export type BillReceipt = z.infer<typeof billReceiptSchema>;

export const billCategorySchema = z.enum(["airtime", "data", "electricity", "cable_tv", "internet"]);
export type BillCategory = z.infer<typeof billCategorySchema>;

/**
 * RESOLVED (PLAN.md "Real blockers" — re-verified against
 * `parc-contracts/openapi/lending/v1/openapi.yaml` directly). Lending was
 * previously the most response-gap-heavy feature in the app, and
 * `POST /v1/loan-applications` required the client to assert KYC/fraud
 * evidence (including a raw `fraud_flag`) it had no honest way to know.
 * Both are now fixed: every customer-facing response is fully typed below,
 * and `underwriting_evidence` has been removed from the client request
 * entirely — the backend now computes it server-side via an internal-only
 * evaluation endpoint (`POST /internal/v1/applications/{id}/evaluate`,
 * service-auth only, never reachable from the mobile app).
 */
export const loanTypeSchema = z.enum(["INSTANT", "UNSECURED_PERSONAL", "SALARY_BACKED", "ASSET_FINANCE"]);
export type LoanType = z.infer<typeof loanTypeSchema>;

export const repaymentFrequencySchema = z.enum(["daily", "weekly", "monthly"]);
export type RepaymentFrequency = z.infer<typeof repaymentFrequencySchema>;

export const repaymentSourceSchema = z.enum(["wallet", "direct_debit", "virtual_account", "manual_bank_transfer"]);
export type RepaymentSource = z.infer<typeof repaymentSourceSchema>;

export const customerLoanProductSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  type: z.string(),
  product_version_id: z.string().uuid(),
  min_amount_minor: z.string().regex(/^[0-9]+$/),
  max_amount_minor: z.string().regex(/^[0-9]+$/),
  min_tenure_days: z.number().int().min(1),
  max_tenure_days: z.number().int().min(1),
  annual_rate: z.string(),
  currency: z.string().regex(/^[A-Z]{3}$/),
});
export type CustomerLoanProduct = z.infer<typeof customerLoanProductSchema>;

const loanScheduleInstallmentSchema = z.object({
  installment_number: z.number().int().min(1),
  due_date: z.string(),
  principal_minor: z.string(),
  interest_minor: z.string(),
  fees_minor: z.string(),
  total_minor: z.string(),
});

export const customerLoanQuoteSchema = z.object({
  id: z.string().uuid(),
  amountMinor: z.string(),
  currency: z.string(),
  totalInterestMinor: z.string(),
  totalFeesMinor: z.string(),
  totalRepayableMinor: z.string(),
  maturityDate: z.string(),
  schedule: z.array(loanScheduleInstallmentSchema),
  expiresAt: z.string(),
  replayed: z.boolean(),
});
export type CustomerLoanQuote = z.infer<typeof customerLoanQuoteSchema>;

export const loanApplicationSubmissionSchema = z.object({
  application_id: z.string().uuid(),
  application_number: z.string(),
  status: z.literal("SUBMITTED"),
  underwriting_status: z.enum(["PENDING_EVIDENCE", "READY", "ACTION_REQUIRED"]),
  submitted_at: z.string(),
  replayed: z.boolean(),
});
export type LoanApplicationSubmission = z.infer<typeof loanApplicationSubmissionSchema>;

export const customerLoanApplicationSchema = z.object({
  id: z.string().uuid(),
  application_number: z.string(),
  product_version_id: z.string().uuid(),
  requested_amount_minor: z.string(),
  requested_tenure_days: z.number().int().min(1),
  currency: z.string(),
  status: z.string(),
  underwriting_status: z.string(),
  submitted_at: z.string().nullable(),
  customer_reason_codes: z.array(z.string()),
  next_action: z.enum(["WAIT", "PROVIDE_INFORMATION", "WAIT_FOR_REVIEW", "REVIEW_OFFER", "NONE"]),
});
export type CustomerLoanApplication = z.infer<typeof customerLoanApplicationSchema>;

export const customerLoanOfferSchema = z
  .object({
    id: z.string().uuid(),
    application_id: z.string().uuid(),
    status: z.string(),
    schedule: z.record(z.string(), z.unknown()).nullable(),
  })
  .passthrough();
export type CustomerLoanOffer = z.infer<typeof customerLoanOfferSchema>;

export const loanOfferAcceptanceSchema = z
  .object({
    loanId: z.string().uuid(),
    contractId: z.string().uuid(),
    status: z.string(),
    replayed: z.boolean(),
  })
  .passthrough();
export type LoanOfferAcceptance = z.infer<typeof loanOfferAcceptanceSchema>;

export const customerLoanSchema = z
  .object({
    id: z.string().uuid(),
    loan_number: z.string(),
    currency: z.string(),
    status: z.string(),
    outstanding_principal: z.string(),
  })
  .passthrough();
export type CustomerLoan = z.infer<typeof customerLoanSchema>;

export const customerRepaymentQuoteSchema = z.object({
  id: z.string().uuid(),
  loanId: z.string().uuid(),
  amountMinor: z.string(),
  currency: z.string(),
  source: z.string(),
  allocationPreview: z.record(z.string(), z.unknown()),
  expiresAt: z.string(),
  replayed: z.boolean(),
});
export type CustomerRepaymentQuote = z.infer<typeof customerRepaymentQuoteSchema>;

export const customerRepaymentRequestSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  paymentRequestId: z.string().uuid().nullable(),
  replayed: z.boolean(),
});
export type CustomerRepaymentRequest = z.infer<typeof customerRepaymentRequestSchema>;

/**
 * Savings (MOB-12) — schemas confirmed against `parc-contracts/openapi/savings/v1/openapi.yaml`
 * (newly created; previously only summary/create-goal/create-fixed-deposit
 * existed at all — withdrawal/liquidation/maturity/recurring were entirely
 * missing, PLAN.md "Real blockers"). Two residual gaps remain and are
 * documented at their call sites in client.ts: the withdrawal-quote
 * response has no schema, and there's no GET to list/refetch a goal or
 * recurring plan after creation.
 */
export const savingsProductTypeSchema = z.enum(["ORDINARY", "TARGET", "FIXED_DEPOSIT", "RECURRING"]);
export type SavingsProductType = z.infer<typeof savingsProductTypeSchema>;

const savingsSummaryAccountSchema = z.object({
  savings_account_id: z.string().uuid(),
  account_number: z.string(),
  product_type: savingsProductTypeSchema,
  product_version_id: z.string().uuid(),
  currency: z.literal("NGN"),
  status: z.string(),
  posted_balance_minor: z.string(),
  held_balance_minor: z.string(),
  available_balance_minor: z.string(),
});
export type SavingsSummaryAccount = z.infer<typeof savingsSummaryAccountSchema>;

const savingsSummaryTotalSchema = z.object({
  currency: z.string(),
  posted_balance_minor: z.string(),
  held_balance_minor: z.string(),
  available_balance_minor: z.string(),
});

export const savingsSummarySchema = z.object({
  accounts: z.array(savingsSummaryAccountSchema),
  totals: z.array(savingsSummaryTotalSchema),
});
export type SavingsSummary = z.infer<typeof savingsSummarySchema>;

export const savingsGoalResultSchema = z.object({
  id: z.string().uuid(),
  savings_account_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  target_amount_minor: z.string(),
  currency: z.string(),
  target_date: z.string(),
  status: z.literal("ACTIVE"),
  replayed: z.boolean(),
});
export type SavingsGoalResult = z.infer<typeof savingsGoalResultSchema>;

export const goalWithdrawalResultSchema = z.object({
  withdrawal_id: z.string().uuid(),
  goal_id: z.string().uuid(),
  principal_minor: z.string(),
  forfeited_interest_minor: z.string(),
  ledger_transaction_id: z.string().uuid(),
  currency: z.string(),
  goal_status: z.enum(["ACTIVE", "CANCELLED"]),
  status: z.literal("SUCCESSFUL"),
  replayed: z.boolean(),
});
export type GoalWithdrawalResult = z.infer<typeof goalWithdrawalResultSchema>;

export const fixedDepositResultSchema = z.object({
  fixed_deposit_id: z.string().uuid(),
  principal_minor: z.string(),
  interest_rate: z.string(),
  maturity_date: z.string(),
  currency: z.string(),
  status: z.literal("ACTIVE"),
  replayed: z.boolean(),
});
export type FixedDepositResult = z.infer<typeof fixedDepositResultSchema>;

export const fixedDepositQuoteResultSchema = z.object({
  quote_id: z.string().uuid(),
  quote_hash: z.string(),
  principal_minor: z.string(),
  interest_rate: z.string(),
  tenure_days: z.number().int(),
  expected_interest_minor: z.string(),
  penalty_minor: z.string(),
  payout_minor: z.string(),
  currency: z.string(),
  expires_at: z.string(),
  replayed: z.boolean(),
});
export type FixedDepositQuoteResult = z.infer<typeof fixedDepositQuoteResultSchema>;

export const fixedDepositStatusSchema = z.enum(["PENDING", "ACTIVE", "MATURED", "WITHDRAWN", "RENEWED", "CANCELLED", "LIQUIDATED"]);
export type FixedDepositStatus = z.infer<typeof fixedDepositStatusSchema>;

export const maturityInstructionSchema = z.enum(["payout", "renew_principal", "renew_principal_and_interest"]);
export type MaturityInstruction = z.infer<typeof maturityInstructionSchema>;

export const fixedDepositDetailSchema = z.object({
  fixed_deposit_id: z.string().uuid(),
  product_version_id: z.string().uuid(),
  principal_minor: z.string(),
  interest_rate: z.string(),
  accrued_interest: z.string(),
  tenure_days: z.number().int(),
  start_date: z.string(),
  maturity_date: z.string(),
  currency: z.string(),
  status: fixedDepositStatusSchema,
  maturity_instruction: maturityInstructionSchema,
});
export type FixedDepositDetail = z.infer<typeof fixedDepositDetailSchema>;

export const fixedDepositSettlementResultSchema = z.object({
  fixed_deposit_id: z.string().uuid(),
  principal_minor: z.string(),
  interest_minor: z.string(),
  penalty_minor: z.string(),
  payout_minor: z.string(),
  ledger_transaction_id: z.string().uuid(),
  currency: z.string(),
  status: z.enum(["LIQUIDATED", "MATURED", "RENEWED"]),
  replayed: z.boolean(),
  renewed_fixed_deposit_id: z.string().uuid().optional(),
  renewed_principal_minor: z.string().optional(),
  renewed_maturity_date: z.string().optional(),
});
export type FixedDepositSettlementResult = z.infer<typeof fixedDepositSettlementResultSchema>;

export const fixedDepositInstructionResultSchema = z.object({
  instruction_id: z.string().uuid(),
  instruction: maturityInstructionSchema,
  replayed: z.boolean(),
});
export type FixedDepositInstructionResult = z.infer<typeof fixedDepositInstructionResultSchema>;

export const recurringPlanFrequencySchema = z.enum(["DAILY", "WEEKLY", "MONTHLY"]);
export type RecurringPlanFrequency = z.infer<typeof recurringPlanFrequencySchema>;

export const recurringPlanResultSchema = z.object({
  recurring_plan_id: z.string().uuid(),
  savings_account_id: z.string().uuid(),
  amount_minor: z.string(),
  currency: z.string(),
  frequency: recurringPlanFrequencySchema,
  next_execution_date: z.string(),
  status: z.literal("ACTIVE"),
  replayed: z.boolean(),
});
export type RecurringPlanResult = z.infer<typeof recurringPlanResultSchema>;

/**
 * parc-payment `BeneficiaryView` (src/services/beneficiary-service.ts) —
 * GET /v1/beneficiaries?kind=all|recent|favourite returns `{ items: [...] }`.
 * The payment contract documents it as prose only; this mirrors the source.
 */
export const beneficiaryViewSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  nickname: z.string().nullable(),
  account_number: z.string().nullable(),
  bank_code: z.string().nullable(),
  bank_name: z.string().nullable(),
  is_verified: z.boolean(),
  is_favourite: z.boolean(),
  created_at: z.string(),
  last_used_at: z.string().nullable(),
});
export type BeneficiaryView = z.infer<typeof beneficiaryViewSchema>;
export type BeneficiaryKind = "all" | "recent" | "favourite";

/**
 * auth-customer GET /v1/notifications → `{ items }` from the `notifications`
 * table (customer-experience-service.ts). Every delivery channel is listed,
 * so the app shows only PUSH/IN_APP — SMS/EMAIL bodies can carry OTPs.
 * subject/body are null with `content_expired: true` after retention.
 */
export const notificationChannelSchema = z.enum(["PUSH", "SMS", "EMAIL", "IN_APP"]);
export const notificationClassificationSchema = z.enum(["NON_FINANCIAL", "FINANCIAL", "CONTRACTUAL", "KYC", "SECURITY", "COMPLAINT"]);
export const notificationItemSchema = z.object({
  id: z.string().uuid(),
  channel: notificationChannelSchema,
  subject: z.string().nullable(),
  body: z.string().nullable(),
  status: z.string(),
  classification: notificationClassificationSchema,
  read_at: z.string().nullable(),
  created_at: z.string(),
  content_expired: z.boolean().optional(),
});
export type NotificationItem = z.infer<typeof notificationItemSchema>;
export type NotificationClassification = z.infer<typeof notificationClassificationSchema>;

