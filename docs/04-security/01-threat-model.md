# AI PC Builder — Threat Model & Risk Assessment

**Document ID:** SEC-001  
**Version:** 1.1  
**Status:** Revised Draft — Awaiting Review  
**Methodology:** STRIDE + Likelihood × Impact Risk Scoring  
**Architecture:** Next.js + NestJS Modular Monolith + PostgreSQL  
**Related Documents:** BA-002, BA-005, ARCH-001, ARCH-002, ARCH-003, ARCH-004

---

## 1. Purpose

Identify, evaluate, prioritize, and plan verification of security threats affecting AI PC Builder.

This document provides:

- System assets and trust boundaries.
- Attack surface inventory.
- Threat scenarios.
- Reproducible risk scoring criteria.
- Security requirements and proposed mitigations.
- Tool-specific verification plans.
- Risk ownership and acceptance criteria.

**Important:** Threats described here are potential risks, not confirmed vulnerabilities. No security tests have been executed.

## 2. Scope and Assumptions

### In Scope

- Next.js frontend
- NestJS REST API
- Authentication and authorization
- PostgreSQL persistence
- Catalog and PC Builder
- Cart, Checkout, Orders and Inventory
- Sandbox payment integration
- AI Advisor
- External seller data ingestion
- Administrative endpoints
- Application secrets and logging

### Assumptions

- The application is initially a modular monolith.
- PostgreSQL is the primary transactional database.
- Authentication uses an approach not yet finalized; JWT-related risks are assessed conditionally.
- Checkout prices are authoritative on the backend.
- External seller offers are informational only.
- Payment providers operate in sandbox mode during development.
- AI recommendations cannot override deterministic compatibility rules.
- The project is developed by one developer with AI coding assistance.

## 3. Security Assets

| ID | Asset | Required Property |
|---|---|---|
| AST-001 | Credentials and authentication sessions | Confidentiality, integrity |
| AST-002 | Customer information | Confidentiality |
| AST-003 | Product prices | Integrity |
| AST-004 | Inventory and reservations | Integrity, availability |
| AST-005 | Orders | Integrity, confidentiality |
| AST-006 | Payment attempts and events | Authenticity, integrity |
| AST-007 | AI provider credentials | Confidentiality |
| AST-008 | Product specifications | Integrity |
| AST-009 | External seller data | Integrity, provenance |
| AST-010 | Security and audit logs | Integrity, availability |

## 4. Trust Boundaries

| ID | Source | Destination | Security Concern |
|---|---|---|---|
| TB-001 | Browser | NestJS API | Untrusted requests, identity and authorization |
| TB-002 | Application | PostgreSQL | Data integrity, injection, transactions |
| TB-003 | Backend | AI Provider | Credentials, untrusted model output |
| TB-004 | Payment Provider | Webhook API | Callback authenticity and replay |
| TB-005 | Seller Sources | Data Ingestion | Untrusted URLs and product data |
| TB-006 | Customer | Administrative APIs | Privilege escalation |

## 5. Attack Surface Inventory

| ID | Entry Point | Primary Risks |
|---|---|---|
| AS-001 | Authentication endpoints | Broken authentication, credential attacks |
| AS-002 | JWT/session handling | Token forgery, incorrect validation |
| AS-003 | Product management APIs | Mass assignment, authorization bypass |
| AS-004 | Saved configurations | BOLA/IDOR |
| AS-005 | Cart and Checkout | Price tampering, duplicate checkout |
| AS-006 | Inventory reservations | Race conditions, overselling |
| AS-007 | Payment webhook | Forgery, replay, event ordering |
| AS-008 | AI Advisor | Prompt injection, cost abuse |
| AS-009 | Data Ingestion | SSRF, malicious external content |
| AS-010 | Admin endpoints | Privilege escalation |
| AS-011 | Source code and deployment | Secret exposure |
| AS-012 | Logging and monitoring | Missing audit evidence |

---

## 6. Risk Scoring Methodology

### 6.1 Formula

**Risk Score = Likelihood × Impact**

Each dimension is scored from 1 to 5.

