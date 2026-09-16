# parc mobile repository instructions

## Mission

Build the React Native customer application against versioned contracts from `parc-contracts`.

## Rules

- Use TypeScript and the repository's existing package manager and React Native architecture.
- Keep generated API types/clients under `src/api/generated/`; do not hand-edit them. Put transport configuration, authentication refresh, retries and error normalization in `src/api/client.ts`.
- Organize product code by feature while keeping shared design-system components generic.
- Never embed backend secrets or privileged service credentials in the app. Store only appropriate device credentials using platform-secure storage.
- Treat server authorization, balances, limits, fees, loan decisions and ledger state as authoritative. Do not duplicate financial business rules in the client.
- Avoid logging tokens, NIN/BVN data, account details or sensitive customer information.
- Support loading, empty, offline, retry, validation, success and failure states; preserve accessibility and theme tokens.
- Add tests for state transitions, navigation guards, API mapping and critical customer flows. Verify Android and iOS when native configuration changes.
