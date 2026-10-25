# AI PC Builder — Documentation Index

**Status:** Design documentation, not implementation evidence.
**Verified baseline:** main at `d54f91b6bd6d4a44ee1edb586c48dad340d7a693` (2026-10-25).

## Resume
1. Read [PROJECT-STATUS.md](PROJECT-STATUS.md).
2. Open the relevant document below.
3. Verify the current GitHub tree before assuming a document exists or was approved.
4. Update this index and status after each checkpoint.

## Product Discovery
- [Product Vision](01-product/01-product-vision.md)
- [Competitor Analysis](01-product/02-competitor-analysis.md)
- [Feature Inventory](01-product/03-feature-inventory.md)
- [Product Roadmap](01-product/04-product-roadmap.md)

## Business Analysis
- [Use Cases](02-business-analysis/01-use-case-diagram.md)
- [Business Rules](02-business-analysis/02-business-rules.md)
- [User Stories](02-business-analysis/03-user-stories-acceptance-criteria.md)
- [Business Process Modeling](02-business-analysis/04-business-process-modeling.md)
- [State Machines](02-business-analysis/05-state-machines.md)
- [Requirements Traceability](02-business-analysis/06-requirements-traceability.md)
- [BA Handoff](02-business-analysis/07-ba-handoff.md)

**Prerequisite:** Rename the existing `02-business analysis` folder to `02-business-analysis` and restore the empty BA-004 file. These links describe the intended structure.

## System Design
- [System Context](03-system-design/01-system-context-and-high-level-architecture.md)
- [Backend Module Boundaries](03-system-design/02-backend-module-boundaries.md)
- [Domain Model](03-system-design/03-domain-model-and-aggregates.md)
- [Database Design](03-system-design/04-database-design.md)
- **Planned:** `03-system-design/05-api-contract-design.md`

## Security
- [Threat Model](04-security/01-threat-model.md)
- [Security Architecture](04-security/02-security-architecture.md)
- [Security ADRs](04-security/03-security-architecture-decisions.md)
- [Documentation Integration Review](04-security/04-security-documentation-integration.md)
- [Authentication](04-security/designs/01-authentication-session-design.md)
- [CSRF](04-security/designs/02-csrf-protection-design.md)
- [AI Data Protection](04-security/designs/03-ai-data-protection-design.md)
- [Audit Logging](04-security/designs/04-audit-logging-design.md)

## Status semantics
**Proposed** = draft; **Accepted** = approved design, not built;
**Implemented** = code exists; **Verified** = tested with evidence;
**Blocked** = prerequisite unresolved.

ARCH-004 owns the consolidated database contract; future ARCH-005 owns the API contract. Security designs own security behavior. The repository, not chat history, is the source of truth.