The resulting score ranges from 1 to 25.

### 6.2 Likelihood Scale

Likelihood represents the estimated plausibility of successful exploitation under the stated architecture and exposure assumptions.

| Score | Rating | Criteria |
|---|---|---|
| 1 | Rare | Requires exceptional conditions or access |
| 2 | Unlikely | Requires multiple difficult prerequisites |
| 3 | Possible | Plausible with moderate prerequisites |
| 4 | Likely | Accessible attack surface with relatively common exploitation conditions |
| 5 | Very Likely | Highly exposed and readily exploitable if the relevant control is absent |

### 6.3 Impact Scale

Impact represents the reasonably foreseeable consequence of successful exploitation.

| Score | Rating | Criteria |
|---|---|---|
| 1 | Negligible | Minimal disruption or insignificant data effect |
| 2 | Minor | Limited disruption, recoverable without major effort |
| 3 | Moderate | Meaningful service disruption or limited unauthorized data modification |
| 4 | Major | Significant data exposure, financial inconsistency or operational disruption |
| 5 | Severe | Critical integrity compromise, widespread sensitive-data exposure or systemic business failure |

### 6.4 Risk Classification

| Score | Severity | Expected Response |
|---|---|---|
| 1–4 | Low | Track and address during routine development |
| 5–9 | Medium | Plan mitigation and verification |
| 10–16 | High | Prioritize before affected feature release |
| 17–25 | Critical | Require explicit mitigation and security review before affected feature release |

### 6.5 Risk Types

**Inherent Risk:** Estimated risk before proposed security controls are implemented.

**Residual Risk:** Estimated risk after controls have been implemented and their effectiveness has been verified.

Residual risk must not be treated as confirmed merely because mitigation is documented.

### 6.6 Scoring Limitations

The scoring model is ordinal and qualitative.

Scores are useful for consistent prioritization, not for calculating real-world attack probabilities.

Scores must be reviewed when:

- The architecture changes.
- An endpoint becomes publicly accessible.
- New authentication or provider integrations are introduced.
- Security controls are implemented.
- Testing reveals a confirmed vulnerability.

---

## 7. Threat Register and Inherent Risk Assessment

All scores below are preliminary planning estimates.

| Threat ID | Threat | STRIDE | L | I | Risk | Severity |
|---|---|---|---:|---:|---:|---|
| THR-001 | Broken Object-Level Authorization (BOLA/IDOR) | I, E | 4 | 4 | 16 | High |
| THR-002 | Checkout Price Tampering | T | 4 | 5 | 20 | Critical |
| THR-003 | Inventory Race Condition / Overselling | T, D | 4 | 5 | 20 | Critical |
| THR-004 | Forged Payment Webhook | S, T | 3 | 5 | 15 | High |
| THR-005 | Duplicate or Out-of-Order Payment Events | T, R | 4 | 5 | 20 | Critical |
| THR-006 | Administrative Privilege Escalation | E | 3 | 5 | 15 | High |
| THR-007 | AI Prompt Injection | T, I | 4 | 3 | 12 | High |
| THR-008 | SSRF Through Data Ingestion | I, E | 3 | 5 | 15 | High |
| THR-009 | Excessive AI Resource Consumption | D | 4 | 3 | 12 | High |
| THR-010 | Secret Exposure | I | 3 | 5 | 15 | High |
| THR-011 | Unsafe External Product Data | T | 4 | 3 | 12 | High |
| THR-012 | Insufficient Auditability | R | 3 | 3 | 9 | Medium |
| THR-013 | Mass Assignment | T, E | 4 | 4 | 16 | High |
| THR-014 | Broken Authentication / JWT Validation | S, E | 3 | 5 | 15 | High |

**STRIDE Legend**

- S: Spoofing
- T: Tampering
- R: Repudiation
- I: Information Disclosure
- D: Denial of Service
- E: Elevation of Privilege

The severity classifications are based on the score ranges defined in Section 6, not on independent labels assigned to each threat.

---

## 8. Threat Scenarios and Mitigations

### THR-001 — Broken Object-Level Authorization

