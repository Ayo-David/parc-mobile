# Missing Mobile UI/UX — Gap Analysis

A holistic review of every screen in Figma's Onboarding flow (`node-id=226-1407`, 22 screens) and Wallet/Dashboard flow (`node-id=326-968`, 61 top-level frames / ~45 distinct screens after de-duplication), cross-referenced against `parc-backend-development-plan.md`, `parc-interview-answers.md`, and `parc-platform/context/mobile-flow-map.md` to identify what a production-complete lending-and-savings app needs that **does not currently exist as a Figma design**. This is a design backlog, not an engineering backlog — everything here needs to be designed (in Figma) before it can be built.

**Method:** every screen in both flows was read directly from Figma (node metadata + text content, not assumed from names), then checked against three things: (1) internal consistency — does a menu item, "Manage" link, or card-tap target actually have a destination screen designed somewhere; (2) state coverage — does each flow have more than its happy path; (3) product completeness — does every backend capability confirmed in the planning docs have a corresponding screen.

---

## 0. The single biggest finding

**The entire Wallet/Dashboard flow (all 45+ screens — Transfers, Bills, Loans, Savings) has zero failure-state, zero error-state, and zero empty-state screens.** A text search across every string in all 61 frames for failure/error/decline/reject/insufficient/expired/timeout/invalid/"try again" returned **no matches at all**. Every terminal screen designed is a success screen: "Transfer Successful!", "Payment Successful!" (×2), "Loan Approved!", "Repayment Successful!", "Fixed Deposit Booked!", "Savings Goal Created!" — there is no "Transfer Failed," no "Insufficient Balance," no "Loan Application Declined," no empty "You have no transactions yet" for a brand-new account.

This is a hard blocker for production, not a nice-to-have. `mobile-flow-map.md` §6 explicitly states the completeness bar every feature must meet: *"loading, empty, offline, retry, validation, rate-limit, unauthorized, forbidden, conflict, dependency-unavailable, pending, success, and terminal-failure states."* Figma currently designs roughly 1 of those 13 states per flow (success).

By contrast, the **Onboarding flow does have some error coverage** (a dedicated `OTPError` screen: "That code was incorrect" / "Try Again", and a "Wrong email? Change it" affordance) — proving the design team knows how to do this, it just wasn't carried through to the money-movement flows where it matters most.

**Recommendation:** before designing any single new screen below, design the state matrix as a reusable pattern (this app already has `ErrorState`/`EmptyState`/`LoadingSpinner` components in the Design System page, nodes `20:3145`/`20:3224`/`20:3166` — they were designed once as generic components but never actually composed into any real screen). Every item in §2 onward that says "no failure/empty state" is asking for that same composition, not a new visual language each time.

---

## 1. Cross-cutting / system-level screens (needed everywhere, designed nowhere)

These aren't tied to one feature — every fintech app needs them, and this app's backend already has explicit support for several of them (`bootstrap.maintenance`, `bootstrap.minimum_supported_version`, customer `status: RESTRICTED/CLOSED`, session expiry) with **no corresponding screen in Figma at all**.

