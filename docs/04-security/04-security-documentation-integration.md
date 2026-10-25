# AI PC Builder — Security Documentation Integration Review

**Document ID:** SEC-INT-001  
**Version:** 1.0  
**Status:** Review completed — findings open  
**Review date:** 2026-10-25  
**Repository target:** `docs/04-security/04-security-documentation-integration-review.md`

## 1. Scope and evidence

This review directly inspected the four available Markdown technical-design files:

| ID | File | Version in inspected copy | Status |
|---|---|---|---|
| SEC-002.1 | `docs/04-security/designs/01-authentication-session-design.md` | 1.0.1 | Proposed |
| SEC-002.2 | `docs/04-security/designs/02-csrf-protection-design.md` | 1.0 | Proposed |
| SEC-002.3 | `docs/04-security/designs/03-ai-data-protection-design.md` | 1.0 | Proposed |
| SEC-002.4 | `docs/04-security/designs/04-audit-logging-design.md` | 1.0 | Proposed |

**Not inspected:** Actual repository contents, SEC-001 and SEC-002 source files, ADR file, ARCH-004, running application, database migrations, and executed tests. Previous chat drafts are not treated as committed repository evidence. Findings about these missing artifacts are **verification tasks**, not assertions that they are absent from GitHub.

## 2. Architecture baseline

| Topic | Baseline from available designs | Source of detail |
|---|---|---|
| Access authentication | Signed short-lived JWT in browser memory | SEC-002.1 |
| Refresh | Opaque refresh token in Secure HttpOnly cookie, atomic rotation | SEC-002.1 |
| Revocation | PostgreSQL session registry; check active session on protected requests | SEC-002.1 |
| CSRF | Pre-login bootstrap token and authenticated session-bound token; Origin checks | SEC-002.2 |
| AI privacy | Backend-only AI gateway, allowlisted context, no secrets/payment data | SEC-002.3 |
| Audit | Pino operational JSON, PostgreSQL durable versioned events | SEC-002.4 |

All controls remain **designs**, not verified implementations.

## 3. Findings and resolution plan

| ID | Priority | Finding | Required resolution | Owner document | Status |
|---|---|---|---|---|---|
| INT-001 | High | SEC-002.1 login flow summarizes Origin validation but does not show pre-login CSRF bootstrap or consumed bootstrap context | Add cross-reference to SEC-002.2 §5–6 and align login contract | SEC-002.1 | Open |
| INT-002 | High | Multiple designs extend the PostgreSQL schema independently; no consolidated migration contract | Create schema delta for ARCH-004: auth_sessions, refresh_token_records, csrf_bootstrap_contexts, security_audit_events; reconcile columns, FKs and indexes | ARCH-004 | Open |
| INT-003 | High | Refresh reuse and concurrent requests are recognized, but cross-tab/lost-response UX and exact handling remain unresolved | Record fail-closed policy, client single-flight, test cross-tab/retry cases; settle UX before implementation | SEC-002.1 / ARCH-005 | Open |
| INT-004 | High | CSRF bootstrap endpoint is documented in SEC-002.2 but not consistently in SEC-002.1 HTTP outline | Add GET /auth/csrf and define cookie/response behavior in API contract | ARCH-005 | Open |
| INT-005 | High | THR-015 and THR-016 are referenced by detailed designs, but SEC-001 source was not available to confirm their risk register entries | Confirm/add risk rationale, L×I scores, controls and test traceability | SEC-001 | Not verified |
| INT-006 | Medium | Audit design defines durable schema, but AUTH ERD has an indicative audit entity that may be mistaken for canonical migration | Declare SEC-002.4 authoritative for audit schema; align DB migration and JSON field mapping | SEC-002.1 / ARCH-004 | Open |
| INT-007 | High | AI provider privacy terms, retention and region are not verified for a selected provider | Complete provider-specific governance review before real user data is sent | SEC-002.3 | Open |
| INT-008 | Medium | Deployment topology for Next.js and NestJS remains assumed same-origin/same-site | Record actual origin, cookie path/domain, reverse proxy, CORS, CSRF origin policy before deployment | SEC-002.2 | Open |
| INT-009 | Medium | Audit retention, read access, deletion and operational failure policy require deployment decisions | Approve retention and access matrix before production | SEC-002.4 | Open |
| INT-010 | Medium | No executed Mermaid render/lint evidence was provided for this review | Run Mermaid CLI or GitHub preview validation for all diagrams; repair any syntax errors | All designs | Not verified |
| INT-011 | Medium | Documents remain Proposed; prior conversational agreement does not prove repository approval | Maintain explicit status and reviewer sign-off in project status | Project status | Open |
| INT-012 | Medium | ADR-SEC-* in SEC-002.1–002.3 and ADR-AUD-* in SEC-002.4 are distinct naming systems | Keep ADR-AUD-* as local audit decisions or map them explicitly to central ADR-SEC-006; avoid conflicting identifiers | ADR index | Open |

## 4. Document ownership rules

- **SEC-001:** Threat inventory, likelihood/impact rationale, inherent risk, mitigations and risk traceability.
- **SEC-002:** High-level security architecture and cross-cutting controls.
- **SEC-002 ADRs:** Accepted architectural decisions and their consequences.
- **SEC-002.1:** Authentication/session mechanics, rotation, revocation and session state.
- **SEC-002.2:** CSRF bootstrap, cookie policy, Origin/CORS rules and CSRF failure behavior.
- **SEC-002.3:** AI outbound data contract, prompt privacy and provider governance.
- **SEC-002.4:** Canonical audit event schema, durable persistence and audit policy.
- **ARCH-004:** Canonical database schema and migration design, referencing security designs.
- **ARCH-005:** Canonical HTTP endpoints, request/response schemas and security requirements.

**Conflict resolution:** A detailed design owns its security behavior; ARCH-004 owns the consolidated database contract; ARCH-005 owns the published API contract. If documents disagree, log the discrepancy and reconcile it before coding. Do not silently choose a version.

## 5. Required database integration delta

| Table | Key requirement | Design source |
|---|---|---|
| `auth_sessions` | Session ID, user ID, expiry, revocation, current refresh reference, CSRF hash | SEC-002.1 + SEC-002.2 |
| `refresh_token_records` | Hashed credentials, consumed/revoked state, token family/rotation links | SEC-002.1 |
| `csrf_bootstrap_contexts` | Short-lived pre-login context, token hash, consumed/expiry state | SEC-002.2 |
| `security_audit_events` | Canonical versioned event fields, actor/resource/outcome, sanitized metadata | SEC-002.4 |

Reconcile exact column types, constraints, FK nullability, retention and transactional semantics in ARCH-004. Do not migrate directly from illustrative ERDs.