**Scenario:** A customer changes an order or configuration identifier to access another customer's resource.

**Affected Modules:** Orders, PC Builder, Identity.

**Risk:** 4 × 4 = 16 — High.

**Likelihood Rationale:** Resource identifiers are commonly supplied through API paths. Missing object-level checks are a plausible implementation error.

**Impact Rationale:** Successful exploitation may expose or modify another customer's private resources.

**Mitigations:**
- Verify resource ownership for every protected operation.
- Use authenticated identity from trusted server context.
- Deny access by default.
- Add cross-user authorization tests.

**Verification:** Supertest integration tests using two customer identities.

### THR-002 — Checkout Price Tampering

**Scenario:** A client submits modified product prices or totals.

**Affected Modules:** Catalog, Cart, Checkout, Orders.

**Risk:** 4 × 5 = 20 — Critical.

**Likelihood Rationale:** Client-controlled request bodies are directly accessible and can be modified.

**Impact Rationale:** Incorrect checkout totals can compromise order and financial integrity.

**Mitigations:**
- Calculate prices on the backend.
- Validate product availability.
- Persist authoritative order snapshots.
- Reject unexpected price fields.

**Verification:** Supertest tests with modified checkout payloads.

### THR-003 — Inventory Race Condition

**Scenario:** Concurrent checkout requests reserve more units than available.

**Affected Modules:** Checkout, Inventory.

**Risk:** 4 × 5 = 20 — Critical.

**Likelihood Rationale:** Concurrent requests are expected in ecommerce systems, and read-then-write logic is a common implementation mistake.

**Impact Rationale:** Overselling compromises inventory and order consistency.

**Mitigations:**
- Conditional atomic updates.
- PostgreSQL transactions.
- Consistent lock ordering.
- Idempotent reservation operations.

**Verification:** PostgreSQL integration tests with concurrent requests.

### THR-004 — Forged Payment Webhook

**Scenario:** An attacker submits a fake payment-success callback.

**Affected Modules:** Payments, Orders.

**Risk:** 3 × 5 = 15 — High.

**Likelihood Rationale:** Webhook endpoints may be publicly reachable, but exploitation depends on missing or incorrect verification.

**Impact Rationale:** An unpaid order could be marked as paid.

**Mitigations:**
- Provider-specific signature verification.
- Verify transaction identity, amount and currency.
- Enforce valid state transitions.
- Reject unauthenticated callbacks.

**Verification:** Supertest tests using invalid signatures and mismatched payment data.

### THR-005 — Duplicate or Out-of-Order Payment Events

**Scenario:** Replayed or delayed webhook events produce duplicate or inconsistent business effects.

**Affected Modules:** Payments, Orders, Inventory.

**Risk:** 4 × 5 = 20 — Critical.

**Likelihood Rationale:** Duplicate delivery and delayed asynchronous events are realistic integration conditions.

**Impact Rationale:** Incorrect order and reservation transitions can compromise transaction integrity.

**Mitigations:**
- Unique provider event identifiers.
- Idempotent processing.
- Transactional state coordination.
- Explicit late-payment policy.

**Verification:** Vitest and Supertest integration tests covering duplicate, delayed and reordered events.

### THR-006 — Administrative Privilege Escalation

**Scenario:** A customer accesses an administrative operation.

**Affected Modules:** Identity, Catalog, Inventory, Orders.

**Risk:** 3 × 5 = 15 — High.

**Mitigations:**
- Deny-by-default authorization.
- Explicit role and permission checks.
- Audit sensitive changes.
- Test unauthorized access.

**Verification:** Supertest role-based authorization matrix.

### THR-007 — AI Prompt Injection

**Scenario:** Untrusted input manipulates model behavior.

**Affected Modules:** AI Advisor.

**Risk:** 4 × 3 = 12 — High.

**Mitigations:**
- Validate structured AI output.
- Restrict model-accessible data and tools.
- Keep provider credentials server-side.
- Re-evaluate compatibility deterministically.

**Verification:** Vitest adversarial input and malformed-output tests.