| Screen | Why it's needed | Evidence |
|---|---|---|
| **No internet connectivity** | Every screen needs a defined offline behavior; none is designed. | `mobile-flow-map.md` §6 lists "offline" as a required state for every feature. |
| **Force update required** | `GET /v1/bootstrap` returns `minimum_supported_version`; the app already gates on this in code (`ApiError.status === 426`), but no screen for it exists in Figma — the app currently renders a plain generic message with no design. | Confirmed backend field, zero Figma coverage. |
| **Maintenance mode** | `bootstrap.maintenance` boolean exists and is already checked in code, same gap as above. | Confirmed backend field, zero Figma coverage. |
| **Session expired / forced re-authentication** | Tokens expire; a customer mid-flow needs a clear "please log back in" moment, not a silent redirect. | No screen found. |
| **Generic network/server error retry screen** | Every API call can 5xx/timeout; `ErrorState` exists as a generic component (node `20:3224`) but has never been composed into an actual screen with real copy. | Component exists, zero real usage. |
| **Empty states per list** (Transaction History, Loans, Savings, Notifications, Referral History) | A brand-new customer has zero transactions/loans/savings/notifications on day one — every one of these lists is only ever shown pre-populated with demo data in Figma. | `EmptyState` component exists (node `20:3145`), never composed into a real screen. |
| **Account restricted / frozen** | `Customer.status` includes `RESTRICTED` and `CLOSED` (confirmed in the auth-customer schema this app's client already types) — a customer in this state needs an explanatory screen, not a broken dashboard. | Confirmed backend field, zero Figma coverage. |
| **KYC tier & limits / "verify to unlock more"** | Three real KYC tiers exist with meaningful daily/balance limits (Tier 1: ₦50k/day, ₦300k balance; Tier 2: ₦200k/day, ₦500k balance; Tier 3: ₦5M/day, no ceiling — `parc-interview-answers.md` §12). The customer currently has no way to see their tier, their limits, or why a transaction was blocked for exceeding one, and no upgrade path screen. | Confirmed backend concept, zero Figma coverage anywhere in either flow. |
| **Rate-limited / "too many attempts" screen** | `POST /v1/transaction-authorizations` and login both have documented `429` responses. | Confirmed backend behavior, zero Figma coverage. |
| **Push notification permission priming** | Standard pattern before the OS permission prompt (explains *why* before asking) — relevant since notification preferences exist as a concept. | No screen found. |
| **Logout confirmation** | Minor, but a destructive-ish action with no confirmation step designed anywhere. | No screen found. |
| **Delete / close account** | `Customer.status: CLOSED` exists; NDPR-style "right to erasure" requests are a realistic requirement for a Nigerian-regulated MFB app. | Backend models the end state; no request/confirmation flow designed. |
| **Dispute a transaction** | The Payment service explicitly owns "disputes, reversals" as first-class concepts (`parc-backend-development-plan.md` line 149) — there is no "something wrong with this transaction?" entry point anywhere in Transaction History or a receipt screen. | Confirmed backend domain concept, zero Figma coverage. |

---

## 2. Onboarding flow — gaps

Onboarding is the most complete flow in Figma (22 screens, real error handling on OTP) — but it has one severe, specific gap that's easy to miss because a screen with that name does technically exist.

### 2.1 Liveness / face-verification capture — designed as a single static card, not an actual capture flow

`FaceVerification` (node `226:1878`) is 55 lines of Figma structure — among the shallowest screens in the entire onboarding flow — and its entire content is three strings: **"Look at the camera," "Centre your face in the oval to begin," and a "Start Face Scan" button.** That's it. There is no second frame for what happens after that button is tapped anywhere in the flow (the next named screen, `AddressVerification`, follows immediately with only generic layout containers in between).

For comparison, this is the step where the backend actually does the real compliance work — `FaceVerified`'s own copy confirms it: *"Your face matches your NIN record."* This is a live biometric liveness check against a government ID photo, the single highest-stakes, most fraud-sensitive, and most interaction-rich moment in the entire onboarding flow — and it has less design depth than the "Enter your NIN" text-input screen next to it. Specifically missing:

- **Live camera-capture UI** — a real camera preview with a face-tracking oval guide (the current screen shows an oval as a static illustration, not a live camera view), positioning feedback ("move closer," "center your face"), and lighting-quality feedback.
- **Liveness challenge prompts** — standard anti-spoofing steps (blink, turn your head, smile, hold still) with per-step progress, since a single static photo can't prove liveness at all — "liveness" is the entire point of this screen and no challenge sequence is designed.
- **Scanning-in-progress state** — a progress indicator while the capture/liveness check runs.
- **Capture review / retake state** — a moment to confirm the captured image looks right before submitting, with a retake option.
- **Failure states** — face not detected, poor lighting, liveness check failed, possible spoof detected — none exist; only the eventual success screen does.
- **Camera permission-denied state** — the OS-level "camera access needed" moment has no in-app design for what happens if the customer denies it.
- **Manual-review-pending state** — the backend's `KycVerification.status` enum explicitly includes `MANUAL_REVIEW` (in addition to `FAILED`), meaning a real customer can end up neither immediately verified nor rejected — nothing designs that "we're still checking, we'll notify you" moment.
- **"Why we need this" / biometric-consent explanation** — collecting biometric data typically needs its own explicit, informed-consent moment (distinct from the general "I agree to Terms" checkbox at registration) — nothing here explains what's collected, why, or how long it's retained before asking the customer to start their camera.

This gap is the design-side twin of a real engineering gap already known: no liveness-capture SDK (e.g. VerifyMe) is integrated in the app, so `face.tsx` is currently a `__DEV__`-only bypass shell. But even once an SDK is integrated, there is currently **no design for what it should look like on screen** — the SDK provides the capture capability, not the UX around it, and right now that UX doesn't exist beyond a single "start" button.

### 2.2 Other onboarding gaps

| Gap | Detail |
|---|---|
| **OTP resend flow** | An `OTPResend` screen exists as a frame but has no meaningful content beyond a label — no actual "resend via SMS/call/WhatsApp" channel-selection UI, countdown timer, or rate-limit messaging is designed. |
| **Terms of Service / Privacy Policy full-text view** | Registration has a "I agree to the Terms of Service and Privacy Policy" checkbox with implied links, but no screen exists to actually read them in-app. |
| **PEP risk disclosure — thin, not absent** | The PEP screen does have a one-line explanation ("A PEP holds or has held a prominent public function…") and cites "Required by CBN AML/CFT regulations," so this isn't a full gap — but there's no detail on what happens next if the answer is "yes" (enhanced due diligence, possibly a different onboarding path or manual review), which has real consequences for that customer. |
| **Biometric (device) enrollment failure state** | The separate `Biometric` screen (node `226:2690` — device Face ID/fingerprint for app-unlock convenience, not the identity-liveness check above) has no "your device doesn't support this" or "enrollment failed" state — only the happy path. |
| **Account-already-exists / duplicate registration** | No screen for "this phone number/NIN is already registered — did you mean to log in?" |
| **KYC verification failure / manual review pending (NIN)** | Same pattern as §2.1 but for the NIN-verification step itself — only the eventual success screen (`FaceVerified`, which covers both NIN and face) exists; no failure or manual-review state for NIN specifically. |

---

## 3. Home / Dashboard — gaps

| Gap | Detail |
|---|---|
| **Empty dashboard (new customer)** | The one Home screen design is fully populated (₦1.25M balance, 4 recent transactions, an active loan card). A customer who just finished onboarding sees a wallet with ₦0 and no history — no version of this screen shows that state. |
| **Degraded-section states** | `mobile-flow-map.md` explicitly calls out that "Lending/Savings sections degrade explicitly" on the dashboard when those domains are unavailable — no Figma screen shows what a degraded/partial dashboard looks like (e.g., wallet loads but the loan-summary card fails). |
| **"See All" transaction list ↔ real data mismatch** | Home and Transaction History both show transactions with a counterparty name, category badge (Income/Savings/Transfer/Bills), and merchant text ("Salary — Accenture Nigeria," "EKEDC Electricity") — but the confirmed backend `TransactionPage.items` schema only has `id/status/amount/occurred_at`, no counterparty or category field at all. This isn't a missing screen, it's an **impossible screen as designed** — either the backend needs a transaction-detail field it doesn't have, or this needs to be redesigned around what the API can actually return. Flagging because it affects the single highest-traffic screen in the app. |

---

## 4. Transfers — gaps

| Gap | Detail |
|---|---|
| **Manage Beneficiaries screen** | Both the Payments hub ("Saved Beneficiaries … Manage") and the transfer recipient screen ("Recent"/"Favourites") reference beneficiary management, but no add/edit/delete/rename screen exists anywhere in either flow. This is a real, referenced-but-undesigned screen, not a guess. |
| **Transfer failure state** | Covered in §0 — no "Transfer Failed" screen exists, despite the backend's transfer status enum explicitly including `FAILED`. |
| **Transfer pending/ambiguous state** | The backend's transfer status model (`PENDING`/`AMBIGUOUS`/`MANUAL_REVIEW`) is a deliberate, load-bearing part of this app's architecture (transfers can't be blindly retried) — Figma only designs the instant-success case, never "we're checking on this, please wait." |
| **Insufficient balance state** | No screen for attempting a transfer larger than the available balance. |
| **Beneficiary name-mismatch / verification-failed state** | Name enquiry (confirming the account holder's name before sending) is a real backend step — no screen shows what happens when the entered account number doesn't resolve to a valid account. |
| **International/domiciliary transfers** | Not found in Figma at all — flagging only in case it's in scope; if it's intentionally out of scope for v1, no action needed, but worth an explicit product confirmation since nothing here rules it out. |

---

## 5. Bills (Airtime, Data, Electricity, Cable TV, Internet) — gaps

| Gap | Detail |
|---|---|
| **Electricity token-reveal / receipt screen** | The Electricity flow has landing, provider-select, and meter/amount-entry screens, but no confirmed success/receipt screen showing the prepaid token — the backend's `BillReceipt.token` field exists specifically for this. |
| **Cable TV success/receipt screen** | Same gap — provider search, plan selection ("DStv Compact ₦18,800," "DStv Premium ₦37,000"), and checkout exist, but no confirmed success screen. |
| **Airtime/Data failure state** | No "top-up failed" screen for either flow (covered generally in §0, called out specifically here since these are the highest-frequency transactions in the app). |
| **Meter/smartcard verification failure** | No "we couldn't verify this meter/smartcard number" state — both flows imply an auto-verification step (matching the confirmed `BillValidation` backend concept) but never show it failing. |
| **"Internet" bill — entirely undesigned** | "Internet" appears as a menu item in the Payments hub's Bills & Services grid, but unlike Electricity/Cable TV, **no provider-select, no plan-select, no checkout screen exists for it anywhere.** Either design it properly or remove the menu entry — right now it's a dead link in the source design itself. |
| **"My Electricity Beneficiaries" screen** | Referenced conceptually in earlier planning as a saved-meters/quick-recharge screen for Electricity (mirroring the Data/Airtime "recent number" pattern) — never actually designed. |

---

## 6. Loans — gaps

| Gap | Detail |
|---|---|
| **Loan declined / rejected state** | The single most significant gap in Lending. Figma only ever shows `Loan Approved!` — there is no screen for a declined application, even though real-world underwriting rejects a meaningful fraction of applicants and the backend's own underwriting-evidence model exists specifically to support both outcomes. |
| **Application under review / pending decision state** | Between "Apply Now" and "Loan Approved!" there's no screen acknowledging that underwriting takes time — real fintech loan decisions are not always instant, and nothing here designs the wait. |
| **Loan detail / full amortization schedule** | The Home and Loans-tab cards show a single active loan summarized to 4-5 numbers (outstanding, monthly due, next date, payments made). There's no dedicated "view this loan" screen with the full repayment schedule, per-installment breakdown, or interest/principal split. |
| **Multiple active loans** | Every screen assumes exactly one active loan. A customer with two or more loans (plausible — 4 product types exist) has no designed way to see or select between them. |
| **Overdue / delinquent loan state** | The backend tracks days-past-due, delinquency buckets, and structured penalties in real depth (`parc-backend-development-plan.md` LN-07) — nothing in Figma shows a customer what an overdue loan looks like, what penalty they've accrued, or what to do about it. |
| **Loan restructuring / write-off notice** | Both are real backend-supported outcomes (admin-initiated, not customer-self-service) — but the customer still needs to *see* when their loan terms have changed or been resolved this way, and no screen communicates it. |
| **Repayment failure state** | No "repayment failed" screen (insufficient balance, failed debit, etc.) — only `Repayment Successful!` exists. |
| **Loan document / agreement view** | No e-signature, terms-acceptance, or loan-agreement document screen — a regulated lender typically needs the customer to explicitly accept contract terms before disbursement, and nothing in this flow shows that moment. |

---

## 7. Savings — gaps (the largest gap area in the whole app)

The Savings tab itself is well-designed (goal progress cards, FD cards with rate/interest/maturity, "New" entry points for both). But **every single detail/management screen a customer would reach by tapping into an existing goal or fixed deposit is completely undesigned** — confirmed by actually building this feature this session with zero Figma reference to work from:

| Gap | Detail |
|---|---|
| **Goal detail screen** | Tapping an existing Target Savings goal (e.g., "Emergency Fund, 56% of goal") has no destination screen — no progress detail, no contribution history. |
| **Goal partial withdrawal screen** | The backend supports `POST /v1/savings/goals/{id}/partial-withdrawal`; no screen designed. |
| **Goal break/cancel screen** | The backend supports breaking a goal (returning principal, forfeiting interest); no screen designed — this needs care since forfeited interest should be disclosed *before* the customer confirms, not just reported after. |
| **Fixed Deposit detail screen** | Tapping an existing FD card has no destination screen. |
| **Fixed Deposit early liquidation screen** | The backend explicitly applies a "versioned early-liquidation penalty" (`parc-backend-development-plan.md` line 529) — this is exactly the kind of consequential, irreversible action that needs a clear "you will forfeit ₦X in interest" confirmation screen, and none exists. |
| **Fixed Deposit maturity instruction screen** | The FD creation screen shows a payout-type choice (Upfront/Monthly/At Maturity) at creation time, but there's no screen for *changing* that instruction on an existing FD as it approaches maturity (the backend has a dedicated endpoint for exactly this). |
| **Recurring/auto-save plan creation** | Every goal card shows "Auto-save ₦50k/mo" as if this is a distinct, configurable plan — but there's no screen for setting one up, only the implication that it exists via the goal-creation flow's monthly-contribution field. Whether recurring plans are the same thing as a goal's auto-debit, or a separate concept (as the backend's `recurring-plans` endpoint suggests), needs a product decision and then a real design. |
| **Savings withdrawal-quote / pre-confirmation screen** | Before either a goal withdrawal or FD liquidation completes, the customer should see the real consequence (fees, forfeited interest) computed by the backend and confirm it — no such intermediate screen exists for either. |
| **Interest-payout notification/history** | Interest credits appear as generic transaction-history rows ("Fixed Deposit Interest, +₦12,500.00") but there's no dedicated view of a goal or FD's own interest-accrual history. |

---

## 8. Profile, Security, Notifications, Referrals, Support — gaps

| Gap | Detail |
|---|---|
| **Session/device list screens** | The Security & Privacy screen has menu items "Login Activity" and "Linked Devices" — but neither destination screen (an actual list of active sessions/devices with per-item revoke) exists anywhere in either Figma flow. These are real, referenced, undesigned screens, not speculative additions. |
| **Change Login Passcode — logged-in flow** | Security & Privacy has a "Change Login Passcode" menu item, but the only passcode-change screens that exist anywhere (`ForgotPasscode` + the reset flow) are part of the logged-out recovery sequence in Onboarding. Whether "Change Passcode" while logged in is meant to reuse that flow or needs its own (skip current-passcode-entry, since the customer is already authenticated) is an open design question — currently unaddressed either way. |
| **Change/rotate Transaction PIN — settings-initiated flow** | Similarly, "Change Transaction PIN" is a menu item in Security & Privacy, but the only PIN screens designed (`Create Transaction PIN` / `Confirm Transaction PIN`, nodes `325:868`/`325:916`) are framed as first-time setup, not an explicit "rotate my existing PIN" flow (current-PIN entry + new-PIN entry) — the backend has a dedicated rotate endpoint for exactly this distinction. |
| **Two-Factor Auth setup flow** | Security & Privacy has a "Two-Factor Auth — Extra SMS verification on login" toggle, but no screen exists for actually setting it up (phone confirmation, backup codes, etc.) — just the settings-row toggle. |
| **Notification preferences screen** | The one "Notifications" screen in Figma is an activity feed (read notifications), not settings — there is no per-category push/SMS/email/in-app preference screen anywhere, even though this is a real, named backend capability. |
| **Referral history detail / empty state** | Refer & Earn does show a referral history list with per-referral status (Completed/Pending) — good — but there's no empty state ("share your first code") and no detail view for a single referral. |
| **Support / FAQ / Help screens — entirely undesigned** | This is a complete gap: "Support" is a confirmed, named backend capability (FAQ catalogue + ticket list/create, both "Ready at BFF boundary" per `mobile-flow-map.md`) with **zero corresponding screens anywhere in either Figma flow.** No FAQ list, no ticket list, no "contact us" / new-ticket form, not even a menu entry pointing to one. |
| **Edit Profile — phone number change** | Minor, not a gap exactly: Edit Profile explicitly says "Contact support to update phone number" (intentionally not self-service) — worth noting so it's not mistaken for an oversight when designing the Support flow above, since that's presumably where this request would actually go. |

---

## 9. Add Money / Statements — minor gaps

| Gap | Detail |
|---|---|
| **Add Money failure/pending states** | Three funding methods are designed (Bank Transfer, Card Payment, USSD) but only the informational "here's how to fund your account" screen exists — no confirmation-received, pending, or failed-funding state for any of the three. |
| **Statement generation failure/pending state** | Download Statement has a clean period/format picker, but no "generating…" or "couldn't generate your statement" state — statements can plausibly take time to generate server-side (this app's backend already models statements as an async job). |

---

## 10. Appendix — related but distinct: designs that exist but can't be fully built yet

Not "missing designs" (these screens exist in Figma), but worth flagging since they bear directly on "production complete end-to-end" and would otherwise look like implementation bugs rather than the design/backend mismatches they actually are:

- **Credit score display** — the Loans tab prominently shows "742 · Credit Score · Excellent" and a "Loan limit: ₦2,000,000.00" figure. No credit-scoring endpoint exists anywhere in the confirmed Lending contract. Either this needs a backend capability that doesn't exist yet, or it needs a product decision to remove/replace it.
- **Repayment Frequency selector** (Daily/Weekly/Monthly) — shown on every loan application form (Instant/Personal/Asset/Salary) but `POST /v1/loan-applications`'s confirmed schema has no frequency field, only a tenure/day count.
- **Asset Finance fields** (Asset Type dropdown with 7 real options, Asset Value) — shown on the Asset Funding form but absent from the confirmed Lending request schema entirely.
- **Fixed Deposit "Interest Payout" selector** (Upfront/Monthly/At Maturity) — shown at FD creation but absent from the confirmed Savings request schema.
- **Card Payment / USSD funding rails** on Add Money — no corresponding backend routes confirmed for either (only bank-transfer-based virtual-account funding is confirmed end-to-end).
- **"Free transfers for the day: 3"** — a daily free-transfer allowance shown on the transfer recipient screen with no confirmed backend concept of a free-transfer counter/tier.

---

## 11. Suggested design priority

Roughly in order of how much production risk each closes:

1. **Liveness/face-verification capture UX (§2.1)** — ranked first, not last, despite being one item: this is a regulatory KYC gate every single customer must pass to open an account at all, it's the most fraud-sensitive moment in the app, and it currently has less design depth than a plain text-input screen. Nothing else in this document blocks 100% of customers; this does.
2. **The state matrix (§0/§1)** — error/empty/failure states for Transfers, Bills, and Loans. This blocks every money-movement feature from being honest with real customers, not just a subset.
3. **Savings detail/management screens (§7)** — currently the single largest hole; every advanced Savings action was built this session with zero design reference.
4. **Loan declined/pending/overdue states (§6)** — a lending product that only ever shows approval isn't production-real.
5. **Support/FAQ screens (§8)** — a confirmed, ready backend capability with literally no design at all.
6. **Beneficiary management + session/device management (§4, §8)** — referenced from existing screens via menu items/links that currently go nowhere.
7. **System-level screens (§1)** — lower per-incident frequency but needed before any real launch (maintenance, force-update, offline, KYC-tier/limits).
8. Everything else in this document, roughly in the order listed.
