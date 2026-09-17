# Parc Mobile — Design System Foundation (done) + Implementation Plan (Phase 2)

Status: **Approved 2026-09-17.** This is the canonical, living copy of the plan — update it (especially Progress Tracking) at the end of every implementation session. Read this file first in any future session.

## Context

Parc's backend (Kong gateway, Mobile BFF, and the six domain services) is implemented and versioned in `parc-contracts`. The mobile app (`parc-mobile/`) started this engagement as a bare Expo scaffold with no theme, no navigation beyond the default stack, no API client, and no state management. The goal of this engagement is: (1) give the app a tenant-aware, typed design-system/theme foundation grounded in the actual Figma file rather than invented values — **done and verified** — and (2) produce a concrete, evidence-based implementation plan for the rest of the app, so that screen-building work proceeds from an approved plan rather than ad hoc.

This plan reflects direct inspection of the workspace, the real Mobile BFF source code (not just its docs), and the real Figma file (Design System + all three flow canvases), plus your answers to the open architecture/scope questions raised while building it.

---

## Part 1 — Theme foundation (completed, verified)

**Files created in `parc-mobile/src/theme/`:** `types.ts`, `primitives.ts`, `colorUtils.ts`, `tokens.ts`, `typography.ts`, `spacing.ts`, `componentStyles.ts`, `tenantTheme.ts`, `storage.ts`, `ThemeProvider.tsx`, `useTheme.ts`, `index.ts`, plus `themes/defaultTheme.ts` and `themes/darkTheme.ts`, and 3 test files under `__tests__/`. Also added `jest` + `jest-expo` + `@testing-library/react-native` test tooling to `package.json` and `types: ["jest"]` to `tsconfig.json` (no test runner existed before).

**Verified:** `npx tsc --noEmit` clean; `npx jest` → 3 suites / 16 tests passing.