### THR-008 — Server-Side Request Forgery

**Scenario:** External URLs cause the backend to access internal network resources.

**Affected Modules:** Data Ingestion.

**Risk:** 3 × 5 = 15 — High.

**Mitigations:**
- Allowlist approved seller hosts.
- Validate redirect destinations.
- Block private, loopback and link-local destinations.
- Apply network egress restrictions.

**Verification:** Controlled integration tests with local mock HTTP servers.

### THR-009 — AI Resource Exhaustion

**Scenario:** Excessive requests consume provider quotas.

**Affected Modules:** AI Advisor.

**Risk:** 4 × 3 = 12 — High.

**Mitigations:**
- Rate limiting.
- Per-user quotas.
- Request and output limits.
- Timeouts and concurrency limits.

**Verification:** Supertest rate-limit tests and controlled usage-limit tests.

### THR-010 — Secret Exposure

**Scenario:** API keys or credentials are committed to source code or exposed in logs.

**Affected Modules:** All integrations.

**Risk:** 3 × 5 = 15 — High.

**Mitigations:**
- Server-side secret configuration.
- Secret scanning.
- Log redaction.
- Credential rotation procedures.

**Verification:** Gitleaks and manual configuration review.

### THR-011 — Unsafe External Product Data

**Scenario:** Incorrect or malicious seller data influences catalog matching and recommendations.

**Affected Modules:** Seller Offers, Data Ingestion.

**Risk:** 4 × 3 = 12 — High.

**Mitigations:**
- Validate source records.
- Preserve provenance.
- Review ambiguous matches.
- Keep external prices separate from checkout prices.

**Verification:** Vitest validation and product-matching tests.

### THR-012 — Insufficient Auditability

**Scenario:** Sensitive changes occur without enough information to investigate them.

**Affected Modules:** Identity, Payments, Orders, Administration.

**Risk:** 3 × 3 = 9 — Medium.

**Mitigations:**
- Structured audit events.
- Actor identity.
- Correlation IDs.
- Sensitive-data redaction.

**Verification:** Supertest audit event integration tests.

### THR-013 — Mass Assignment

**Scenario:** A client sends additional properties that should not be writable, such as `role`, `isAdmin`, `price`, `stockQuantity` or `paymentStatus`.

**Affected Modules:** Identity, Catalog, Checkout, Orders, Administration.

**Risk:** 4 × 4 = 16 — High.

**Likelihood Rationale:** APIs commonly accept JSON objects, and directly passing request bodies to persistence operations is a plausible implementation error.

**Impact Rationale:** Successful exploitation may modify protected fields, elevate privileges or corrupt business data.

**Mitigations:**
- Use operation-specific request DTOs.
- Reject or strip unexpected properties according to endpoint policy.
- Explicitly map allowed fields to application commands.
- Never pass untrusted request bodies directly into persistence updates.
- Enforce authorization independently of DTO validation.

**Verification:**
- Supertest requests containing unexpected privileged fields.
- Unit tests for DTO validation and command mapping.
- Manual request modification using Burp Suite Community.

**Expected Result:** Unauthorized fields are rejected or ignored according to the documented API contract and never modify protected state.

### THR-014 — Broken Authentication / JWT Validation

**Scenario:** An attacker bypasses authentication because of incorrect token verification, missing expiration checks, insecure session handling or weak refresh-token lifecycle controls.

**Affected Modules:** Identity, API authentication middleware and guards.

**Risk:** 3 × 5 = 15 — High.

**Likelihood Rationale:** Authentication implementations contain multiple security-sensitive configuration and lifecycle decisions. The risk depends on the final authentication design.

**Impact Rationale:** A successful bypass could permit account takeover or unauthorized access to protected APIs.

**Mitigations:**
- Use maintained authentication libraries.
- Verify JWT signatures and restrict accepted algorithms.
- Validate expiration, issuer and audience where applicable.
- Reject unsigned, malformed or incorrectly signed tokens.
- Implement a defined refresh-token rotation/revocation policy if refresh tokens are used.
- Protect signing keys and secrets.
- Enforce authentication consistently on protected endpoints.
- Apply login rate limits.

