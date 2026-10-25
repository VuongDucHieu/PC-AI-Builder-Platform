# AI PC Builder — Security Architecture Decision Records

**Document ID:** SEC-002-ADR  
**Version:** 1.0  
**Status:** Accepted for MVP Design Baseline  
**Related:** SEC-001 v1.1, SEC-002 v1.1, ARCH-004

## ADR-SEC-001 — Authentication Mechanism

**Decision:** Signed, short-lived JWT access tokens and opaque refresh tokens.

**Rationale:** Supports stateless JWT verification while retaining server-side refresh-session control.

**Consequences:** Requires secure token handling, refresh rotation, and server-side session validation.

## ADR-SEC-002 — Browser Token Storage

**Decision:** Store access JWTs in frontend memory and refresh tokens in Secure, HttpOnly cookies.

**Rationale:** Avoids persistent browser JavaScript storage of long-lived credentials.

**Consequences:** Page reload requires a controlled refresh flow. XSS remains a relevant risk because malicious same-origin scripts can act within an authenticated session.

**Deployment Assumption:** Frontend and API can use a compatible same-site cookie deployment.

## ADR-SEC-003 — Session Revocation

**Decision:** Use PostgreSQL as the authoritative session registry.

Protected requests validate JWT claims and active session state.

**Consequences:** Session checks add database reads. Protected operations fail closed if session status cannot be established.

**Deferred:** Redis caching and per-access-token blacklist.

## ADR-SEC-004 — Refresh Rotation

**Decision:** Rotate opaque refresh tokens atomically, using secure token hashes and a persisted rotation history sufficient for replay detection.

**Required Properties:**
- Single-use refresh credentials.
- Atomic token replacement.
- Reuse detection.
- Session-family revocation.
- Defined handling of concurrent refresh attempts.

**Consequences:** Refresh credentials require additional persistence and cleanup.

## ADR-SEC-005 — CSRF Protection

**Decision:** Apply session-bound CSRF tokens and Origin validation to cookie-authenticated state-changing operations.

**Required Properties:**
- Unpredictable CSRF token.
- Session binding.
- CSRF verification before state mutation.
- Restricted CORS.
- Secure cookie attributes.
- Explicit protection for login, refresh, logout and other cookie-backed state-changing flows.

**Consequences:** Frontend must manage a CSRF token separately from authentication credentials.

## ADR-SEC-006 — Audit Logging

**Decision:** Use Pino structured JSON for operational logging and PostgreSQL for durable security audit events.

**Schema:** Versioned project-specific JSON schema, aligned with OpenTelemetry conventions where appropriate.

**Required Properties:**
- Stable event names.
- Actor and resource references.
- Request correlation.
- Explicit outcome and reason code.
- Sensitive-data redaction.
- Transactional persistence for critical business audit events.

**Deferred:** Centralized log collector and full observability stack.

## ADR-SEC-007 — External AI Data Protection

**Decision:** Route all AI requests through a backend-controlled AI Provider Gateway.

**Required Properties:**
- Data classification.
- Field allowlisting.
- Data minimization.
- Sensitive-data detection.
- Provider-specific payload construction.
- Output validation.
- No secrets or payment data in prompts.
- No raw prompt logging by default.

**Consequences:** AI requests require explicit application-level context schemas.

## ADR-SEC-008 — AI Provider Independence

**Decision:** Use provider adapters instead of coupling application use cases to OpenAI, Anthropic or Gemini.

**Required Properties:**
- Provider policy review.
- Documented retention and data-use settings.
- Configurable provider credentials.
- Mock provider for tests.
- Consistent response validation.

**Consequences:** Adds a small abstraction layer but supports provider changes without rewriting application logic.

## Outstanding Decisions

The following details remain open and must be resolved before their affected feature is implemented:

1. Exact JWT signing algorithm and key management.
2. Cookie domain and production deployment topology.
3. CSRF bootstrap behavior before authentication.
4. Refresh-token rotation race and retry handling.
5. Session expiration and retention cleanup.
6. Audit retention period and access policy.
7. AI provider-specific data-processing terms.
8. User consent and privacy notice requirements where applicable.

## Acceptance Criteria

- Every authentication endpoint has defined session and CSRF behavior.
- Every protected API verifies authentication and authorization.
- Revoked sessions cannot access protected endpoints.
- Refresh-token reuse is detected and handled.
- Security audit events follow a documented schema.
- AI provider payloads are constructed from allowlisted data.
- Security requirements are traceable to automated tests.

**Status:** Architecture decisions accepted as MVP design baseline; implementation and verification remain pending.