**Grounded in real Figma data** (file `9auGumDGNDtTwJ5XOgDr8K`, node `20:21`, cross-checked against its "Design Tokens" CSS-variable section as the canonical source): full semantic color set (primary #000000, secondary #E615CA magenta, status colors, text/border/surface scale), full type scale (Plus Jakarta Sans, 11 named styles), 4px-based spacing scale, 8 radius tokens, 6 elevation/shadow tokens, icon sizes, control heights, and motion tokens (durations/easing). Primitive palette ramps (black 50–950, magenta 50–900) are kept separate from the semantic tokens consumers should actually use.

**Architecture:** three-layer token system (primitives → semantic tokens → typed component-style recipes) behind a React Context `ThemeProvider`/`useTheme()` hook, with a strict `TenantThemeOverrides` allowlist (7 color keys, 2 radius keys, 2 logo URL keys — nothing else) validated key-by-key against an explicit allowlist (never spreads untrusted input, so unknown keys including `__proto__`/`constructor` are dropped, not merged — tested). Dark mode is architecturally wired (mode-aware context, `darkTheme.ts` file, `useColorScheme` integration) but **currently an identity fallback to light** because Figma defines no dark-mode tokens at all — flagged rather than invented.

**Resolved — action item:** Plus Jakarta Sans (not JetBrains Mono) is authoritative for financial amounts and data. `typography.ts`'s `amountXl` style and the surrounding comments in `typography.ts`/`primitives.ts` need a small correction to point `amountXl.fontFamily` at `fontFamilies.sans` and drop the now-resolved Mono framing. Tracked as THEME-02 below.

**Open items you should know about (not blocking, already handled with safe fallbacks):**
- No font files exist yet for Plus Jakarta Sans — theme currently resolves to the OS system font everywhere until the real `.ttf` files are added and `expo-font` is wired.
- Button/input/status component-style recipes in `componentStyles.ts` are assembled from confirmed semantic tokens using conventional patterns (solid primary, outlined secondary, etc.) — the design system's button/input node IDs were enumerated but not deep-pixel-inspected. Treat as provisional until someone verifies against Figma nodes `20:1666`–`20:1780` and `20:1841`–`20:1989`.
- `overlay`/`scrim` colors and status-tone "subtle" backgrounds are derived programmatically (`withAlpha()`) rather than read from Figma, since no explicit values existed there.

**Approved architecture decisions:**
- **State/server-cache:** TanStack Query (server state) + Zustand (small local/session state).
- **Forms:** react-hook-form + zod.
- **Secure storage:** `expo-secure-store` for tokens/session material.
- **Theme persistence:** approved — add `@react-native-async-storage/async-storage` and wire it as the `ThemeStorageAdapter` (currently a no-op; this is a same-shape follow-up change, not a redesign).
- **Biometrics:** `expo-local-authentication` (local unlock convenience, not a replacement for server auth).
- **Certificate pinning:** skipped for v1.
- **Platforms:** iOS + Android only for v1 (`react-native-web` stays an unused scaffold dependency; do not build web-specific flows).
- **Analytics/crash reporting:** Sentry.
- **Transaction PIN UX:** one reusable bottom-sheet PIN modal for all money-movement confirmations (matches the dominant Figma pattern). The full-screen Create/Confirm Transaction PIN frames (Figma nodes `325:868`, `325:916`) become a real one-time prerequisite feature — triggered the first time a new customer attempts *any* money-movement action, gating that action until a transaction PIN exists. The standalone full-screen "Authorize" frame (`325:814`) is superseded by the bottom-sheet modal and is not built as a separate screen.
- **Canonical phone-verification screen:** Figma node `322:263` (referral code + ToS checkbox + Login link) — matches the confirmed backend registration contract (`referral_code`, `terms_version`, `consented_at`).
- **Bottom tab bar:** a floating "glass pill" style, cross-platform glassmorphism via `expo-blur`'s `BlurView` (with `experimentalBlurMethod="dimezisBlurView"` on Android for genuine blur, not just a translucent overlay), replacing `expo-router`'s default tab bar via the `Tabs` component's `tabBar` render prop. Built as `src/components/GlassTabBar/GlassTabBar.tsx`, fully theme-token-driven (no hardcoded values, per `.clauderules`). Tab icons are a documented placeholder (`@expo/vector-icons`, added as a new dependency — it is not bundled by default in this Expo SDK 57 scaffold) until the real Figma icon set (Iconography section, node `20:824`–`20:1168`) is exported as assets.

---

## Part 2 — Evidence base for this plan

- **Workspace:** `parc-mobile/` is Expo SDK 57 / RN 0.86.3 / React 19.2.3 / expo-router (file-based routing, typed routes already enabled) / TypeScript strict. No navigation, API client, or state management existed beyond the default `Stack` in `src/app/_layout.tsx` before this engagement. `eas.json` already exists (EAS project ID configured) — treat EAS Build/Submit as the intended release pipeline. A second scaffold directory, `parc-mobile_/`, existed at the start of this work but was removed from the filesystem by something outside the session partway through (not by any command run as part of this work) — it only ever contained empty placeholder files, so nothing of substance was lost, but flagging the unexplained deletion.
- **`mobile-flow-map.md`** — the implementation-aligned BFF consumption guide (Ready/Partial/Pending per flow) and the earlier planning `mobile-flow-map_planning.md` (screen-by-screen backend needs).
- **`parc-backend-development-plan.md`** and **`parc-interview-answers.md`** — confirmed backend business rules (KYC tiers, lending/savings rules, provider routing, maker-checker policy, retention, revenue sharing) that the client must treat as server-authoritative and never re-implement.
- **`parc-mobile-bff/src/*.ts` (read in full) + `parc-contracts/openapi/mobile-bff/v1/openapi.yaml`** — verified, code-grounded API matrix (Part 4 below); several claims in `mobile-flow-map.md` were independently confirmed true against the actual Express routes, not just the docs.
- **Figma file `9auGumDGNDtTwJ5XOgDr8K`** — Design System (`20:21`), Onboarding flow (`226:1407`, 23 screens), Wallet/Dashboard flow (`326:968`, 54 frames), Electricity/TV Subscription flow (`398:810`, 7 frames) — all inspected via `get_metadata` + targeted `get_screenshot`/`get_design_context` passes.

### Confirmed blockers (backend work required before the corresponding screen can be built for real, not just against a fixture)

| Screen/feature | Blocker |
|---|---|
| Create/Confirm Transaction PIN | No Mobile BFF route exists for transaction-PIN setup/confirm/rotate — only `POST /v1/transaction-authorizations` (an already-provisioned-PIN check) exists. Already listed as a P0 backend backlog item in `mobile-flow-map.md` §8; this plan adds "blocks first transaction" as a hard product dependency. |
| Refresh token / Logout | No Mobile BFF route at all. Confirmed in code, not just docs. |
| Forgot/Reset Passcode recovery | No Mobile BFF route at all. Confirmed in code. |
| Full Security screen (device/session management) | Only a read-only summary (`GET /v1/security`) exists. |
| Notification preferences / push-token registration | Only a feed read (`GET /v1/notifications`) exists — no way to register a device for push at all. |
| Savings withdrawal / liquidation / maturity / recurring plans | Only summary + create-goal + create-fixed-deposit exist. |
| Statements | Route exists but returns an untyped/generic job-status body, not a typed schema. |

**All blockers above are backend-side and are being worked from your side** — you'll notify when resolved; no design-side blockers remain.

**Internet Bill is out of scope** — removed from the Home quick-services grid in Figma. No Internet bill screen, route, or backlog item exists in this plan.

### Electricity & TV Subscription — fully in scope, including self-designed completion screens (Figma node `398:810`)

Real Figma screens exist for both (7 frames total: provider search/pick, smartcard/meter entry + plan/amount selection, and a shared checkout-bottom-sheet pattern — amount summary → "Use Payment PIN" shortcut → cashback toggle → payment method → pay button). That checkout pattern is duplicated once per product in Figma and should become a single reusable `BillCheckoutSheet` component consumed by both, not two separate implementations.

**Confirmed:** the DisCo list and TV-provider list are fetched from `GET /v1/bills/products` (not a hardcoded catalog) — the Figma lists are sample content only.

**Missing completion/edge states are self-designed** (not blocked), following the existing design system rather than inventing new patterns — the same approach applies to any other screen found to be incomplete once implementation reaches it. The Design System extraction (Part 1) already documented the exact reusable components to compose these from:

- **Success/receipt screen** — compose the existing `SuccessState` component (Figma node `20:3202`), mirroring the pattern already used by the real Figma Send Money Success and Loan Repayment Success screens (recipient/amount/reference summary + Done CTA). One shared bill-receipt layout, parameterized by product.
- **Prepaid electricity token-reveal** — a variant of that same success screen surfacing the 11-digit NERC token prominently (large numeral style, tap-to-copy), since the backend explicitly returns `electricity_token` on success (`mobile-flow-map_planning.md` §15). Not needed for TV Subscription (no token concept there).
- **Error state** — compose the existing `ErrorState` component (`20:3224`) for validation failures (bad meter/smartcard number, provider rejection) and payment failures.
- **Empty state** — compose the existing `EmptyState` component (`20:3145`) for the Electricity beneficiaries list with no saved meters yet (TV Subscription has no dedicated beneficiaries page in Figma, so this only applies to Electricity).
- **Loading state** — compose `LoadingSpinner` (`20:3166`) for the provider-catalog fetch and `SkeletonTransactionRow`-style skeletons where a list is loading; a pending/submitting state on the checkout sheet's pay button while the bill payment request is in flight (never a second tap resubmits — matches the idempotency handling in Part 5).
- **PIN entry** — no new keypad screen is designed or needed; this reuses the shared bottom-sheet `PinPad` component (Part 1 decision), triggered from "Use Payment PIN."

**Electricity fields:** provider (DisCo) card + picker sheet (dynamic list via `GET /v1/bills/products`), Prepaid/Postpaid toggle, meter/account number input with post-entry name verification, voucher row, preset amount grid (₦1,000–₦20,000) + custom amount, dedicated "My Electricity Beneficiaries" screen (saved meters, Quick Recharge).

**TV Subscription fields:** provider search/list (dynamic via `GET /v1/bills/products`, tabbed Satellite Dish/Digital Antenna filter), smart-card/IUC number input with post-entry name verification, bouquet/plan grid with duration + price + strikethrough original price + cashback chip, inline "Saved Decoders" quick-select.

---

## Part 3 — Figma-to-screen matrix (condensed)

**Onboarding (23 screens, `226:1407`):** Get Started → Sign In / Phone-Email Login / Enter Passcode (existing-user path) or Phone Verification (`322:263`, canonical) → Phone OTP (+ Error/Resend variants) → Email Verification (optional) → Email OTP → NIN → Face Verification → Identity Verified → Address → PEP → Source of Income → Create Passcode → Confirm Passcode → Passcode Success → Setup Biometrics. A separate Forgot-Passcode → Reset-Passcode recovery loop reuses the OTP component but has no backing API (see blockers). Create/Confirm Transaction PIN is inserted as a gate the first time the customer attempts a money-movement action (not part of the onboarding sequence itself).

**Wallet/Dashboard (54 frames → ~28 distinct screens, `326:968`):** Home, a "Payments" hub screen (Send Money banner + Bills grid + beneficiaries), Transaction History (with inline All/Credits/Debits/Bills tabs — no separate filter screen), Account Statement, Add Money, full Send Money sequence (Account Entry → Bank Picker → Amount & Remark → Review → Success), Buy Airtime and Buy Data (form→selection→PIN-confirm→success, PIN-confirm as the shared bottom-sheet modal), Loans tab + 4 product forms (Instant/Personal/Asset/Salary, one shared template with swapped fields) + Loan Repayment, Savings tab + Create Target Savings + Create Fixed Deposit, Profile/Me + Edit Profile + Security + Notifications + Referral + Help & Support.

**Electricity & TV Subscription (7 frames, `398:810`):** see Part 2.

**Known Figma cleanliness issues to route around, not silently "fix" in code:** several exact-duplicate frames (Home, Payments hub, Personal Loan form, a Transaction History tab state) — harmless, just don't build the duplicates as separate screens.

---

## Part 4 — API integration matrix (condensed, code-verified against `parc-mobile-bff/src/*.ts` + the OpenAPI contract)

| Category | Examples | Notes |
|---|---|---|
| **Ready** | Bootstrap, phone/email onboarding steps, passcode login, passkey auth, dashboard, transactions, transfers (enquiry→quote→submit→status→receipt), bills (catalogue→validate→quote→submit→status→receipt), loan summary/quote/application/repayment, savings summary/create-goal/create-fixed-deposit, profile, support | Functionally callable today. Almost all of these return **generic passthrough bodies** (`relay()` does zero schema validation) rather than typed responses — see below, this affects the API-client layer design, not whether the feature can be built. |
| **Ready with clarification** | `GET /v1/loans/summary` | The one bespoke (non-relay) composition endpoint; response is only partially typed (`eligible_products`/`loans` contents are `unknown`) — verify shape empirically against a real backend response before trusting the generated client type. |
| **Requires contract adjustment** | Statements (`POST/GET /v1/statements*`) | Route works but is description-only in the OpenAPI contract (no concrete schema) — typed client generation will yield `unknown` here until the contract is fixed. |
| **Missing (no BFF route)** | Refresh token, Logout, Forgot/Reset Passcode, transaction-PIN setup/confirm/rotate, full Security (device/session mgmt), notification preferences + push-token registration, savings withdrawal/liquidation/maturity/recurring plans, referral detail/history | Build against local fixtures behind a feature flag; do not call any domain service directly. |

### Onboarding contract gaps (discovered while implementing MOB-05, confirmed against `parc-contracts/openapi/auth-customer/v1/openapi.yaml` directly — the Mobile BFF's own contract documents all of these as untyped `JsonCommand`)

- **`consent_ids` has no discovery path.** `POST /v1/onboarding/registrations` and `POST /v1/onboarding/identity` both require a client-supplied consent-document UUID, but no public endpoint anywhere in `parc-contracts` (checked `auth-customer`, `tenant-admin`, `mobile-bff`) lets the mobile app discover the tenant's current ToS/Privacy/NIN-consent document IDs. The only related endpoint, `tenant-admin`'s `/internal/v1/tenants/{id}/consent-documents/validate`, is internal service-to-service only. **This blocks real registration in production** — right now `EXPO_PUBLIC_DEV_CONSENT_IDS` (see `src/features/onboarding/consent.ts`) is a dev-only workaround reading hardcoded UUIDs from an env var for testing against a seeded backend. The real fix most naturally belongs in an expanded `GET /v1/bootstrap` response.
- **10 of 12 onboarding operations document zero response schema** — only `registrations` and `GET /v1/onboarding/status` have one. Mitigated architecturally: every onboarding screen calls its mutation, ignores whatever body comes back, then calls `useAdvanceOnboarding()` which refetches `GET /v1/onboarding/status` (fully schema'd) as the single source of truth for what screen comes next — this sidesteps needing to guess 8 of the 10 undocumented shapes.
- **Face verification (`POST /v1/onboarding/face-verification`) is a confirmed hard blocker, not a design gap.** It requires a `photo_url` the client is expected to have already uploaded, but no upload-URL-issuing endpoint exists anywhere in the contract, and the endpoint's own undocumented response doesn't surface the `verification_id` its own confirm step (`.../confirm`) requires as input. `(onboarding)/face.tsx` renders the intended screen shell with a `__DEV__`-only bypass (never present in a production build) so the rest of the chain stays testable.
- **Email verification's challenge_id is a genuine gap, handled defensively.** `PUT /v1/onboarding/email`'s response is undocumented despite its description implying a challenge is created. `api.setOnboardingEmail` probes a few plausible response shapes for a `challenge_id`; if none is found, `(onboarding)/email.tsx` tells the customer honestly and offers Skip rather than navigating to a guaranteed-broken OTP screen.
- **Address and income fields are free text, not pickers, and there is no reference/lookup endpoint for either.** Figma's state/LGA and occupation/income-band screens imply dropdowns; the confirmed `OnboardingAddress`/`OnboardingIncome` schemas type all of these as unconstrained strings with only length bounds, and no states/LGA or occupation/income-band lookup endpoint exists anywhere checked. Built as plain text fields until such an endpoint exists — do not hardcode a fabricated states/LGA or income-band list into the client.

**Discovered while implementing MOB-01/03 (confirmed against the real BFF route, `app.ts:427-467`):** `GET /v1/dashboard`'s actual response is much thinner than `mobile-flow-map_planning.md`'s original Home Screen description implied — it is exactly `{ wallet: { available_balance }, sections: { loans: {available, error_code?}, savings: {available, error_code?} } }`. There is no account number, no recent-transactions feed, no loan teaser, no customer name/KYC tier in this response. The full Figma Home screen needs separate composed calls (`GET /v1/wallet/funding-details`, `GET /v1/transactions`, `GET /v1/loans/summary`, `GET /v1/profile`) layered on top — the initial sprint's Home tab (MOB-03) intentionally renders only what `GET /v1/dashboard` actually returns; the richer composition is deferred to backlog items 4/5/7 (Part 6).

**Two implementation-affecting mechanics confirmed in code, not assumed:**
1. **`Idempotency-Key` is far weaker than the OpenAPI contract implies.** The contract marks it `required: true` on almost every mutating operation, but the BFF only actually *enforces* it on the 5 public pre-auth routes — for every authenticated route (transfers, bills, loan applications, savings, profile edits, etc.) the header is read *optionally* and just forwarded if present. **The mobile client must generate and send a stable idempotency key on every financial command itself** — the BFF will not stop a client that forgets to.
2. **Almost every response body is untyped.** Only `bootstrap`, `dashboard`, `transactions` (declared, unvalidated), and the statements *request* are concretely schema'd. Generated-client codegen from the current OpenAPI file will produce `unknown`/`any` for the large majority of the 49 operations. The API client layer must defensively runtime-validate (zod) response shapes it actually depends on, rather than trusting generated types blindly.

---

## Part 5 — Application architecture

### Folder structure (inside `parc-mobile/src/`)

```
app/                    expo-router routes (thin — import from features/*)
  (auth)/               onboarding + login screens, unauthenticated route group
  (tabs)/               Home, Payments, Loans, Savings, Me — bottom tab group
api/
  client.ts             Axios instance + interceptors (correlation IDs, bearer/tenant
                         injection, session-refresh scaffold, normalized error handling)
                         plus every typed endpoint method — see Part 5 "HTTP transport"
  generated/            generated types from parc-contracts openapi — never hand-edited
  queries/              TanStack Query hooks per domain (useDashboard, useTransactions, ...)
auth/
  tokenStorage.ts        expo-secure-store wrapper
  AuthProvider.tsx / useAuth.ts
  biometrics.ts          expo-local-authentication wrapper
theme/                   done (Phase 1)
components/              shared design-system components built from theme/componentStyles.ts
  PinPad/, OtpInput/, BottomSheet/, StatusBadge/, MoneyText/, GlassTabBar/, ...
features/
  onboarding/, auth/, transactionPin/, dashboard/, transfers/, bills/,
  loans/, savings/, profile/, notifications/, referrals/, support/
state/
  stores/                Zustand stores (session, ui) — not server data
hooks/  utils/  types/  config/  observability/  navigation/
```

`expo-router` (already a scaffold dependency, typed routes already enabled in `app.json`) is kept as the navigation layer rather than introducing React Navigation directly — it's already installed, file-based, and consistent with the existing convention.

### Money/currency handling

Per the backend's own invariant ("integer-minor-unit decimal string with explicit currency, never floating point"), the client **never computes money** — it only formats server-provided minor-unit strings for display (`utils/money.ts`, string/BigInt-safe division for major-unit display, currency-aware formatting). No fee, interest, limit, or eligibility calculation is ever duplicated client-side.

### Financial-command idempotency helper

Given the confirmed BFF gap above, `api/client.ts` generates a UUID idempotency key per logical financial command (persisted for the lifetime of that in-flight command, including retries with identical payload) and treats a network timeout on a financial submission as "query status, never resubmit."

### HTTP transport (Axios)

`api/client.ts` owns a single Axios instance (`httpClient`) for all HTTP transport — base URL, default headers, 15s timeout, and two interceptors:

- **Request interceptor**: stamps a fresh `X-Correlation-Id` per attempt; for any call not explicitly marked public (`parcRequiresAuth: false` — bootstrap, passcode login, onboarding registration/phone-verify), reads the current session from `useSessionStore` and injects `Authorization: Bearer <token>` + `X-Tenant-Id`. A missing session rejects synchronously with an `ApiError` (`category: "authentication"`) before any request leaves the device.
- **Response interceptor**: normalizes every failure (network/timeout/HTTP error) into one `ApiError` shape (`category`, `status`, `code`, `correlationId`, `retryable`) via `normalizeAxiosError`, so no screen ever has to branch on raw Axios/fetch error shapes. It also owns the **session-refresh scaffold**: on a 401 from an authenticated call, it calls `attemptSessionRefresh()` once per request (guarded by a `parcRetried` flag to avoid loops) before giving up. Today `attemptSessionRefresh()` always clears the session and returns `false` — **this is intentional, not a placeholder bug**: no Mobile BFF refresh route exists yet (PLAN.md Part 2 "Confirmed blockers"), so a 401 correctly and immediately ends the session, and the root layout's `Stack.Protected` guard routes back to `(auth)`. When the real refresh endpoint lands, only this one function needs a real implementation (call it via `httpClient` with `parcRequiresAuth: false`, store the new token pair, return `true`); every call site and every screen's error handling stays unchanged.

Every one of the 30+ typed endpoint methods below the transport layer calls a shared `request<T>()` helper and never touches Axios directly, so transport concerns live in exactly one place.

### Error and exception handling across the app

- **Expected, user-facing errors** (validation, auth, conflict, rate-limit — anything a customer can act on) surface as an `ApiError` with a human-readable `message`, caught by each screen's own `try/catch` and shown inline (the pattern used consistently across every screen built so far). These are never reported to Sentry — they're not bugs.
- **Unexpected errors** (network failures, 5xx, unrecognized response shapes, anything else) funnel through one function, `observability/reportError.ts` — logs to the console in development and to Sentry (no-ops safely if no DSN is configured) in all environments. Three things call it: the Axios response interceptor (network/dependency/unknown `ApiError`s), TanStack Query's global `QueryCache`/`MutationCache` `onError` hooks (`api/queryClient.ts` — catches zod parse failures and any other non-`ApiError` failure inside a query/mutation, without double-reporting ordinary `ApiError`s the interceptor already triaged), and `components/ErrorBoundary/ErrorBoundary.tsx`.
- **`ErrorBoundary`** wraps the entire app (outermost provider in `app/_layout.tsx`, even outside `ThemeProvider`, so it survives a failure in the theme layer itself) and catches render errors that would otherwise crash to a blank/red screen — shows a themed fallback with a retry action instead. It's a class component (required for React Error Boundaries) and deliberately reads `defaultTheme` directly rather than `useTheme()`, since it must not depend on context that might be what broke.

---

## Part 6 — Feature backlog (phase order)

1. **Foundation** — API client + TanStack Query setup, Zustand session store, expo-secure-store token storage, Sentry init, error boundary, theme wiring into `_layout.tsx`, AsyncStorage theme persistence.
2. **Bootstrap + Login vertical slice** — `GET /v1/bootstrap` → Sign In Options → Enter Passcode → Dashboard (read-only). This is the thin, runnable first slice (see Part 8) — shortest path to a real authenticated screen, everything else depends on it.
3. **Signup/onboarding** — full 23-screen chain including the Transaction-PIN prerequisite feature (built against fixtures where the BFF gap applies: forgot-passcode recovery).
4. **Dashboard + Transactions + Statements** (statements gated behind the "requires contract adjustment" flag until typed).
5. **Transfers** (name enquiry → quote → bottom-sheet PIN → submit → receipt).
6. **Bills** — Airtime/Data ready; Electricity and TV Subscription have real Figma screens (node `398:810`) plus self-designed success/token-reveal/error/empty/loading states composed from existing Feedback-section components (Part 2); build the shared `BillCheckoutSheet` component once, reuse for both; provider catalogs fetched from `GET /v1/bills/products`. Internet Bill is out of scope.
7. **Loans** (summary, 4 product application forms, repayment).
8. **Savings** (summary, create-goal, create-fixed-deposit; withdrawal/liquidation/recurring behind fixtures until BFF exposes them).
9. **Profile/Security/Notifications/Referrals/Support** (each partially blocked per Part 4 — build the Ready slice, fixture the rest).

No calendar/sprint-count estimates are given since team size/velocity wasn't specified — this is a dependency-ordered backlog, not a schedule.

---

## Part 7 — Testing, CI/CD, observability

- **Unit/component:** Jest + jest-expo + @testing-library/react-native (already wired for theme; extend to features).
- **API contract tests:** zod-validate responses the app actually depends on, against fixtures captured from real BFF calls.
- **E2E:** not selected yet — recommend Maestro (simpler YAML flows, good Expo support) as a follow-up decision once there are real screens to test.
- **CI/CD:** GitHub Actions (consistent with every backend repo) + EAS Build/Submit (already configured via `eas.json`).
- **Observability:** Sentry for crash/error/performance; structured logger with the same redaction rules as the backend (never log tokens, PINs, OTPs, NIN/BVN, full account numbers).

---

## Part 8 — Initial sprint (concrete, thin vertical slice)

**Scope:** wire the app shell end-to-end through one real screen, proving the whole stack works — not "implement onboarding."

1. Add approved dependencies: `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `expo-secure-store`, `expo-local-authentication`, `@react-native-async-storage/async-storage`, `@sentry/react-native`, `expo-blur`.
2. Wire `ThemeProvider` (already built) into `src/app/_layout.tsx`; inject the AsyncStorage-backed `ThemeStorageAdapter`.
3. Build `api/client.ts` against `GET /v1/bootstrap` (the one fully-typed, public, zero-risk endpoint) — base URL config, `X-Tenant-Slug` header, error normalization.
4. Build the Sign In Options → Enter Passcode screens (using theme tokens + new shared `PinPad` component) against `POST /v1/auth/passcode/login`.
5. Build the `(tabs)` shell with `GlassTabBar` (floating glass-pill bottom tab bar, `expo-blur`) and a read-only Dashboard/Home tab against `GET /v1/dashboard` (the one fully-typed authenticated endpoint) using TanStack Query; other tabs (Payments/Loans/Savings/Me) get minimal placeholder screens so the tab bar is fully wired end to end.
6. Wire `expo-secure-store` token persistence and a basic `AuthProvider`/`useAuth` guard in the `(tabs)` route group.

**Explicit exclusions from this sprint:** onboarding/signup, transfers, bills, loans, savings, biometric login, Sentry deep integration (init only), any fixture-backed "missing route" screens.

**Verification:** `npx tsc --noEmit` clean; `npx jest` → 3 suites / 16 tests passing; `npx expo export --platform ios` bundles all 1780 modules with no resolution errors (no GUI simulator is available in this environment, so this static bundle is the strongest available proxy — an actual simulator/device run against a live or seeded dev backend to confirm bootstrap → login → dashboard rendering visually is still outstanding and should happen before this is considered fully done).

---

## Part 9 — `.clauderules` (guardrails, `parc-mobile/.clauderules`)

See `parc-mobile/.clauderules` for the current text — created alongside this plan. Summary: forbids hardcoded hex/spacing/typography literals anywhere under `src/` except `src/theme/`; requires all color/spacing/typography to flow through `useTheme()`; forbids hardcoded tenant branding in feature code.

## Part 10 — `SKILL.md` (operational playbook, `parc-mobile/.claude/skills/figma-to-component/SKILL.md`)

See that file for the current text — created alongside this plan. Summary: how to convert a new Figma node into a reusable, multi-tenant-safe, token-driven React Native component without duplicating existing patterns.

---

## Progress tracking

This is a live delivery tracker and must be updated at the end of every implementation session.

Status legend:
- `[x]` Completed and validated
- `[-]` Partially completed
- `[>]` In progress
- `[ ]` Not started
- `[!]` Blocked

Current progress:

- [x] **THEME-01 — Theme foundation.** `src/theme/` (types, primitives, colorUtils, tokens, typography, spacing, componentStyles, tenantTheme, storage, ThemeProvider, useTheme, index, `themes/{default,dark}Theme.ts`) built from real Figma extraction; `jest`/`jest-expo`/`@testing-library/react-native` added since no test runner existed. `npx tsc --noEmit` clean; 3 suites / 16 tests passing.
- [x] **THEME-02 — Theme correction + docs.** `amountXl` now uses `fontFamilies.sans`, `fontFamilies.mono` removed from `primitives.ts`; `docs/theme/README.md` written (token audit + resolved/open items); `parc-mobile/.clauderules` created; `parc-mobile/.claude/skills/figma-to-component/SKILL.md` created; `@.clauderules` added to `parc-mobile/CLAUDE.md`. `npx tsc --noEmit` clean, 3 suites / 16 tests still passing.
- [x] **MOB-00 — Dependencies.** Installed `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `expo-secure-store`, `expo-local-authentication`, `@react-native-async-storage/async-storage`, `@sentry/react-native`, `expo-blur`, `expo-crypto`, `@expo/vector-icons` (the last three added beyond the original list: `expo-crypto` for reliable cross-engine UUID generation, `expo-blur`/`@expo/vector-icons` for the glass tab bar — see MOB-03A). AsyncStorage wired into `ThemeProvider` via `theme/storage.ts`'s `asyncStorageThemeAdapter`; jest `moduleNameMapper` added for AsyncStorage's native-module mock. `NSFaceIDUsageDescription` added to `app.json` for `expo-local-authentication`.
- [x] **MOB-01 — API client + bootstrap.** `api/client.ts` (fetch wrapper, correlation IDs, ApiError normalization, zod response validation) against `GET /v1/bootstrap`; `api/schemas.ts` mirrors the real OpenAPI/auth-customer schemas exactly (Bootstrap, Dashboard, PasscodeLoginRequest/AuthResult/TokenPair — the passcode-login body shape was sourced from `parc-contracts/openapi/auth-customer/v1/openapi.yaml` since the Mobile BFF relays it as an untyped `JsonCommand`).
- [x] **MOB-02 — Login vertical slice.** Three screens per the real Figma sequence: Sign In Options (`(auth)/index.tsx`) → Phone/Email identifier entry (`(auth)/login.tsx`) → Enter Passcode (`(auth)/passcode.tsx`, shared `PinPad` component) against `POST /v1/auth/passcode/login`. `useAuth()` (`src/auth/`) owns login/logout, device-id generation, and SecureStore persistence.
- [x] **MOB-03 — Dashboard (read-only).** `(tabs)/index.tsx` against `GET /v1/dashboard` via TanStack Query, rendering exactly what that endpoint returns (see the "Discovered while implementing" note above) with loading/error/pull-to-refresh states.
- [x] **MOB-03A — Glass floating-pill bottom tab bar (added mid-sprint).** `GlassTabBar` (`src/components/GlassTabBar/`) replaces `expo-router`'s default `Tabs` tab bar via the `tabBar` render prop; cross-platform blur via `expo-blur`'s `BlurView` (`experimentalBlurMethod="dimezisBlurView"` on Android for genuine blur). Per-tab icon/label stay generic (read from each screen's own `options.tabBarIcon`/`title`), so the component doesn't special-case any tab. `Payments`/`Loans`/`Savings`/`Me` are themed placeholder screens so the tab bar is fully navigable end to end.
- [x] **MOB-04 — Auth session plumbing.** `expo-secure-store`-backed `tokenStorage.ts`, `AuthProvider` (one-time hydration), `useSessionStore` (Zustand, in-memory mirror), and root-layout `Stack.Protected` guards routing between `(auth)` and `(tabs)` based on session state — no manual redirect logic needed.
- [-] **MOB-05 — Onboarding chain.** All 17 screens built (`(auth)/{index,sign-in,register-phone,register-otp}.tsx` + 13 screens under `(onboarding)/`), 3-way root gate (`(auth)`/`(onboarding)`/`(tabs)`) driven by `GET /v1/onboarding/status`, resumable via `(onboarding)/index.tsx`'s step-redirect. **RESOLVED this session**: `GET /v1/onboarding/reference-data` (new, public) closed three gaps at once — `register-phone.tsx`/`identity.tsx` now discover real consent documents (`EXPO_PUBLIC_DEV_CONSENT_IDS`/`features/onboarding/consent.ts` deleted, no longer needed), and `address.tsx`/`income.tsx` now use a real bottom-sheet `PickerField` component sourced from the endpoint's states/LGA/occupation/income-band lists instead of free text. Email OTP (`email.tsx`) and phone verification (`register-otp.tsx`) also now consume typed `email_challenge`/`tokens`+`onboarding` fields directly instead of probing. Still marked partial for one honest reason: **Face Verification** remains a `__DEV__`-only bypass shell — the endpoint's shape changed (`liveness_reference` instead of `photo_url`, fully typed request/response now) but no VerifyMe SDK is integrated, so the client still has no way to produce a real liveness reference. Verified: `npx tsc --noEmit` clean, 5 suites/27 tests passing.
- [x] **MOB-06 — Transaction PIN prerequisite.** **RESOLVED this session** — `POST /v1/security/transaction-pin/{setup,confirm,rotate}` now exist (confirmed: `setup` mints a fresh anti-replay `challenge_id`, `confirm` consumes it with the chosen 4-digit PIN directly, no OTP step). Built `security/transaction-pin/{create,confirm,success}.tsx` (mirrors the onboarding create/confirm-passcode pattern via a new `features/security/transactionPinDraft.ts`). `TransactionPinSheet` now offers a "Set up transaction PIN" action on a 401 from `POST /v1/transaction-authorizations`, since the contract gives no way to distinguish "wrong PIN" from "no PIN set yet" (both return a generic 401) — disclosed in code rather than guessed. Verified: `npx tsc --noEmit` clean, 5 suites/27 tests passing.
- [-] **MOB-07 — Transactions + statements.** `GET /v1/transactions` is fully typed (`TransactionPage`) and built as an infinite-scroll, pull-to-refresh, status-filterable list (`app/transactions.tsx`, pushed on top of the tabs so the floating tab bar hides naturally). **Real schema is thinner than Figma implied**: `TransactionRow` only has `id/status/amount/occurred_at` — no counterparty name, narration, or reference field exists in the confirmed contract, so filtering is by status only (pending/posted/failed/reversed), not the Credits/Debits/Bills tabs Figma showed. Statements (`app/statement.tsx`) is marked partial: `POST /v1/statements` has a typed request but an undocumented 202 response that doesn't confirm returning an id, and `GET /v1/statements/{id}` has no documented response schema at all — both are defensively probed (same pattern as the onboarding email-challenge gap) and the screen shows the honest outcome (including "couldn't confirm an id") rather than assuming success. No date-picker component exists yet, so statement date range is plain YYYY-MM-DD text entry. Verified: `npx tsc --noEmit` clean, 3 suites/16 tests passing, `npx expo export --platform ios` bundles cleanly.
- [-] **MOB-08 — Transfers.** Full 5-screen wizard built (`app/transfers/{index,bank-picker,amount,review,success}.tsx`): Account Entry (auto name-enquiry) → Bank Picker → Amount & Remark (quote) → Review with the shared `TransactionPinSheet` bottom-sheet (PLAN.md Part 1 decision, now actually built) → Success screen polling `GET /v1/transfers/{id}` and treating `PENDING`/`AMBIGUOUS`/`MANUAL_REVIEW` as durable non-terminal states, never resubmitting. **RESOLVED this session**: `source_account_id` now comes from the real `GET /v1/wallet/source-account` endpoint (`useWalletSourceAccount` query hook) instead of `EXPO_PUBLIC_DEV_SOURCE_ACCOUNT_ID` (`src/features/accounts/devSourceAccount.ts` deleted). MOB-06 no longer blocks this — a real transaction PIN can now be created. Still marked partial — see "Transfer contract gaps" below (`POST /v1/transfers`/`GET /v1/wallet/funding-details` remain absent from the payment service's own OpenAPI contract, and there's still no lookup-by-idempotency-key for a timed-out submission). Verified: `npx tsc --noEmit` clean, 5 suites/27 tests passing.

### Transfer contract gaps (discovered while implementing MOB-08, confirmed against `parc-contracts/openapi/payment/v1/openapi.yaml` directly)

- **`GET /v1/wallet/funding-details` doesn't exist in the payment service's own contract at all** — not thin, not description-only, genuinely absent (checked the whole file). The Mobile BFF relays it there 1:1 anyway (`app.ts:138-141`), so it may still work at runtime against real payment code that outpaces its own contract (the pattern seen everywhere else this session), but it's unverified. Not yet built (Add Money screen deferred).
- **`POST /v1/transfers` — the literal path the Mobile BFF calls — does not exist in the payment contract either.** Only `/v1/transfers/bank` and `/v1/transfers/internal` are documented. `api.submitTransfer` calls the BFF's actual coded path (`/v1/transfers`, confirmed present in `parc-mobile-bff/src/app.ts`) on the working assumption that the payment service's real implementation has it even though its own OpenAPI file doesn't — but this is unverified against a live backend.
- **Even the closest analog schema (`/v1/transfers/bank`'s `TransferInput` + bank fields) is internally inconsistent**: it declares `additionalProperties: false` but has no field for `enquiry_token`, `quote_id`, or an authorization token — fields the documented multi-step flow (name-enquiry → quote → PIN-authorize → submit) would need to chain together. `submitTransfer` sends all three anyway (best-effort field names) since the alternative is a flow that can never complete; if the server actually enforces `additionalProperties: false` strictly, these will be rejected.
- **Transfer quotes never return a `quote_id`** (unlike the analogous bill quote, which does) — `quoteTransfer` probes for one but its presence is unconfirmed.
- **No way to look up an in-flight transfer after a submission timeout.** If `POST /v1/transfers` itself times out (as opposed to succeeding and returning an id), there is no documented "look up by idempotency key" endpoint — `review.tsx` discloses this directly to the customer rather than silently retrying (which risks a duplicate transfer) or claiming success it can't confirm.
- **What is buildable and solid**: `POST /v1/transaction-authorizations` (fully typed, real request-hash + PIN/biometric proof, returns `authorization_token`) and `GET /v1/transfers/{id}` (fully typed, and its status enum — `CREATED/RESERVED/SUBMITTED/PENDING/AMBIGUOUS/SUCCEEDED/FAILED/REVERSED/MANUAL_REVIEW` — is exactly the durable-pending model this app needs and is built around).
- [x] **MOB-09 — Bills: Airtime + Data.** Full wizard built as one generic dynamic-route flow (`app/bills/[category]/{index,amount,review,success}.tsx`, reused for both categories via the `category` param): product picker + phone entry with auto customer-validation → amount entry (only for `VARIABLE` denomination products) → review with `TransactionPinSheet` → success screen polling `GET /v1/bills/{id}` and treating `PENDING`/`PROCESSING` as durable non-terminal states. **Bills is fully typed end to end** against `parc-contracts/openapi/payment/v1/openapi.yaml` (`BillProduct`/`BillValidation`/`BillQuote`/`BillPaymentState`/`BillPayment`/`BillReceipt` all fully documented, zero probing needed). **RESOLVED this session**: `source_account_id` now comes from `GET /v1/wallet/source-account` (same `useWalletSourceAccount` hook as Transfers) — no more shared gap. Verified: `npx tsc --noEmit` clean, 5 suites/27 tests passing.

### Fundamental gap discovered while implementing MOB-09, retroactively affecting MOB-08 too: no way to discover the customer's own account id

`BillPaymentCommand.source_account_id` and `TransferInput.source_account_id` were both **required** fields with no endpoint anywhere in the payment contract that returned the customer's own ledger/wallet account UUID to the client. **RESOLVED this session**: `GET /v1/wallet/source-account` now exists and returns exactly this (`WalletSummary { source_account_id, available_balance }`, confirmed against `parc-mobile-bff/src/composition.ts`'s own TS source). `EXPO_PUBLIC_DEV_SOURCE_ACCOUNT_ID`/`src/features/accounts/devSourceAccount.ts` deleted — Transfers and Bills both now use the real `useWalletSourceAccount` query hook.
- [x] **MOB-10 — Bills: Electricity + TV Subscription.** Both reuse the exact same generic `app/bills/[category]/*` flow built for MOB-09 unchanged — since Bills' contract is category-agnostic and fully typed, `category=electricity`/`category=cable_tv` just work through the same product-picker → validate → quote → review → success screens (Home now links "Pay electricity" and "TV Subscription" to them). Meter-type/prepaid-vs-postpaid is assumed to be modeled as separate catalog products, not a client-side toggle — nothing in the contract exposes a `meter_type` field to send separately. The one real addition: `success.tsx` now fetches `GET /v1/bills/{id}/receipt` once a payment is `SUCCESSFUL` and shows the new `TokenReveal` component (large numeral, tap-to-copy via `expo-clipboard`) when `BillReceipt.token` is present — this is a confirmed real schema field now, not the probed placeholder Part 2 originally anticipated. Electricity's dedicated "My Electricity Beneficiaries" screen (Part 3) is confirmed out of scope for now: `payment`'s own contract has a real `/v1/beneficiaries` endpoint, but it is not in the Mobile BFF's allowlist at all (same "Missing — no BFF route" category as several other gaps). Error/empty/loading states remain the same inline-text/spinner treatment used everywhere else in the app so far, not yet the dedicated Figma-matched `ErrorState`/`EmptyState`/`LoadingSpinner` components — that's an app-wide polish item, not specific to these two categories. Verified: `npx tsc --noEmit` clean, 5 suites/27 tests passing.
- [x] **MOB-00A — Axios transport + app-wide error handling (cross-cutting, inserted before MOB-11 at your request).** `api/client.ts` rewritten onto a single Axios instance with request/response interceptors (correlation IDs, bearer/tenant injection, normalized `ApiError` output, a session-refresh scaffold ready for when the refresh route lands) — see Part 5 "HTTP transport (Axios)". All 30+ existing endpoint methods unchanged; only the transport internals moved. Added `components/ErrorBoundary/ErrorBoundary.tsx` (wraps the whole app, previously missing entirely), `observability/reportError.ts` (single console/Sentry reporting choke point), and global `QueryCache`/`MutationCache` error hooks in `api/queryClient.ts` — see Part 5 "Error and exception handling across the app". Added 2 new test files (`api/__tests__/errors.test.ts`, `utils/__tests__/money.test.ts`, the latter regression-guarding the float-arithmetic bug fixed during MOB-08). Verified: `npx tsc --noEmit` clean, 5 suites/27 tests passing (up from 3/16), `npx expo export --platform ios` bundles cleanly.
- [x] **MOB-11 — Loans.** Loans tab (`(tabs)/loans.tsx`, real data via `api.getLoanSummary`'s typed `eligible_products`/`loans`), one generic loan-application wizard (`app/loans/[loanType]/{index,review,success}.tsx`, reused across all 4 product types — amount/tenure/purpose + type-specific fields for Salary/Asset → quote → review → submit), and a repayment screen (`app/loans/repay/[loanId].tsx` — quote → confirm, no PIN sheet, since repayment's `source` is a category enum, not an authorized transfer). **RESOLVED this session — the most serious gap found in the whole engagement**: the backend fixed `underwriting_evidence` (including a client-asserted `fraud_flag`) by moving evidence computation entirely server-side. `POST /v1/loan-applications` now only asks the client for a normal, honest field — `declared_monthly_income_minor` — plus a `consent_reference` from the real reference-data endpoint; `src/features/loans/devUnderwritingEvidence.ts` deleted, no `__DEV__` gate remains, and loan application submission is fully real for every customer. The entire Lending response surface (quote/application/offer/loan/repayment) is now fully typed and zod-validated too — no more defensive probing. Verified: `npx tsc --noEmit` clean, 5 suites/27 tests passing, `npx expo export --platform ios` bundles cleanly.

### Lending — resolved (previously the most severe gap found this session)

`POST /v1/loan-applications`'s `underwriting_evidence` object (`kyc_status`, `existing_exposure_minor`, `fraud_flag`, etc.) has been removed from the client-facing request entirely — the backend now computes it server-side, confirmed against `parc-contracts/openapi/lending/v1/openapi.yaml`. This validates the decision made earlier this session never to let the client assert its own fraud/compliance facts. Every Lending response (`CustomerLoanProduct`, `CustomerLoanQuote`, `LoanApplicationSubmission`, `CustomerLoanApplication`, `CustomerLoanOffer`, `LoanOfferAcceptance`, `CustomerLoan`, `CustomerRepaymentQuote`, `CustomerRepaymentRequest`) is now fully typed and zod-validated in `api/schemas.ts`. Repayment remains architecturally clean — funding source is a `source` enum (`wallet`/`direct_debit`/`virtual_account`/`manual_bank_transfer`) chosen at quote time, not an account reference the client needs to discover.
- [-] **MOB-12 — Savings.** Savings tab (`(tabs)/savings.tsx`) against the fully-typed `GET /v1/savings/summary`; Create Target Savings Goal (`savings/goals/create.tsx`), goal partial-withdrawal + break (`savings/goals/[goalId]/index.tsx`), Fixed Deposit quote→create (`savings/fixed-deposits/create.tsx`), fixed-deposit detail + liquidate + maturity-instruction change (`savings/fixed-deposits/[fixedDepositId]/index.tsx`), and recurring auto-save plan creation (`savings/recurring/create.tsx`) all built against the newly-typed savings contract (`savingsSummarySchema`, `savingsGoalResultSchema`, `goalWithdrawalResultSchema`, `fixedDepositResultSchema`/`fixedDepositQuoteResultSchema`/`fixedDepositDetailSchema`/`fixedDepositSettlementResultSchema`/`fixedDepositInstructionResultSchema`, `recurringPlanResultSchema` — all confirmed field-for-field against `parc-contracts/openapi/savings/v1/openapi.yaml`). Marked partial for two confirmed, disclosed reasons, not stylistic ones — see below. Verified: `npx tsc --noEmit` clean, 5 suites/27 tests passing, `npx expo export --platform ios` bundles cleanly.

### Savings contract gaps (discovered while implementing MOB-12, confirmed against `parc-contracts/openapi/savings/v1/openapi.yaml` and `parc-mobile-bff/src/app.ts` directly)

- **No product-catalog discovery for Fixed Deposits.** `quoteFixedDeposit`/`createFixedDeposit` both require a `product_version_id`, but the savings-service contract only has `POST /v1/savings-products`/`POST /v1/savings-products/{id}/versions` (back-office *creation*) — there is no `GET` to list published products or versions anywhere, and unlike Loans (`GET /v1/loans/summary` returns `eligible_products`), Savings has no analogous bespoke composition endpoint either (confirmed: `parc-mobile-bff/src/composition.ts` has a `loanSummary` method but nothing equivalent for savings). `savings/fixed-deposits/create.tsx` is therefore a `__DEV__`-only screen with a manually-provided `EXPO_PUBLIC_DEV_FIXED_DEPOSIT_PRODUCT_VERSION_ID`, same pattern as the earlier consent/source-account dev stopgaps — outside development builds it shows a plain "not available yet" message rather than a broken form.
- **No account-opening or contribution route exposed to mobile.** The savings-service contract has real `POST /v1/savings-accounts` (open an Ordinary account) and `POST /v1/savings-accounts/{id}/contributions` (fund an account from the wallet) endpoints, but neither is in the Mobile BFF's route allowlist. This means Create Goal and Create Recurring Plan can only work for a customer who *already* has an ORDINARY savings account (discovered via `GET /v1/savings/summary`'s `accounts[]`, presumably auto-provisioned at onboarding, mirroring the wallet account) — both screens show an explicit "you don't have a savings account and this app can't open one yet" message rather than guessing at an unexposed endpoint. There is also no way to add money to an existing goal beyond what a recurring plan contributes automatically.
- **No list endpoint for goals, fixed deposits, or recurring plans.** A goal or recurring plan's id is returned exactly once, at creation time, with no `GET` to rediscover it later; fixed deposits are the sole exception (`GET /v1/fixed-deposits/{id}` exists, refetch-by-id only, still no list). `state/stores/savingsRecordsStore.ts` (Zustand + AsyncStorage) persists created ids on-device so the Savings tab has something to show — this is a real, disclosed limitation: a reinstall or new device loses this history, since the server has no source of truth to rebuild it from.
- **The goal withdrawal-quote endpoint (`POST /v1/savings/goals/{id}/withdrawal-quotes`) has no documented response schema** — `getGoalWithdrawalQuote` exists in `api/client.ts` but isn't used by any screen yet; the withdrawal screen goes straight to submitting the withdrawal and shows the real forfeited-interest figure from that response instead.
- [-] **MOB-13 — Profile/Security/Notifications/Referrals/Support.** `(tabs)/me.tsx` (fully real, `GET /v1/profile`) → `profile/{security,notifications,referral,support}.tsx`. Also discovered `GET /v1/referrals/summary` and `GET /v1/support/{faqs,tickets}`/`POST /v1/support/tickets` are real, in-allowlist BFF routes (previously assumed "missing" — they aren't, just undocumented). Marked partial for two disclosed reasons: (1) four of these five screens (`security`, `notifications`, `referral`, `support`) consume endpoints whose response shape is documented only as prose ("masked credentials, trusted devices, and active sessions", etc.) — every field name used to render them (`sessions`/`devices` arrays, `category`/`push_enabled` preference shape, `referral_code`/`earned_rewards_minor`, FAQ `question`/`answer`, ticket `subject`/`status`) is a best-effort probe, not a confirmed schema, and each screen shows an honest empty/unavailable state rather than guessing when a probe finds nothing; (2) push-token registration (`api.registerPushToken`, already built) is never called — it needs `expo-notifications`, a new native dependency not yet installed, which would require a rebuild to test, so it wasn't added without being asked. "Change Passcode while logged in" was also considered and deliberately deferred: the only passcode-replacement endpoint is the recovery flow (`(auth)/forgot-passcode`/`reset-passcode`), and those screens live inside the `(auth)` route group, which the root layout only mounts while *unauthenticated* — reusing them logged-in needs a routing change, not just a new screen. Verified: `npx tsc --noEmit` clean, 5 suites/27 tests passing, `npx expo export --platform ios` bundles cleanly.

## Immediate actions

1. [x] Create `parc-mobile/PLAN.md` (this file).
2. [x] Correct `typography.ts`/`primitives.ts`: `amountXl` uses `fontFamilies.sans`; removed the now-resolved Mono-contradiction comments; dropped `fontFamilies.mono`.
3. [x] Create `docs/theme/README.md`.
4. [x] Create `parc-mobile/.clauderules`.
5. [x] Create `parc-mobile/.claude/skills/figma-to-component/SKILL.md`.
6. [x] Add `@.clauderules` to `parc-mobile/CLAUDE.md`.
7. [x] THEME-02 marked `[x]` above.
8. [ ] Proceed to Part 8's initial sprint (MOB-00 onward), updating Progress Tracking as each item completes.

## Real blockers — re-verified this session

You reported that some previously-documented backend blockers had been cleared. Re-verification (2 parallel research passes plus direct reads of the updated OpenAPI contracts and `parc-mobile-bff` source) confirmed the following were fixed, and every affected screen has now been rewired to the real endpoint:

- ✅ **Transaction-PIN lifecycle** (`POST /v1/security/transaction-pin/{setup,confirm,rotate}`) — MOB-06, now built end to end.
- ✅ **Refresh token / Logout** (`POST /v1/auth/token/refresh`, `POST /v1/auth/logout`) — `attemptSessionRefresh()` and `useAuth().logout()` both wired to the real endpoints.
- ✅ **Forgot/Reset Passcode recovery** (`POST /v1/auth/passcode/recovery/{request,confirm}`) — new `(auth)/{forgot-passcode,reset-passcode}.tsx` screens, linked from the passcode-login screen.
- ✅ **Consent-document discovery** (`GET /v1/onboarding/reference-data`) — registration and NIN submission use real consent documents now.
- ✅ **Address/income reference data** (states/LGAs, occupations, income bands) — same endpoint; `address.tsx`/`income.tsx` now use real pickers instead of free text.
- ✅ **Customer's own wallet account id** (`GET /v1/wallet/source-account`) — Transfers and Bills both use it now; this was the single gap blocking every money-movement feature.
- ✅ **Lending `underwriting_evidence`/`fraud_flag`** — the most serious gap found this engagement. The backend moved evidence computation entirely server-side; the client now only declares its own monthly income. Loan applications are fully functional for every customer, not just `__DEV__` builds.
- ✅ **Savings withdrawal/liquidation/maturity/recurring routes** — all now exist and are built (MOB-12), though two *new*, narrower gaps were found in the same area — see "Savings contract gaps" above.
- ✅ **Full Security summary read + session/device revocation + notification preferences** — routes now exist (confirmed in `parc-mobile-bff/src/app.ts`) and UI is now built (MOB-13: `profile/{security,notifications}.tsx`). Push-token *registration* remains unwired — see below.

**Still genuinely blocked or gapped (not backend work already in flight — worth flagging specifically):**
- **Face verification** — `POST /v1/onboarding/face-verification` is now fully typed (`liveness_reference` instead of `photo_url`), but no VerifyMe SDK (or any liveness-capture SDK) is integrated in the app, so there's still no way to produce a real liveness reference. Remains a `__DEV__`-only bypass shell.
- **`POST /v1/transfers`** (the path the Mobile BFF actually calls) is still absent from the payment service's own OpenAPI contract — only `/v1/transfers/bank`/`/v1/transfers/internal` are documented there, and neither includes the token-chaining fields the real flow needs.
- **`GET /v1/wallet/funding-details`** is still absent from the payment contract (Add Money screen remains deferred).
- **Statements** (`POST/GET /v1/statements*`) still has no documented response schema — still defensively probed.
- **Savings product catalog** (new gap, MOB-12) — no way to discover a valid `product_version_id` for Fixed Deposits; `__DEV__`-only bypass with a manually-provided id.
- **Savings account-opening/contribution** (new gap, MOB-12) — `POST /v1/savings-accounts`/`.../contributions` exist in the savings-service contract but aren't in the Mobile BFF's route allowlist; Create Goal/Recurring Plan only work for a customer who already has an Ordinary savings account.
- **No list endpoint for savings goals, fixed deposits, or recurring plans** (new gap, MOB-12) — ids are only ever returned at creation time; tracked on-device only (`savingsRecordsStore.ts`), lost on reinstall.
- **`payment`'s `/v1/beneficiaries`** still isn't in the Mobile BFF's route allowlist.
- **`TransactionPage.items`** still has no counterparty/narration/reference field.
- **`GET /v1/transaction-authorizations` 401 is ambiguous** (new, found while building MOB-06) — the contract gives no way to distinguish "wrong PIN" from "no PIN set up yet," both return a generic 401; `TransactionPinSheet` discloses this via a "Set up transaction PIN" action rather than guessing which happened.
- **`GET /v1/security`, `GET /v1/notification-preferences`, `GET /v1/referrals/summary`, `GET /v1/support/faqs`, `GET/POST /v1/support/tickets`** (new gaps, MOB-13) — every one of these documents its response only as prose, not a schema. All five are now built and functional against a live backend (defensively probing plausible field names), but if the real field names differ from what's probed, the screens will render an honest empty state rather than break — worth a contract-documentation pass so this isn't guesswork.
- **Push-token registration is built but unwired** (MOB-13) — `api.registerPushToken` exists and is fully typed, but nothing calls it: obtaining a real device push token needs `expo-notifications` (or an equivalent), which isn't installed. Deferred rather than added silently, since it's a new native dependency requiring a rebuild.
- **No way to change a passcode while logged in** (MOB-13) — the only passcode-replacement endpoint is the recovery flow, and its screens (`(auth)/forgot-passcode`/`reset-passcode`) live in the `(auth)` route group, which the root layout only mounts while unauthenticated. Reusing them for a logged-in "Change Passcode" action needs a routing change (moving them out of `(auth)`, or adding an authenticated duplicate), not just a new screen — deferred rather than guessed at.