**Verification:**
- Supertest requests with missing, expired, malformed and incorrectly signed tokens.
- Vitest tests for authentication services and token lifecycle.
- Burp Suite Community for manual HTTP request inspection.

**Expected Result:** Invalid authentication evidence never grants access to protected resources.

---

## 9. Security Verification Plan and Tool Selection

### 9.1 Selection Principles

Security tooling must be appropriate for:

- One-developer project scope.
- Node.js and TypeScript.
- NestJS REST APIs.
- PostgreSQL.
- Local Windows development.
- Limited infrastructure and maintenance overhead.

Automated scanning is supplementary to business-logic security tests.

### 9.2 Selected Tools

| Tool | Purpose | Installation Requirement | Planned Usage | Priority |
|---|---|---|---|---|
| Vitest | Unit and domain security tests | npm/pnpm devDependency | Test validation, state transitions, AI output | P0 |
| Supertest | HTTP integration security tests | npm/pnpm devDependency | Test authentication, authorization and malicious inputs | P0 |
| Gitleaks | Secret scanning | CLI binary or CI action | Detect committed credentials | P1 |
| npm audit / pnpm audit | Dependency vulnerability review | Existing package manager | Review known vulnerable packages | P1 |
| Burp Suite Community | Manual HTTP security testing | Desktop installation | Intercept and modify requests against local API | P1 |
| Semgrep | Static security analysis | CLI or CI integration | Review suspicious TypeScript patterns | P2 |
| OWASP ZAP | Dynamic application security testing | Desktop, container or automation setup | Staging assessment | P2 |

P0 = necessary during implementation.  
P1 = introduce when corresponding features exist.  
P2 = defer until the project is sufficiently stable.

### 9.3 Tool Tradeoffs

**Vitest + Supertest**

Advantages:
- Directly integrated with the existing Node.js development workflow.
- Effective for application-specific security behavior.
- Supports regression testing.
- No separate security scanning infrastructure.

Limitations:
- Tests must be designed and maintained.
- Cannot automatically discover every vulnerability.

**Gitleaks**

Advantages:
- Focused secret detection.
- Easy to introduce into Git workflows.

Limitations:
- Pattern-based detection can produce false positives.
- Cannot prove that no credentials have leaked.

**Package Manager Audit**

Advantages:
- Minimal setup.
- Suitable for dependency hygiene.

Limitations:
- Depends on known vulnerability advisories.
- Does not detect custom business-logic flaws.

**Burp Suite Community**

Advantages:
- Provides practical experience inspecting HTTP traffic.
- Useful for manually testing authorization and input manipulation.

Limitations:
- Manual workflow.
- Limited automation and scanner capabilities in the Community edition.

**Semgrep**

Advantages:
- Useful for source-level security patterns.
- Supports TypeScript and custom rules.

Limitations:
- Requires rule selection and findings review.
- Does not verify runtime business correctness.

**OWASP ZAP**

Advantages:
- Supports dynamic assessment of running applications.
- Useful for repeatable web/API security checks.

Limitations:
- Requires a running test environment.
- Active scanning may alter application state.
- Findings require verification.

### 9.4 Threat-to-Tool Mapping

| Threat ID | Primary Verification | Supporting Tool |
|---|---|---|
| THR-001 | Supertest | Burp Community |
| THR-002 | Supertest | Burp Community |
| THR-003 | PostgreSQL integration tests | Vitest |
| THR-004 | Supertest | Burp Community |
| THR-005 | Vitest + Supertest | PostgreSQL |
| THR-006 | Supertest | Burp Community |
| THR-007 | Vitest | Manual adversarial review |
| THR-008 | Integration tests with mock HTTP servers | Manual review |
| THR-009 | Supertest | Controlled rate-limit testing |
| THR-010 | Gitleaks | Manual configuration review |
| THR-011 | Vitest | Manual data review |
| THR-012 | Supertest | Log inspection |
| THR-013 | Supertest | Burp Community, Semgrep |
| THR-014 | Supertest + Vitest | Burp Community |

