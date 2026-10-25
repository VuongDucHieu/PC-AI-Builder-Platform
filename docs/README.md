# AI PC Builder — Documentation Index

**Status:** Architecture and security design in progress. `Proposed` does not mean implemented.
**Repository:** `VuongDucHieu/PC-AI-Builder-Platform`

## Working agreement
1. Check the current GitHub tree and read the relevant documents below.
2. Make one checkpoint at a time; update the owning document directly.
3. ARCH-004 is the canonical database design; SEC-002.1/2/4 define security behavior.
4. Do not create separate SEC-INT resolution files for every change.
5. This project intentionally does **not** require `PROJECT-STATUS.md`.

## Product Discovery
- [Product Vision](01-product/01-product-vision.md)
- [Competitor Analysis](01-product/02-competitor-analysis.md)
- [Feature Inventory](01-product/03-feature-inventory.md)
- [Product Roadmap](01-product/04-product-roadmap.md)

## Business Analysis
**Actual folder name on GitHub:** `02-business analysis` (space retained to avoid requiring a directory move).
- [Use Cases](02-business%20analysis/01-use-case-diagram.md)
- [Business Rules](02-business%20analysis/02-business-rules.md)
- [User Stories and Acceptance Criteria](02-business%20analysis/03-user-stories-acceptance-criteria.md)
- [Business Process Modeling](02-business%20analysis/04-business-process-modeling.md)
- [State Machines](02-business%20analysis/05-state-machines.md)
- [Requirements Traceability](02-business%20analysis/06-requirements-traceability.md)
- [BA Handoff](02-business%20analysis/07-ba-handoff.md)

## System Design
- [System Context](03-system-design/01-system-context-and-high-level-architecture.md)
- [Backend Module Boundaries](03-system-design/02-backend-module-boundaries.md)
- [Domain Model and Aggregates](03-system-design/03-domain-model-and-aggregates.md)
- [Database Design — ARCH-004](03-system-design/04-database-design.md)
- **Planned:** `03-system-design/05-api-contract-design.md` (ARCH-005)

## Security
- [Threat Model](04-security/01-threat-model.md)
- [Security Architecture](04-security/02-security-architecture.md)
- [Security Architecture Decisions](04-security/03-security-architecture-decisions.md)
- [Security Documentation Integration](04-security/04-security-documentation-integration.md)

### Security technical designs
- [Authentication and Session — SEC-002.1](04-security/designs/01-authentication-session-design.md)
- [CSRF Protection — SEC-002.2](04-security/designs/02-csrf-protection-design.md)
- [AI Data Protection — SEC-002.3](04-security/designs/03-ai-data-protection-design.md)
- [Audit Logging — SEC-002.4](04-security/designs/04-audit-logging-design.md)

## Status meanings
- **Proposed:** Design draft.
- **Accepted:** Approved architecture decision; may not be coded.
- **Implemented:** Source code exists; verification still required.
- **Verified:** Corresponding tests or review evidence exists.
- **Blocked:** Prerequisite unresolved.

## Current design priorities
1. Reconcile SEC-INT-001/002/003 against source designs and integration tracker.
2. Decide session-bound CSRF recovery after reload; MVP policy is explicit re-login.
3. Review security schema constraints and browser/session trade-offs.
4. Begin ARCH-005 API Contract Design once the blocking contracts are settled.

No frontend/backend implementation is claimed by this documentation.
