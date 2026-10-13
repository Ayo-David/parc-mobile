import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import Constants from "expo-constants";
import { randomUUID } from "expo-crypto";
import { Platform } from "react-native";
import { z } from "zod";

import { tokenStorage } from "@/auth/tokenStorage";
import { env } from "@/config/env";
import { reportError } from "@/observability/reportError";
import { useSessionStore } from "@/state/stores/sessionStore";

import { ApiError, categorizeStatus, extractServerMessage } from "./errors";
import { mapPaymentTransaction } from "./transactionMapping";
import {
  authResultSchema,
  billPaymentSchema,
  billPaymentStateSchema,
  billProductSchema,
  billQuoteSchema,
  billReceiptSchema,
  beneficiaryViewSchema,
  statementRequestResultSchema,
  statementStatusResultSchema,
  notificationItemSchema,
  billValidationSchema,
  bootstrapSchema,
  challengeSchema,
  customerLoanApplicationSchema,
  customerLoanOfferSchema,
  customerLoanProductSchema,
  customerLoanQuoteSchema,
  customerLoanSchema,
  customerRepaymentQuoteSchema,
  customerRepaymentRequestSchema,
  customerSchema,
  dashboardSchema,
  fixedDepositDetailSchema,
  fixedDepositInstructionResultSchema,
  fixedDepositQuoteResultSchema,
  fixedDepositResultSchema,
  fixedDepositSettlementResultSchema,
  goalWithdrawalResultSchema,
  loanApplicationSubmissionSchema,
  loanOfferAcceptanceSchema,
  onboardingEmailResultSchema,
  onboardingPhoneVerificationResultSchema,
  onboardingReferenceDataSchema,
  onboardingRegistrationSchema,
  onboardingStateSchema,
  onboardingVerificationResultSchema,
  recurringPlanResultSchema,
  savingsGoalResultSchema,
  savingsSummarySchema,
  tokenPairSchema,
  transactionAuthorizationSchema,
  paymentTransactionListSchema,
  transferSchema,
  walletFundingDetailsSchema,
  walletSummarySchema,
  type AuthResult,
  type BeneficiaryKind,
  type BeneficiaryView,
  type StatementStatusResult,
  type NotificationItem,
  type BillCategory,
  type BillPayment,
  type BillPaymentState,
  type BillProduct,
  type BillQuote,
  type BillReceipt,
  type BillValidation,
  type Bootstrap,
  type Challenge,
  type Customer,
  type CustomerLoan,
  type CustomerLoanApplication,
  type CustomerLoanOffer,
  type CustomerLoanProduct,
  type CustomerLoanQuote,
  type CustomerRepaymentQuote,
  type CustomerRepaymentRequest,
  type Dashboard,
  type FixedDepositDetail,
  type FixedDepositInstructionResult,
  type FixedDepositQuoteResult,
  type FixedDepositResult,
  type FixedDepositSettlementResult,
  type GoalWithdrawalResult,
  type LoanApplicationSubmission,
  type LoanOfferAcceptance,
  type MaturityInstruction,
  type OnboardingEmailResult,
  type OnboardingPhoneVerificationResult,
  type OnboardingReferenceData,
  type OnboardingRegistration,
  type OnboardingState,
  type OnboardingVerificationResult,
  type RecurringPlanFrequency,
  type RecurringPlanResult,
  type RepaymentFrequency,
  type RepaymentSource,
  type SavingsGoalResult,
  type SavingsSummary,
  type TokenPair,
  type TransactionAuthorization,
  type TransactionPage,
  type TransactionStatus,
  type Transfer,
  type WalletFundingDetails,
  type WalletSummary,
} from "./schemas";

const REQUEST_TIMEOUT_MS = 15_000;

declare module "axios" {
  interface AxiosRequestConfig {
    /** Defaults to true. Bootstrap, passcode login, token refresh, passcode recovery, and onboarding start/phone-verify are the current public exceptions. */
    parcRequiresAuth?: boolean;
  }
  interface InternalAxiosRequestConfig {
    parcRequiresAuth?: boolean;
    parcRetried?: boolean;
  }
}

/**
 * Axios owns HTTP transport for the whole app: base URL, default headers,
 * timeout, and — via the interceptors below — correlation IDs, bearer/
 * tenant-context injection, session refresh, and normalized error
 * handling. Every endpoint method in `api` below calls request<T>() and
 * never touches axios directly, so this is the single place transport
 * concerns live.
 */
export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "content-type": "application/json" },
});

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.set("x-correlation-id", randomUUID());

  if (config.parcRequiresAuth !== false) {
    const session = useSessionStore.getState().session;
    if (!session) {
      // Rejected here (not thrown) so it flows through the same response
      // error pipeline as every other failure below.
      return Promise.reject(new ApiError({ message: "No active session", category: "authentication", status: null }));
    }
    config.headers.set("authorization", `Bearer ${session.accessToken}`);
    config.headers.set("x-tenant-id", session.tenantId);
  }

  return config;
});

/**
 * RESOLVED (PLAN.md "Real blockers"): `POST /v1/auth/token/refresh` now
 * exists on the Mobile BFF (pre-auth, X-Tenant-Id + Idempotency-Key,
 * `refresh_token` in body → `TokenPair`). On a 401 from an authenticated
 * call, this exchanges the stored refresh token for a new pair, persists
 * it, and lets the response interceptor retry the original request once.
 * Session tenantId is preserved (refresh doesn't return one).
 *
 * Only an explicit rejection from the auth service ends the session; a
 * network failure/timeout leaves it intact (returns false) so a connectivity
 * blip doesn't log the customer out.
 */
async function attemptSessionRefresh(): Promise<boolean> {
  const session = useSessionStore.getState().session;
  if (!session) {
    return false;
  }
  try {
    const response = await httpClient.request({
      method: "POST",
      url: "/v1/auth/token/refresh",
      headers: { "x-tenant-id": session.tenantId, "idempotency-key": randomUUID() },
      data: { refresh_token: session.refreshToken },
      parcRequiresAuth: false,
    });
    const result = tokenPairSchema.safeParse(response.data);
    if (!result.success) {
      throw new Error("Unexpected refresh response shape");
    }
    const stored = { accessToken: result.data.access_token, refreshToken: result.data.refresh_token, tenantId: session.tenantId };
    await tokenStorage.save(stored);
    useSessionStore.getState().setSession(stored);
    return true;
  } catch (error) {
    // The refresh call runs through this client's own response interceptor,
    // so failures arrive here already normalized into ApiError.
    const isConnectivityFailure = error instanceof ApiError && error.category === "network";
    if (!isConnectivityFailure) {
      await tokenStorage.clear();
      useSessionStore.getState().setSessionExpired(true);
      useSessionStore.getState().clearSession();
    }
    return false;
  }
}