### 9.5 Verification Evidence

Each completed security test should record:

- Test case ID.
- Related threat ID.
- Tested endpoint or component.
- Test environment.
- Tool used.
- Test input or scenario.
- Expected behavior.
- Actual behavior.
- Pass/fail result.
- Relevant test output or screenshot.
- Remediation reference if applicable.

Example:

| Field | Example |
|---|---|
| Test Case | SEC-TC-013-01 |
| Threat | THR-013 |
| Endpoint | PATCH /api/v1/users/me |
| Tool | Supertest |
| Scenario | Submit `role: "ADMIN"` |
| Expected | Role remains unchanged; request follows unexpected-field policy |
| Actual | Not tested |
| Status | Planned |

### 9.6 Progressive Adoption

**Stage A — During Implementation**

Use Vitest and Supertest.

Write security tests alongside the affected feature.

**Stage B — When GitHub Workflow Is Stable**

Introduce Gitleaks and package dependency auditing.

Review findings before applying blocking policies.

**Stage C — When API Endpoints Are Available**

Use Burp Suite Community for targeted manual testing.

**Stage D — Before Release**

Evaluate Semgrep and OWASP ZAP.

Do not require full SAST/DAST automation for the initial learning milestones.

---

## 10. Risk Treatment and Residual Risk

Every threat must have:

- Proposed mitigation.
- Responsible module or owner.
- Verification method.
- Implementation status.
- Residual risk assessment after verification.

### Risk Treatment Status

Allowed statuses:

- `IDENTIFIED`
- `PLANNED`
- `IMPLEMENTED`
- `VERIFIED`
- `ACCEPTED`

`IMPLEMENTED` does not imply `VERIFIED`.

### Residual Risk Policy

Residual risk must be recorded as **Not Yet Assessed** until:

1. Relevant controls are implemented.
2. Tests or reviews provide evidence.
3. Likelihood and impact are reassessed.

No residual risk scores are claimed in this version.

## 11. Security Requirements Traceability

| Requirement | Related Threat |
|---|---|
| SEC-REQ-001 — Object-level authorization | THR-001 |
| SEC-REQ-002 — Server-side authoritative pricing | THR-002 |
| SEC-REQ-003 — Atomic inventory reservation | THR-003 |
| SEC-REQ-004 — Webhook authentication | THR-004 |
| SEC-REQ-005 — Idempotent payment processing | THR-005 |
| SEC-REQ-006 — Administrative authorization | THR-006 |
| SEC-REQ-007 — AI output and tool restrictions | THR-007 |
| SEC-REQ-008 — Restricted outbound ingestion requests | THR-008 |
| SEC-REQ-009 — AI resource limits | THR-009 |
| SEC-REQ-010 — Secret protection | THR-010 |
| SEC-REQ-011 — External data validation | THR-011 |
| SEC-REQ-012 — Audit logging | THR-012 |
| SEC-REQ-013 — Explicit writable-field controls | THR-013 |
| SEC-REQ-014 — Secure authentication and token validation | THR-014 |

## 12. Open Decisions

- Authentication mechanism and JWT/session architecture.
- Refresh-token lifecycle.
- Administrative permission model.
- Payment provider and verification contract.
- Reservation expiration and late-payment handling.
- AI usage quotas.
- External data ingestion restrictions.
- Logging retention.
- CI security tooling adoption schedule.

## 13. Definition of Done

- [ ] Assets and trust boundaries reviewed.
- [ ] Attack surfaces reviewed.
- [ ] All threats have likelihood and impact scores.
- [ ] Scoring criteria are documented.
- [ ] Threat assumptions are understood.
- [ ] Every threat has proposed mitigation.
- [ ] Every threat has a verification method.
- [ ] Specific security tools are identified.
- [ ] Mass Assignment is covered.
- [ ] Broken Authentication/JWT is covered.
- [ ] Security requirements are traceable.
- [ ] Open decisions are recorded.
- [ ] Document approved for use in API Contract Design.

---

**Status: Revised Draft — Awaiting Review**