export type ApiErrorCategory = "validation" | "authentication" | "authorization" | "conflict" | "rate_limit" | "dependency" | "network" | "unknown";

export class ApiError extends Error {
  readonly category: ApiErrorCategory;
  readonly status: number | null;
  readonly code: string | null;
  readonly correlationId: string | null;
  readonly retryable: boolean;

  constructor(params: { message: string; category: ApiErrorCategory; status: number | null; code?: string | null; correlationId?: string | null; retryable?: boolean }) {
    super(params.message);
    this.name = "ApiError";
    this.category = params.category;
    this.status = params.status;
    this.code = params.code ?? null;
    this.correlationId = params.correlationId ?? null;
    this.retryable = params.retryable ?? false;
  }
}

/**
 * The BFF answers 503 WALLET_NOT_PROVISIONED in the few seconds after
 * onboarding completes, before Ledger has created the customer's wallet
 * from the onboarding-completed event. It's a transient state, not a failure.
 */
export function isWalletNotProvisioned(error: unknown): boolean {
  return error instanceof ApiError && error.code === "WALLET_NOT_PROVISIONED";
}

/**
 * Why `GET /v1/wallet/funding-details` has no account to show yet:
 * "none" (never requested; ask for BVN + bank account), "pending" (Paystack
 * is validating/opening it; poll) or "rejected" (show the message, allow a
 * retry). Null for any other failure.
 */
export function fundingAccountSetupState(error: unknown): "none" | "pending" | "rejected" | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code === "FUNDING_ACCOUNT_NOT_FOUND") return "none";
  if (error.code === "FUNDING_ACCOUNT_PENDING") return "pending";
  if (error.code === "FUNDING_ACCOUNT_REJECTED") return "rejected";
  return null;
}

export function categorizeStatus(status: number): ApiErrorCategory {
  if (status === 401) return "authentication";
  if (status === 403) return "authorization";
  if (status === 404) return "unknown";
  if (status === 409) return "conflict";
  if (status === 422 || status === 400) return "validation";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "dependency";
  return "unknown";
}

/**
 * Downstream/relayed error bodies aren't guaranteed to match the BFF's own
 * ApiError shape (see PLAN.md Part 4) — this only reads fields defensively
 * and never assumes a concrete shape.
 */
export function extractServerMessage(body: unknown): { message: string | null; code: string | null; correlationId: string | null } {
  if (typeof body !== "object" || body === null) {
    return { message: null, code: null, correlationId: null };
  }
  const record = body as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message : null;
  const code = typeof record.code === "string" ? record.code : null;
  const correlationId = typeof record.correlation_id === "string" ? record.correlation_id : null;
  return { message, code, correlationId };
}