/**
 * auth-customer rotates refresh tokens and treats any reuse of a rotated one
 * as theft: it revokes the whole token family, including the pair the first
 * refresh just issued (session-service.ts `refresh` → REFRESH_TOKEN_REUSE).
 * Screens fire several requests at once, so when the access token expires
 * they all 401 together — each must share ONE refresh, never start its own.
 */
let refreshInFlight: Promise<boolean> | null = null;

export function refreshSessionOnce(): Promise<boolean> {
  refreshInFlight ??= attemptSessionRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

function normalizeAxiosError(error: AxiosError): ApiError {
  if (!error.response) {
    const isTimeout = error.code === "ECONNABORTED";
    return new ApiError({
      message: isTimeout ? "Request timed out" : "Network request failed",
      category: "network",
      status: null,
      retryable: true,
    });
  }
  const { message, code, correlationId } = extractServerMessage(error.response.data);
  return new ApiError({
    message: message ?? `Request failed with status ${error.response.status}`,
    category: categorizeStatus(error.response.status),
    status: error.response.status,
    code,
    correlationId: correlationId ?? (error.response.headers["x-correlation-id"] as string | undefined) ?? null,
    retryable: error.response.status === 429 || error.response.status >= 500,
  });
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (error instanceof ApiError) {
      // Already normalized (e.g. the "no active session" rejection above).
      return Promise.reject(error);
    }
    if (!axios.isAxiosError(error)) {
      reportError(error, { source: "httpClient.interceptors.response" });
      return Promise.reject(new ApiError({ message: "Unexpected error", category: "unknown", status: null }));
    }

    const config = error.config;
    // The BFF rejects a bad/expired bearer token with UNAUTHORIZED. A relayed
    // AUTHENTICATION_FAILED is a wrong PIN/credential on a valid session
    // (e.g. transaction-PIN rotate/authorize) and must not trigger a refresh.
    const isCredentialFailure = extractServerMessage(error.response?.data).code === "AUTHENTICATION_FAILED";
    if (error.response?.status === 401 && !isCredentialFailure && config && config.parcRequiresAuth !== false && !config.parcRetried) {
      config.parcRetried = true;
      // If the session already moved on (another request refreshed while this
      // one was in flight), just retry with the current token — refreshing
      // again would replay a rotated refresh token.
      const current = useSessionStore.getState().session;
      const sentAuthorization = config.headers.get("authorization");
      const refreshed = current && sentAuthorization !== `Bearer ${current.accessToken}` ? true : await refreshSessionOnce();
      if (refreshed) {
        return httpClient.request(config);
      }
    }

    const normalized = normalizeAxiosError(error);
    const isServerOrTransportFailure = normalized.status === null || normalized.status >= 500;
    if (isServerOrTransportFailure && (normalized.category === "network" || normalized.category === "dependency" || normalized.category === "unknown")) {
      // Expected user-facing conditions (validation/auth/conflict/rate-limit)
      // and other 4xx answers (e.g. 404 ONBOARDING_NOT_FOUND, which
      // useOnboardingStatus treats as normal) are not reported — only
      // transport failures and 5xx are.
      reportError(normalized, { path: config?.url, method: config?.method, status: normalized.status });
    }
    return Promise.reject(normalized);
  },
);

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  /** Defaults to true. Bootstrap, passcode login/recovery, and onboarding start/phone-verify are the current exceptions. */
  requiresAuth?: boolean;
  headers?: Record<string, string>;
}

async function request<T>(options: RequestOptions, parse: (body: unknown) => T): Promise<T> {
  const response = await httpClient.request({
    method: options.method,
    url: options.path,
    params: options.query,
    data: options.body,
    headers: options.headers,
    parcRequiresAuth: options.requiresAuth ?? true,
  });
  return parse(response.data);
}

function parseWithSchema<T>(schema: z.ZodType<T>, operationName: string) {
  return (body: unknown): T => {
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new ApiError({ message: `Unexpected response shape from ${operationName}`, category: "unknown", status: null });
    }
    return result.data;
  };
}

/**
 * Prose-only list endpoints. The live server wraps them as `{ items: [...] }`
 * (confirmed 2026-10-12 for notification preferences, notifications, FAQs);
 * a bare array is still accepted in case a relay returns one.
 */
function listItems(body: unknown): Record<string, unknown>[] {
  const list = Array.isArray(body) ? body : typeof body === "object" && body !== null && Array.isArray((body as { items?: unknown }).items) ? (body as { items: unknown[] }).items : [];
  return list.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
}

function ignoreBody(): void {
  return undefined;
}

