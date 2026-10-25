# AI PC Builder — Documentation Index

**Status:** Index draft. Links assume the documented files exist in the repository; verify against GitHub before treating the index as complete.

## How to resume this project

1. Read [`PROJECT-STATUS.md`](PROJECT-STATUS.md) for the active checkpoint, unresolved decisions and next action.
2. Read the relevant architecture/BA/security document listed below.
3. Check the status header of each document; **Proposed** is not **Implemented** or **Verified**.
4. Before coding, reconcile API contracts with ARCH-004 database design and the security invariants.
5. After each checkpoint, update this index and `PROJECT-STATUS.md` in the same commit.

## Product Discovery

- [Product Vision](01-product/01-product-vision.md)
- [Competitor Analysis](01-product/02-competitor-analysis.md)
- [Feature Inventory](01-product/03-feature-inventory.md)
- [Product Roadmap](01-product/04-product-roadmap.md)

## Business Analysis

- [Use Cases](02-business-analysis/01-use-case-diagram.md)
- [Business Rules](02-business-analysis/02-business-rules.md)
- [User Stories & Acceptance Criteria](02-business-analysis/03-user-stories-acceptance-criteria.md)
- [Business Process Modeling](02-business-analysis/04-business-process-modeling.md)
- [State Machines](02-business-analysis/05-state-machines.md)
- [Requirements Traceability](02-business-analysis/06-requirements-traceability.md)
- [BA Handoff](02-business-analysis/07-ba-handoff.md)

## System Design

- [System Context & High-Level Architecture](03-system-design/01-system-context-and-high-level-architecture.md)
- [Backend Module Boundaries](03-system-design/02-backend-module-boundaries.md)
- [Domain Model & Aggregates](03-system-design/03-domain-model-and-aggregates.md)
- [Database Design](03-system-design/04-database-design.md)
- **Next planned:** `03-system-design/05-api-contract-design.md`

## Security

- [Threat Model](04-security/01-threat-model.md) — confirm THR-015/016 integration
- [Security Architecture](04-security/02-security-architecture.md)
- [Security Architecture Decisions](04-security/03-security-architecture-decisions.md)
- [Security Documentation Integration Review](04-security/04-security-documentation-integration-review.md) — current review

### Detailed Security Designs

- [Authentication & Session](04-security/designs/01-authentication-session-design.md)
- [CSRF Protection](04-security/designs/02-csrf-protection-design.md)
- [AI Data Protection](04-security/designs/03-ai-data-protection-design.md)
- [Audit Logging](04-security/designs/04-audit-logging-design.md)

## Conventions

- **Proposed:** Written, not yet approved.
- **Accepted:** Architecture decision approved for implementation; not yet built.
- **Implemented:** Source code exists; security correctness not implied.
- **Verified:** Corresponding automated/manual verification completed with evidence.
- **Blocked:** Missing prerequisite or unresolved high-priority issue.

All Mermaid diagrams must render in GitHub or an approved Mermaid renderer. Keep decisions, diagrams, schema changes, failure paths and verification cases in repository documents rather than relying on conversation history.