export const api = {
  async getBootstrap(): Promise<Bootstrap> {
    const appVersion = Constants.expoConfig?.version ?? "0.0.0";
    const platform = Platform.OS === "ios" ? "ios" : "android";
    return request(
      {
        method: "GET",
        path: "/v1/bootstrap",
        query: { app_version: appVersion, platform },
        requiresAuth: false,
        headers: { "x-tenant-slug": env.tenantSlug },
      },
      parseWithSchema(bootstrapSchema, "bootstrap"),
    );
  },

  async loginWithPasscode(params: { tenantId: string; identifier: string; passcode: string; deviceId: string; idempotencyKey: string }): Promise<AuthResult> {
    return request(
      {
        method: "POST",
        path: "/v1/auth/passcode/login",
        requiresAuth: false,
        headers: { "x-tenant-id": params.tenantId, "idempotency-key": params.idempotencyKey },
        body: { identifier: params.identifier, passcode: params.passcode, device_id: params.deviceId },
      },
      parseWithSchema(authResultSchema, "passcode login"),
    );
  },

  async logout(): Promise<void> {
    return request({ method: "POST", path: "/v1/auth/logout", headers: { "idempotency-key": randomUUID() } }, ignoreBody);
  },

  async requestPasscodeRecovery(params: { tenantId: string; identifier: string; channel: "SMS" | "EMAIL"; idempotencyKey: string }): Promise<Challenge> {
    return request(
      {
        method: "POST",
        path: "/v1/auth/passcode/recovery/request",
        requiresAuth: false,
        headers: { "x-tenant-id": params.tenantId, "idempotency-key": params.idempotencyKey },
        body: { identifier: params.identifier, channel: params.channel },
      },
      parseWithSchema(challengeSchema, "passcode recovery request"),
    );
  },

  async confirmPasscodeRecovery(params: { tenantId: string; challengeId: string; code: string; newPasscode: string; newPasscodeConfirmation: string; idempotencyKey: string }): Promise<void> {
    return request(
      {
        method: "POST",
        path: "/v1/auth/passcode/recovery/confirm",
        requiresAuth: false,
        headers: { "x-tenant-id": params.tenantId, "idempotency-key": params.idempotencyKey },
        body: { challenge_id: params.challengeId, code: params.code, new_passcode: params.newPasscode, new_passcode_confirmation: params.newPasscodeConfirmation },
      },
      ignoreBody,
    );
  },

  /** RESOLVED (PLAN.md "Real blockers"): transaction-PIN setup/confirm/rotate now exist. */
  async startTransactionPinSetup(): Promise<Challenge> {
    return request({ method: "POST", path: "/v1/security/transaction-pin/setup", headers: { "idempotency-key": randomUUID() } }, parseWithSchema(challengeSchema, "transaction PIN setup"));
  },

  async confirmTransactionPinSetup(params: { challengeId: string; pin: string }): Promise<void> {
    return request(
      { method: "POST", path: "/v1/security/transaction-pin/confirm", headers: { "idempotency-key": randomUUID() }, body: { challenge_id: params.challengeId, pin: params.pin } },
      ignoreBody,
    );
  },

  async rotateTransactionPin(params: { currentPin: string; newPin: string }): Promise<void> {
    return request(
      { method: "POST", path: "/v1/security/transaction-pin/rotate", headers: { "idempotency-key": randomUUID() }, body: { current_pin: params.currentPin, new_pin: params.newPin } },
      ignoreBody,
    );
  },

  /** GET /v1/security remains a read-only summary with no documented response schema — returned as a raw record. */
  async getSecuritySummary(): Promise<Record<string, unknown>> {
    return request({ method: "GET", path: "/v1/security" }, (body) => (typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}));
  },

  async revokeSession(sessionId: string): Promise<void> {
    return request({ method: "DELETE", path: `/v1/security/sessions/${sessionId}` }, ignoreBody);
  },

  async revokeDevice(deviceId: string): Promise<void> {
    return request({ method: "DELETE", path: `/v1/devices/${deviceId}` }, ignoreBody);
  },

  async registerPushToken(params: { deviceIdentifier: string; pushToken: string; platform: "ANDROID" | "IOS" }): Promise<void> {
    return request(
      { method: "PUT", path: "/v1/devices/push-token", body: { device_identifier: params.deviceIdentifier, push_token: params.pushToken, platform: params.platform } },
      ignoreBody,
    );
  },

  /** No response schema is documented for the list — returned as a raw array for the screen to render defensively. */
  /** In-app feed (PUSH/IN_APP only — see notificationItemSchema). Malformed rows are skipped. */
  async getNotifications(pageSize = 50): Promise<NotificationItem[]> {
    return request({ method: "GET", path: "/v1/notifications", query: { page_size: String(pageSize) } }, (body) =>
      listItems(body).flatMap((item) => {
        const parsed = notificationItemSchema.safeParse(item);
        return parsed.success && (parsed.data.channel === "IN_APP" || parsed.data.channel === "PUSH") ? [parsed.data] : [];
      }),
    );
  },

  async getNotificationPreferences(): Promise<Array<Record<string, unknown>>> {
    return request({ method: "GET", path: "/v1/notification-preferences" }, listItems);
  },

  async updateNotificationPreference(params: { category: string; pushEnabled: boolean; smsEnabled: boolean; emailEnabled: boolean; inAppEnabled: boolean }): Promise<void> {
    return request(
      {
        method: "PUT",
        path: `/v1/notification-preferences/${params.category}`,
        headers: { "idempotency-key": randomUUID() },
        body: { push_enabled: params.pushEnabled, sms_enabled: params.smsEnabled, email_enabled: params.emailEnabled, in_app_enabled: params.inAppEnabled },
      },
      ignoreBody,
    );
  },

  /** No response schema is documented (`/v1/referrals/summary` in both the mobile-bff and auth-customer contracts is description-only) — returned as a raw record for the screen to render defensively. */
  async getReferralSummary(): Promise<Record<string, unknown>> {
    return request({ method: "GET", path: "/v1/referrals/summary" }, (body) => (typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}));
  },

  /** No response schema documented for the FAQ catalogue — returned as a raw array. */
  async getFaqs(): Promise<Array<Record<string, unknown>>> {
    return request({ method: "GET", path: "/v1/support/faqs" }, listItems);
  },

  /** No response schema documented for the ticket list — returned as a raw array. */
  async getSupportTickets(): Promise<Array<Record<string, unknown>>> {
    return request({ method: "GET", path: "/v1/support/tickets" }, listItems);
  },

  /**
   * The mobile-bff's own contract documents this as an opaque `JsonCommand`
   * (MOB-13's original note), but the mobile-bff relays it unmodified
   * straight through to tenant-admin's internal
   * `POST /internal/v1/customers/{customerId}/support/tickets`
   * (confirmed by reading `parc-mobile-bff/src/app.ts` directly — a plain
   * passthrough relay, no body transform), and THAT endpoint's request
   * schema is fully documented: `createCustomerSupportTicketInternal`
   * requires `subject`/`description` and accepts an optional
   * `category_id` (uuid). `description` (not `message`) is the real field
   * name — confirmed and corrected in MOB-18, since the field name
   * mismatch this method previously guessed would have silently failed
   * validation against the real backend.
   */
  async createSupportTicket(params: { subject: string; description: string; categoryId?: string }): Promise<Record<string, unknown>> {
    return request(
      {
        method: "POST",
        path: "/v1/support/tickets",
        headers: { "idempotency-key": randomUUID() },
        body: { subject: params.subject, description: params.description, ...(params.categoryId ? { category_id: params.categoryId } : {}) },
      },
      (body) => (typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}),
    );
  },

  async getDashboard(): Promise<Dashboard> {
    return request({ method: "GET", path: "/v1/dashboard" }, parseWithSchema(dashboardSchema, "dashboard"));
  },

  /** RESOLVED: a dedicated, lightweight way to get source_account_id + balance (used by transfers/bills), separate from the fuller Add Money details below. */
  async getWalletSourceAccount(): Promise<WalletSummary> {
    return request({ method: "GET", path: "/v1/wallet/source-account" }, parseWithSchema(walletSummarySchema, "wallet source account"));
  },

  /** RESOLVED (PLAN.md "Real blockers"): previously entirely absent from the payment contract. Used for the Add Money screen. */
  async getWalletFundingDetails(): Promise<WalletFundingDetails> {
    return request({ method: "GET", path: "/v1/wallet/funding-details" }, parseWithSchema(walletFundingDetailsSchema, "wallet funding details"));
  },

  /** RESOLVED (PLAN.md "Real blockers"): closes the consent-discovery gap and gives Address/Income real reference data. Public (X-Tenant-Id only, no bearer). */
  async getOnboardingReferenceData(tenantId: string): Promise<OnboardingReferenceData> {
    return request(
      { method: "GET", path: "/v1/onboarding/reference-data", requiresAuth: false, headers: { "x-tenant-id": tenantId } },
      parseWithSchema(onboardingReferenceDataSchema, "onboarding reference data"),
    );
  },

  async startOnboarding(params: { tenantId: string; phoneNumber: string; consentIds: string[]; referralCode?: string; idempotencyKey: string }): Promise<OnboardingRegistration> {
    return request(
      {
        method: "POST",
        path: "/v1/onboarding/registrations",
        requiresAuth: false,
        headers: { "x-tenant-id": params.tenantId, "idempotency-key": params.idempotencyKey },
        body: { phone_number: params.phoneNumber, consent_ids: params.consentIds, ...(params.referralCode ? { referral_code: params.referralCode } : {}) },
      },
      parseWithSchema(onboardingRegistrationSchema, "start onboarding"),
    );
  },

  /** RESOLVED: response now typed (`OnboardingPhoneVerificationResult` = tokens + onboarding state), previously treated as a bare TokenPair guess. */
  async verifyOnboardingPhone(params: { tenantId: string; onboardingId: string; challengeId: string; code: string; idempotencyKey: string }): Promise<OnboardingPhoneVerificationResult> {
    return request(
      {
        method: "POST",
        path: "/v1/onboarding/phone/verify",
        requiresAuth: false,
        headers: { "x-tenant-id": params.tenantId, "idempotency-key": params.idempotencyKey },
        body: { onboarding_id: params.onboardingId, challenge_id: params.challengeId, code: params.code },
      },
      parseWithSchema(onboardingPhoneVerificationResultSchema, "phone verification"),
    );
  },

  async getOnboardingStatus(): Promise<OnboardingState> {
    return request({ method: "GET", path: "/v1/onboarding/status" }, parseWithSchema(onboardingStateSchema, "onboarding status"));
  },

  /** RESOLVED: response now typed (`OnboardingEmailResult` = onboarding state + optional email_challenge), previously probed. */
  async setOnboardingEmail(params: { email: string }): Promise<OnboardingEmailResult> {
    return request({ method: "PUT", path: "/v1/onboarding/email", body: { email: params.email } }, parseWithSchema(onboardingEmailResultSchema, "set onboarding email"));
  },

  async skipOnboardingEmail(): Promise<void> {
    return request({ method: "PUT", path: "/v1/onboarding/email", body: { skip: true } }, ignoreBody);
  },

  async verifyOnboardingEmail(params: { challengeId: string; code: string }): Promise<void> {
    return request({ method: "POST", path: "/v1/onboarding/email/verify", body: { challenge_id: params.challengeId, code: params.code } }, ignoreBody);
  },

  /**
   * RESOLVED (MOB-23): this previously discarded the response with
   * `ignoreBody`, treating the endpoint as if it were one of the ~10
   * onboarding operations with no documented schema. It isn't — the real
   * `auth-customer` contract documents a `202` response with the exact
   * same `OnboardingVerificationResult` schema `face-verification` uses
   * (`{verification: KycVerification, onboarding: OnboardingState}`), so
   * a failed/manual-review NIN check was previously indistinguishable
   * from success at the type level, even though the server was already
   * reporting it correctly.
   */
  async submitOnboardingIdentity(params: { ninValue: string; consentId: string }): Promise<OnboardingVerificationResult> {
    return request(
      { method: "POST", path: "/v1/onboarding/identity", body: { identity_type: "NIN", identity_value: params.ninValue, consent_id: params.consentId } },
      parseWithSchema(onboardingVerificationResultSchema, "onboarding identity verification"),
    );
  },

  /**
   * The request no longer takes a photo_url — it now takes an opaque
   * `liveness_reference` obtained from a third-party liveness/biometric
   * SDK (e.g. VerifyMe's own SDK), which this app does not yet integrate.
   * The API shape is resolved; the missing SDK dependency is a separate,
   * still-open piece of work (PLAN.md).
   */
  async submitFaceVerification(params: { ninValue: string; livenessReference: string; consentId: string }): Promise<OnboardingVerificationResult> {
    return request(
      { method: "POST", path: "/v1/onboarding/face-verification", body: { identity_type: "NIN", identity_value: params.ninValue, liveness_reference: params.livenessReference, consent_id: params.consentId } },
      parseWithSchema(onboardingVerificationResultSchema, "face verification"),
    );
  },

  async confirmFaceVerification(verificationId: string): Promise<OnboardingVerificationResult> {
    return request({ method: "POST", path: "/v1/onboarding/face-verification/confirm", body: { verification_id: verificationId } }, parseWithSchema(onboardingVerificationResultSchema, "confirm face verification"));
  },

  async submitOnboardingAddress(params: { state: string; lga: string; area: string; streetAddress: string; landmark?: string }): Promise<void> {
    return request(
      {
        method: "PUT",
        path: "/v1/onboarding/address",
        body: { state: params.state, lga: params.lga, area: params.area, street_address: params.streetAddress, ...(params.landmark ? { landmark: params.landmark } : {}) },
      },
      ignoreBody,
    );
  },

  async submitOnboardingCompliance(params: { politicallyExposedPerson: boolean }): Promise<void> {
    return request({ method: "PUT", path: "/v1/onboarding/compliance", body: { politically_exposed_person: params.politicallyExposedPerson } }, ignoreBody);
  },

  async submitOnboardingIncome(params: { occupation: string; annualIncomeBand: string; hasOtherIncome: boolean }): Promise<void> {
    return request(
      { method: "PUT", path: "/v1/onboarding/income", body: { occupation: params.occupation, annual_income_band: params.annualIncomeBand, has_other_income: params.hasOtherIncome } },
      ignoreBody,
    );
  },

  async setOnboardingLoginPasscode(params: { passcode: string; passcodeConfirmation: string }): Promise<void> {
    return request({ method: "PUT", path: "/v1/onboarding/login-passcode", body: { passcode: params.passcode, passcode_confirmation: params.passcodeConfirmation } }, ignoreBody);
  },

  async completeOnboarding(params: { biometricEnrolled: boolean }): Promise<void> {
    return request({ method: "POST", path: "/v1/onboarding/complete", body: { biometric_enrolled: params.biometricEnrolled } }, ignoreBody);
  },

  /**
   * Payment serves one newest-first page of up to `page_size` (max 100) rows
   * and ignores any cursor/status/date filters, so none are sent — screens
   * filter the loaded list. `has_more` is always false (no cursor exists).
   */
  async getTransactions(params: { pageSize?: number } = {}): Promise<TransactionPage> {
    const query: Record<string, string> = {};
    if (params.pageSize !== undefined) query.page_size = String(params.pageSize);
    return request({ method: "GET", path: "/v1/transactions", query }, (body) => {
      const list = parseWithSchema(paymentTransactionListSchema, "transactions")(body);
      return { items: list.items.map(mapPaymentTransaction), page: { next_cursor: null, has_more: false } };
    });
  },

  /**
   * format is hardcoded to "pdf" — the only value the contract's enum
   * allows. STILL A GAP (re-verified, PLAN.md "Real blockers"): the 202
   * response has no documented schema despite GET /v1/statements/{id}
   * requiring an id — probes for one defensively.
   */
  async requestStatement(params: { dateFrom: string; dateTo: string; idempotencyKey: string }): Promise<{ statementId: string }> {
    return request(
      { method: "POST", path: "/v1/statements", headers: { "idempotency-key": params.idempotencyKey }, body: { date_from: params.dateFrom, date_to: params.dateTo, format: "pdf" } },
      (body) => ({ statementId: parseWithSchema(statementRequestResultSchema, "statement request")(body).id }),
    );
  },

  async getStatement(id: string): Promise<StatementStatusResult> {
    return request({ method: "GET", path: `/v1/statements/${id}` }, parseWithSchema(statementStatusResultSchema, "statement status"));
  },

  /** STILL A GAP (re-verified): no `Bank` schema exists in the payment contract. Defensively parses a plausible array-of-objects shape. */
  async getBanks(): Promise<Array<{ bankCode: string; bankName: string }>> {
    return request({ method: "GET", path: "/v1/reference/banks" }, (body): Array<{ bankCode: string; bankName: string }> => {
      const list = Array.isArray(body) ? body : Array.isArray((body as Record<string, unknown>)?.banks) ? ((body as Record<string, unknown>).banks as unknown[]) : [];
      return list
        .map((entry) => {
          if (typeof entry !== "object" || entry === null) return null;
          const record = entry as Record<string, unknown>;
          const bankCode = typeof record.bank_code === "string" ? record.bank_code : typeof record.code === "string" ? record.code : null;
          const bankName = typeof record.bank_name === "string" ? record.bank_name : typeof record.name === "string" ? record.name : null;
          return bankCode && bankName ? { bankCode, bankName } : null;
        })
        .filter((entry): entry is { bankCode: string; bankName: string } => entry !== null);
    });
  },

  /** STILL A GAP (re-verified): response undocumented. Probes for the account name and the enquiry_token the quote step needs. */
  async enquireTransferAccountName(params: { bankCode: string; accountNumber: string; idempotencyKey: string }): Promise<{ accountName: string | null; enquiryToken: string | null }> {
    return request(
      { method: "POST", path: "/v1/transfers/name-enquiries", headers: { "idempotency-key": params.idempotencyKey }, body: { bank_code: params.bankCode, account_number: params.accountNumber } },
      (body): { accountName: string | null; enquiryToken: string | null } => {
        if (typeof body !== "object" || body === null) return { accountName: null, enquiryToken: null };
        const record = body as Record<string, unknown>;
        const accountName = typeof record.account_name === "string" ? record.account_name : typeof record.name === "string" ? record.name : null;
        const enquiryToken = typeof record.enquiry_token === "string" ? record.enquiry_token : typeof record.token === "string" ? record.token : null;
        return { accountName, enquiryToken };
      },
    );
  },

  /** STILL A GAP (re-verified): response undocumented, no quote_id defined for transfers (unlike bills). */
  async quoteTransfer(params: { enquiryToken: string; amountMinor: string; currency: string; narration?: string }): Promise<{ quoteId: string | null; feeMinor: string | null }> {
    return request(
      { method: "POST", path: "/v1/transfers/quotes", body: { enquiry_token: params.enquiryToken, amount_minor: params.amountMinor, currency: params.currency, narration: params.narration } },
      (body): { quoteId: string | null; feeMinor: string | null } => {
        if (typeof body !== "object" || body === null) return { quoteId: null, feeMinor: null };
        const record = body as Record<string, unknown>;
        const quoteId = typeof record.quote_id === "string" ? record.quote_id : null;
        const feeMinor = typeof record.fee_minor === "string" ? record.fee_minor : null;
        return { quoteId, feeMinor };
      },
    );
  },

  // --- Beneficiaries (MOB-19) ---

  /**
   * Confirmed real (`parc-contracts/openapi/payment/v1/openapi.yaml`,
   * `GET /v1/beneficiaries`) — previously documented as entirely missing
   * from the Mobile BFF allowlist (PLAN.md "Real blockers"), now
   * re-verified present. The request (`kind` query param) is fully
   * documented, but the response is prose-only ("Customer-owned
   * beneficiaries") — returned as a raw array, same defensive pattern as
   * FAQs/tickets, not a guessed schema.
   */
  /** Typed list (shape from parc-payment's source); malformed rows are skipped rather than failing the list. */
  async listBeneficiaries(kind: BeneficiaryKind): Promise<BeneficiaryView[]> {
    return request({ method: "GET", path: "/v1/beneficiaries", query: { kind } }, (body) =>
      listItems(body).flatMap((item) => {
        const parsed = beneficiaryViewSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      }),
    );
  },

  async getBeneficiaries(kind?: "all" | "recent" | "favourite"): Promise<Array<Record<string, unknown>>> {
    return request({ method: "GET", path: "/v1/beneficiaries", query: kind ? { kind } : undefined }, listItems);
  },

  /** Confirmed real request shape (`bank_code`/`account_number`/`name`, all required); response is prose-only ("Beneficiary created") — probed defensively for an id. */
  async createBeneficiary(params: { bankCode: string; accountNumber: string; name: string; idempotencyKey: string }): Promise<Record<string, unknown>> {
    return request(
      {
        method: "POST",
        path: "/v1/beneficiaries",
        headers: { "idempotency-key": params.idempotencyKey },
        body: { bank_code: params.bankCode, account_number: params.accountNumber, name: params.name },
      },
      (body) => (typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}),
    );
  },

  async authorizeTransaction(params: { commandType: string; resourceId: string; requestHash: string; pin: string; idempotencyKey: string }): Promise<TransactionAuthorization> {
    return request(
      {
        method: "POST",
        path: "/v1/transaction-authorizations",
        headers: { "idempotency-key": params.idempotencyKey },
        body: { command_type: params.commandType, resource_id: params.resourceId, request_hash: params.requestHash, method: "transaction_pin", pin: params.pin },
      },
      parseWithSchema(transactionAuthorizationSchema, "transaction authorization"),
    );
  },

  /**
   * STILL A GAP (re-verified, PLAN.md "Real blockers"): the payment
   * service's own OpenAPI contract still has no bare `/v1/transfers` path
   * (only `/v1/transfers/bank`/`/v1/transfers/internal`), and neither
   * schema includes `enquiry_token`/`quote_id`/`authorization_token`
   * despite `additionalProperties: false`. `source_account_id` IS now
   * resolved (see `getWalletSourceAccount`). This still calls the Mobile
   * BFF's actual documented public path best-effort.
   */
  async submitTransfer(params: {
    sourceAccountId: string;
    bankCode: string;
    accountNumber: string;
    amountMinor: string;
    currency: string;
    narration: string;
    enquiryToken: string | null;
    quoteId: string | null;
    authorizationToken: string;
    idempotencyKey: string;
  }): Promise<Transfer> {
    return request(
      {
        method: "POST",
        path: "/v1/transfers",
        headers: { "idempotency-key": params.idempotencyKey },
        body: {
          source_account_id: params.sourceAccountId,
          bank_code: params.bankCode,
          account_number: params.accountNumber,
          amount_minor: params.amountMinor,
          currency: params.currency,
          narration: params.narration,
          ...(params.enquiryToken ? { enquiry_token: params.enquiryToken } : {}),
          ...(params.quoteId ? { quote_id: params.quoteId } : {}),
          authorization_token: params.authorizationToken,
        },
      },
      parseWithSchema(transferSchema, "submit transfer"),
    );
  },

  async getTransfer(id: string): Promise<Transfer> {
    return request({ method: "GET", path: `/v1/transfers/${id}` }, parseWithSchema(transferSchema, "transfer status"));
  },

  async getTransferReceipt(id: string): Promise<Record<string, unknown> | null> {
    try {
      return await request({ method: "GET", path: `/v1/transfers/${id}/receipt` }, (body) => (typeof body === "object" ? (body as Record<string, unknown>) : null));
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        return null;
      }
      throw error;
    }
  },

  /** GET /v1/profile relays to auth-customer's fully-typed GET /v1/customers/me. */
  async getProfile(): Promise<Customer> {
    return request({ method: "GET", path: "/v1/profile" }, parseWithSchema(customerSchema, "profile"));
  },

  /**
   * PATCH /v1/profile → auth-customer PATCH /v1/customers/me (strict body:
   * first_name/last_name/email, at least one; Idempotency-Key required).
   * Returns the updated customer view; a taken email is 409 EMAIL_ALREADY_EXISTS.
   */
  async updateProfile(params: { firstName?: string; lastName?: string; email?: string; idempotencyKey: string }): Promise<Customer> {
    return request(
      {
        method: "PATCH",
        path: "/v1/profile",
        headers: { "idempotency-key": params.idempotencyKey },
        body: {
          ...(params.firstName !== undefined ? { first_name: params.firstName } : {}),
          ...(params.lastName !== undefined ? { last_name: params.lastName } : {}),
          ...(params.email !== undefined ? { email: params.email } : {}),
        },
      },
      parseWithSchema(customerSchema, "profile update"),
    );
  },

  async getBillProducts(category: BillCategory): Promise<BillProduct[]> {
    return request({ method: "GET", path: "/v1/bills/products", query: { category } }, (body) => {
      const result = z.object({ products: z.array(billProductSchema) }).safeParse(body);
      if (!result.success) {
        throw new ApiError({ message: "Unexpected response shape from bill products", category: "unknown", status: null });
      }
      return result.data.products;
    });
  },

  async validateBillCustomer(params: { customerId: string; productId: string; customerIdentifier: string; idempotencyKey: string }): Promise<BillValidation> {
    return request(
      {
        method: "POST",
        path: "/v1/bills/customer-validations",
        headers: { "idempotency-key": params.idempotencyKey },
        body: { customer_id: params.customerId, product_id: params.productId, customer_identifier: params.customerIdentifier },
      },
      parseWithSchema(billValidationSchema, "bill customer validation"),
    );
  },

  async quoteBillPayment(params: { customerId: string; productId: string; customerIdentifier: string; amountMinor: string; idempotencyKey: string }): Promise<BillQuote> {
    return request(
      {
        method: "POST",
        path: "/v1/bills/quotes",
        headers: { "idempotency-key": params.idempotencyKey },
        body: { customer_id: params.customerId, product_id: params.productId, customer_identifier: params.customerIdentifier, amount_minor: params.amountMinor, currency: "NGN" },
      },
      parseWithSchema(billQuoteSchema, "bill quote"),
    );
  },

  async submitBillPayment(params: { customerId: string; sourceAccountId: string; quoteId: string; customerIdentifier: string; idempotencyKey: string }): Promise<BillPaymentState> {
    return request(
      {
        method: "POST",
        path: "/v1/bills",
        headers: { "idempotency-key": params.idempotencyKey },
        body: { customer_id: params.customerId, source_account_id: params.sourceAccountId, quote_id: params.quoteId, customer_identifier: params.customerIdentifier },
      },
      parseWithSchema(billPaymentStateSchema, "submit bill payment"),
    );
  },

  async getBillPayment(id: string): Promise<BillPayment> {
    return request({ method: "GET", path: `/v1/bills/${id}` }, parseWithSchema(billPaymentSchema, "bill payment status"));
  },

  async getBillReceipt(id: string): Promise<BillReceipt | null> {
    try {
      return await request({ method: "GET", path: `/v1/bills/${id}/receipt` }, parseWithSchema(billReceiptSchema, "bill receipt"));
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        return null;
      }
      throw error;
    }
  },

  /** RESOLVED (PLAN.md "Real blockers"): previously `{ eligible_products: unknown, loans: unknown }` — both are now fully typed against the lending contract. */
  async getLoanSummary(): Promise<{ eligibleProducts: CustomerLoanProduct[]; loans: CustomerLoan[] }> {
    return request({ method: "GET", path: "/v1/loans/summary" }, (body) => {
      if (typeof body !== "object" || body === null) return { eligibleProducts: [], loans: [] };
      const record = body as Record<string, unknown>;
      const products = z.array(customerLoanProductSchema).safeParse(record.eligible_products);
      const loans = z.array(customerLoanSchema).safeParse(record.loans);
      return { eligibleProducts: products.success ? products.data : [], loans: loans.success ? loans.data : [] };
    });
  },

  async quoteLoan(params: {
    productVersionId: string;
    amountMinor: string;
    currency: string;
    tenor: number;
    repaymentFrequency: RepaymentFrequency;
    purpose?: string;
    employerName?: string;
    monthlySalaryMinor?: string;
    assetType?: string;
    assetValueMinor?: string;
    idempotencyKey: string;
  }): Promise<CustomerLoanQuote> {
    return request(
      {
        method: "POST",
        path: "/v1/loans/quotes",
        headers: { "idempotency-key": params.idempotencyKey },
        body: {
          product_version_id: params.productVersionId,
          amount_minor: params.amountMinor,
          currency: params.currency,
          tenor: params.tenor,
          repayment_frequency: params.repaymentFrequency,
          ...(params.purpose ? { purpose: params.purpose } : {}),
          ...(params.employerName ? { employer_name: params.employerName } : {}),
          ...(params.monthlySalaryMinor ? { monthly_salary_minor: params.monthlySalaryMinor } : {}),
          ...(params.assetType ? { asset_type: params.assetType } : {}),
          ...(params.assetValueMinor ? { asset_value_minor: params.assetValueMinor } : {}),
        },
      },
      parseWithSchema(customerLoanQuoteSchema, "loan quote"),
    );
  },

  /**
   * RESOLVED (PLAN.md "Real blockers" — the most serious gap found this
   * session): `underwriting_evidence` has been removed entirely. The
   * client now supplies only `declared_monthly_income_minor` and
   * `consent_reference`; the backend computes authoritative underwriting
   * evidence itself via an internal-only endpoint never reachable from
   * this app.
   */
  async submitLoanApplication(params: {
    productVersionId: string;
    amountMinor: string;
    currency: string;
    tenureDays: number;
    purpose: string;
    declaredMonthlyIncomeMinor: string;
    consentReference: string;
    correlationId: string;
    idempotencyKey: string;
  }): Promise<LoanApplicationSubmission> {
    return request(
      {
        method: "POST",
        path: "/v1/loan-applications",
        headers: { "idempotency-key": params.idempotencyKey },
        body: {
          product_version_id: params.productVersionId,
          amount_minor: params.amountMinor,
          currency: params.currency,
          tenure_days: params.tenureDays,
          purpose: params.purpose,
          declared_monthly_income_minor: params.declaredMonthlyIncomeMinor,
          consent_reference: params.consentReference,
          correlation_id: params.correlationId,
        },
      },
      parseWithSchema(loanApplicationSubmissionSchema, "submit loan application"),
    );
  },

  async getLoanApplication(id: string): Promise<CustomerLoanApplication> {
    return request({ method: "GET", path: `/v1/loan-applications/${id}` }, parseWithSchema(customerLoanApplicationSchema, "loan application"));
  },

  async getLoanOffer(applicationId: string): Promise<CustomerLoanOffer> {
    return request({ method: "GET", path: `/v1/loan-applications/${applicationId}/offer` }, parseWithSchema(customerLoanOfferSchema, "loan offer"));
  },

  async acceptLoanOffer(params: { offerId: string; offerVersion: number; documentHash: string; consentReference: string; authorizationToken: string; correlationId: string; idempotencyKey: string }): Promise<LoanOfferAcceptance> {
    return request(
      {
        method: "POST",
        path: `/v1/loan-offers/${params.offerId}/accept`,
        headers: { "idempotency-key": params.idempotencyKey },
        body: {
          offer_version: params.offerVersion,
          document_hash: params.documentHash,
          consent_reference: params.consentReference,
          transaction_authorization_token: params.authorizationToken,
          correlation_id: params.correlationId,
        },
      },
      parseWithSchema(loanOfferAcceptanceSchema, "accept loan offer"),
    );
  },

  async quoteLoanRepayment(params: { loanId: string; amountMinor: string; currency: string; source: RepaymentSource; idempotencyKey: string }): Promise<CustomerRepaymentQuote> {
    return request(
      {
        method: "POST",
        path: `/v1/loans/${params.loanId}/repayment-quotes`,
        headers: { "idempotency-key": params.idempotencyKey },
        body: { amount_minor: params.amountMinor, currency: params.currency, source: params.source },
      },
      parseWithSchema(customerRepaymentQuoteSchema, "loan repayment quote"),
    );
  },

  /** transaction_authorization_token is optional per the confirmed contract — repayment sourcing is a category choice (wallet/direct_debit/etc), not a PIN-gated transfer. */
  async submitLoanRepayment(params: { loanId: string; repaymentQuoteId: string; correlationId: string; idempotencyKey: string }): Promise<CustomerRepaymentRequest> {
    return request(
      {
        method: "POST",
        path: `/v1/loans/${params.loanId}/repayments`,
        headers: { "idempotency-key": params.idempotencyKey },
        body: { repayment_quote_id: params.repaymentQuoteId, correlation_id: params.correlationId },
      },
      parseWithSchema(customerRepaymentRequestSchema, "submit loan repayment"),
    );
  },

  // --- Savings (MOB-12) ---

  async getSavingsSummary(): Promise<SavingsSummary> {
    return request({ method: "GET", path: "/v1/savings/summary" }, parseWithSchema(savingsSummarySchema, "savings summary"));
  },

  async createSavingsGoal(params: { customerId: string; savingsAccountId: string; name: string; targetAmountMinor: string; targetDate: string; correlationId: string; idempotencyKey: string }): Promise<SavingsGoalResult> {
    return request(
      {
        method: "POST",
        path: "/v1/savings/goals",
        headers: { "idempotency-key": params.idempotencyKey },
        body: {
          customer_id: params.customerId,
          savings_account_id: params.savingsAccountId,
          name: params.name,
          target_amount_minor: params.targetAmountMinor,
          currency: "NGN",
          target_date: params.targetDate,
          correlation_id: params.correlationId,
        },
      },
      parseWithSchema(savingsGoalResultSchema, "create savings goal"),
    );
  },

  /** No response schema is documented for this endpoint — probes for eligibility/forfeiture/fee fields defensively. */
  async getGoalWithdrawalQuote(params: { goalId: string; amountMinor: string }): Promise<Record<string, unknown>> {
    return request({ method: "POST", path: `/v1/savings/goals/${params.goalId}/withdrawal-quotes`, body: { amount_minor: params.amountMinor, currency: "NGN" } }, (body) =>
      typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {},
    );
  },

  async withdrawFromGoal(params: { goalId: string; amountMinor: string; correlationId: string; idempotencyKey: string }): Promise<GoalWithdrawalResult> {
    return request(
      {
        method: "POST",
        path: `/v1/savings/goals/${params.goalId}/partial-withdrawal`,
        headers: { "idempotency-key": params.idempotencyKey },
        body: { amount_minor: params.amountMinor, currency: "NGN", correlation_id: params.correlationId },
      },
      parseWithSchema(goalWithdrawalResultSchema, "goal partial withdrawal"),
    );
  },

  async breakGoal(params: { goalId: string; correlationId: string; idempotencyKey: string }): Promise<GoalWithdrawalResult> {
    return request(
      { method: "POST", path: `/v1/savings/goals/${params.goalId}/break`, headers: { "idempotency-key": params.idempotencyKey }, body: { currency: "NGN", correlation_id: params.correlationId } },
      parseWithSchema(goalWithdrawalResultSchema, "break goal"),
    );
  },

  async quoteFixedDeposit(params: { productVersionId: string; principalMinor: string; tenorDays: number; correlationId: string }): Promise<FixedDepositQuoteResult> {
    return request(
      {
        method: "POST",
        path: "/v1/savings/fixed-deposit-quotes",
        body: { product_version_id: params.productVersionId, principal_minor: params.principalMinor, currency: "NGN", tenor_days: params.tenorDays, correlation_id: params.correlationId },
      },
      parseWithSchema(fixedDepositQuoteResultSchema, "fixed deposit quote"),
    );
  },

  async createFixedDeposit(params: { productVersionId: string; amountMinor: string; tenureDays: number; quoteId: string; quoteHash: string; acceptedAt: string; acceptanceReference: string; correlationId: string; idempotencyKey: string }): Promise<FixedDepositResult> {
    return request(
      {
        method: "POST",
        path: "/v1/fixed-deposits",
        headers: { "idempotency-key": params.idempotencyKey },
        body: {
          product_version_id: params.productVersionId,
          amount_minor: params.amountMinor,
          currency: "NGN",
          tenure_days: params.tenureDays,
          quote_id: params.quoteId,
          quote_hash: params.quoteHash,
          accepted_at: params.acceptedAt,
          acceptance_reference: params.acceptanceReference,
          correlation_id: params.correlationId,
        },
      },
      parseWithSchema(fixedDepositResultSchema, "create fixed deposit"),
    );
  },

  async getFixedDeposit(id: string): Promise<FixedDepositDetail> {
    return request({ method: "GET", path: `/v1/fixed-deposits/${id}` }, parseWithSchema(fixedDepositDetailSchema, "fixed deposit detail"));
  },

  async getFixedDepositLiquidationQuote(params: { fixedDepositId: string; correlationId: string }): Promise<FixedDepositQuoteResult> {
    return request(
      { method: "POST", path: `/v1/fixed-deposits/${params.fixedDepositId}/liquidation-quote`, body: { currency: "NGN", correlation_id: params.correlationId } },
      parseWithSchema(fixedDepositQuoteResultSchema, "fixed deposit liquidation quote"),
    );
  },

  async liquidateFixedDeposit(params: { fixedDepositId: string; quoteId: string; quoteHash: string; correlationId: string; idempotencyKey: string }): Promise<FixedDepositSettlementResult> {
    return request(
      {
        method: "POST",
        path: `/v1/fixed-deposits/${params.fixedDepositId}/liquidate`,
        headers: { "idempotency-key": params.idempotencyKey },
        body: { currency: "NGN", correlation_id: params.correlationId, quote_id: params.quoteId, quote_hash: params.quoteHash },
      },
      parseWithSchema(fixedDepositSettlementResultSchema, "liquidate fixed deposit"),
    );
  },

  async setFixedDepositMaturityInstruction(params: { fixedDepositId: string; instruction: MaturityInstruction; renewalTenureDays?: number; correlationId: string; idempotencyKey: string }): Promise<FixedDepositInstructionResult> {
    return request(
      {
        method: "PUT",
        path: `/v1/fixed-deposits/${params.fixedDepositId}/maturity-instruction`,
        headers: { "idempotency-key": params.idempotencyKey },
        body: { instruction: params.instruction, currency: "NGN", correlation_id: params.correlationId, ...(params.renewalTenureDays ? { renewal_tenure_days: params.renewalTenureDays } : {}) },
      },
      parseWithSchema(fixedDepositInstructionResultSchema, "fixed deposit maturity instruction"),
    );
  },

  async createRecurringPlan(params: {
    savingsAccountId: string;
    amountMinor: string;
    frequency: RecurringPlanFrequency;
    startDate: string;
    consentReference: string;
    correlationId: string;
    goalId?: string;
    idempotencyKey: string;
  }): Promise<RecurringPlanResult> {
    return request(
      {
        method: "POST",
        path: "/v1/savings/recurring-plans",
        headers: { "idempotency-key": params.idempotencyKey },
        body: {
          savings_account_id: params.savingsAccountId,
          amount_minor: params.amountMinor,
          currency: "NGN",
          frequency: params.frequency,
          start_date: params.startDate,
          consent_reference: params.consentReference,
          correlation_id: params.correlationId,
          ...(params.goalId ? { goal_id: params.goalId } : {}),
        },
      },
      parseWithSchema(recurringPlanResultSchema, "create recurring plan"),
    );
  },
};
