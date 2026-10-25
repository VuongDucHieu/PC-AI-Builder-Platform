# AI PC Builder — Database Design

**Document ID:** ARCH-004  
**Version:** 1.0 Draft  
**Status:** Proposed  
**Database:** PostgreSQL  
**Architecture:** Modular Monolith  
**Related Documents:** BA-002, BA-005, ARCH-002, ARCH-003

---

## 1. Purpose

Define the logical relational database model for AI PC Builder, including table ownership, relationships, constraints, indexes, and transactional consistency requirements.

This document is a design specification. It is not an executable SQL migration.

## 2. Database Principles

1. PostgreSQL is the primary transactional database.
2. Each business module owns its data and write operations.
3. Foreign keys protect referential integrity where applicable.
4. Unique constraints prevent duplicate identities.
5. Check constraints protect simple row-level invariants.
6. Transactions protect multi-row and multi-aggregate consistency.
7. External provider data is untrusted until validated.
8. Historical order data must remain stable after catalog changes.
9. Monetary values must use exact representations.
10. Database constraints complement, rather than replace, domain validation.

## 3. Identity Tables

### users

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password_hash | TEXT | Nullable for future external authentication |
| role | VARCHAR(30) | NOT NULL |
| status | VARCHAR(30) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

Additional authentication tables, such as sessions or refresh tokens, will be designed when the authentication strategy is selected.

## 4. Catalog Tables

### categories

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| code | VARCHAR(50) | UNIQUE, NOT NULL |
| name | VARCHAR(100) | NOT NULL |

### products

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| category_id | UUID | FK → categories.id |
| sku | VARCHAR(100) | UNIQUE, NOT NULL |
| name | TEXT | NOT NULL |
| status | VARCHAR(30) | NOT NULL |
| price_vnd | BIGINT | NOT NULL, CHECK >= 0 |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### product_specifications

| Column | Type | Constraint |
|---|---|---|
| product_id | UUID | PK, FK → products.id |
| specification_data | JSONB | NOT NULL |
| schema_version | INTEGER | NOT NULL |

### Design Decision: JSONB Specifications

Hardware categories have different attributes.

Examples:

- CPU: socket, cores, threads, TDP.
- Motherboard: socket, RAM type, form factor.
- GPU: length, power consumption.
- PSU: wattage, connector support.
- Case: supported form factors, GPU clearance.

The initial design uses category-specific JSONB specifications validated by application schemas.

Frequently queried fields may later receive expression indexes or be normalized into dedicated relational structures.

JSONB must not be used as an excuse to skip validation.

## 5. PC Builder Tables

### pc_configurations

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| owner_id | UUID | FK → users.id, NOT NULL for persisted configurations |
| name | VARCHAR(150) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

Temporary guest configurations may initially be held client-side and are not persisted in this table.

### pc_configuration_items

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| configuration_id | UUID | FK → pc_configurations.id |
| product_id | UUID | FK → products.id |
| category_code | VARCHAR(50) | NOT NULL |
| quantity | INTEGER | CHECK > 0 |

A partial unique index may enforce single-slot component categories.

The exact rule depends on the finalized component quantity policy.

## 6. Cart Tables

### carts

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| customer_id | UUID | FK → users.id |
| status | VARCHAR(30) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### cart_items

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| cart_id | UUID | FK → carts.id |
| product_id | UUID | FK → products.id |
| quantity | INTEGER | CHECK > 0 |

**Unique constraint:** `(cart_id, product_id)`.

Cart prices are not authoritative checkout prices.

## 7. Order Tables

### orders

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| customer_id | UUID | FK → users.id |
| status | VARCHAR(30) | NOT NULL |
| currency | CHAR(3) | NOT NULL |
| subtotal_amount | BIGINT | NOT NULL, CHECK >= 0 |
| total_amount | BIGINT | NOT NULL, CHECK >= 0 |
| checkout_idempotency_key | VARCHAR(150) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

**Unique constraint:** `(customer_id, checkout_idempotency_key)`.

The scope and retention policy of idempotency keys require detailed design.

### order_items

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | FK → orders.id |
| product_id | UUID | FK → products.id |
| sku_snapshot | VARCHAR(100) | NOT NULL |
| name_snapshot | TEXT | NOT NULL |
| unit_price_amount | BIGINT | NOT NULL, CHECK >= 0 |
| quantity | INTEGER | CHECK > 0 |
| line_total_amount | BIGINT | NOT NULL, CHECK >= 0 |

Order item snapshots must remain unchanged when catalog products or prices change.

## 8. Inventory Tables

### inventory_stock

| Column | Type | Constraint |
|---|---|---|
| product_id | UUID | PK, FK → products.id |
| on_hand_quantity | INTEGER | NOT NULL, CHECK >= 0 |
| reserved_quantity | INTEGER | NOT NULL, CHECK >= 0 |
| updated_at | TIMESTAMPTZ | NOT NULL |

**Check constraint:**

`reserved_quantity <= on_hand_quantity`

Derived available quantity:

`on_hand_quantity - reserved_quantity`

### inventory_reservations

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | UNIQUE, FK → orders.id |
| status | VARCHAR(30) | NOT NULL |
| expires_at | TIMESTAMPTZ | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### inventory_reservation_items

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| reservation_id | UUID | FK → inventory_reservations.id |
| product_id | UUID | FK → products.id |
| quantity | INTEGER | CHECK > 0 |

**Unique constraint:** `(reservation_id, product_id)`.

### Inventory Invariants

- Available inventory must not become negative.
- A reservation must not be consumed twice.
- A reservation must not be released twice.
- Reservation changes and stock updates must be transactionally consistent.

## 9. Payment Tables

### payment_attempts

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | FK → orders.id |
| provider | VARCHAR(50) | NOT NULL |
| provider_payment_id | VARCHAR(255) | Nullable until assigned |
| expected_amount | BIGINT | NOT NULL, CHECK >= 0 |
| currency | CHAR(3) | NOT NULL |
| status | VARCHAR(30) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

**Unique constraint:** `(provider, provider_payment_id)` for non-null provider payment IDs.

### payment_events

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| payment_attempt_id | UUID | Nullable FK → payment_attempts.id |
| provider | VARCHAR(50) | NOT NULL |
| provider_event_id | VARCHAR(255) | NOT NULL |
| event_type | VARCHAR(100) | NOT NULL |
| processing_status | VARCHAR(30) | NOT NULL |
| received_at | TIMESTAMPTZ | NOT NULL |
| processed_at | TIMESTAMPTZ | Nullable |

**Unique constraint:** `(provider, provider_event_id)`.

A processing record must distinguish events successfully handled, ignored as stale, rejected for business validation, and requiring retry.

### refunds

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| payment_attempt_id | UUID | FK → payment_attempts.id |
| provider_refund_id | VARCHAR(255) | Nullable |
| amount | BIGINT | NOT NULL, CHECK > 0 |
| status | VARCHAR(30) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

Refund amount totals and payment state coordination require transactional validation.

## 10. External Pricing Tables

### sellers

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(150) | NOT NULL |
| website_url | TEXT | NOT NULL |
| status | VARCHAR(30) | NOT NULL |

### seller_offers

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| seller_id | UUID | FK → sellers.id |
| catalog_product_id | UUID | Nullable FK → products.id |
| external_product_key | TEXT | NOT NULL |
| external_url | TEXT | NOT NULL |
| match_status | VARCHAR(30) | NOT NULL |
| latest_price_amount | BIGINT | CHECK >= 0 |
| currency | CHAR(3) | NOT NULL |
| last_collected_at | TIMESTAMPTZ | Nullable |

**Unique constraint:** `(seller_id, external_product_key)`.

Unmatched external products must remain representable without a catalog product ID.

### price_observations

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| seller_offer_id | UUID | FK → seller_offers.id |
| observed_price_amount | BIGINT | NOT NULL, CHECK >= 0 |
| observed_at | TIMESTAMPTZ | NOT NULL |
| collection_job_id | UUID | Nullable FK → data_import_jobs.id |

### data_import_jobs

| Column | Type | Constraint |
|---|---|---|
| id | UUID | PK |
| source | VARCHAR(100) | NOT NULL |
| status | VARCHAR(30) | NOT NULL |
| started_at | TIMESTAMPTZ | NOT NULL |
| finished_at | TIMESTAMPTZ | Nullable |
| error_summary | TEXT | Nullable |

## 11. Index Strategy

Initial candidate indexes:

| Table | Index | Purpose |
|---|---|---|
| products | `(category_id, status)` | Category browsing |
| products | `(sku)` UNIQUE | Product identity |
| pc_configurations | `(owner_id, updated_at)` | Saved builds |
| orders | `(customer_id, created_at)` | Order history |
| orders | `(customer_id, checkout_idempotency_key)` UNIQUE | Checkout idempotency |
| inventory_reservations | `(status, expires_at)` | Reservation expiration |
| payment_attempts | `(order_id, created_at)` | Payment history |
| payment_events | `(provider, provider_event_id)` UNIQUE | Webhook idempotency |
| seller_offers | `(catalog_product_id, match_status)` | Price comparison |
| price_observations | `(seller_offer_id, observed_at)` | Price history |

Indexes must be validated against actual query patterns and execution plans.

Avoid adding indexes to every column without evidence.

## 12. Concurrency Control

### Problem: Overselling

Two customers may attempt to reserve the final available unit concurrently.

A separate read-then-write operation is insufficient.

### Proposed Approach

Use a conditional inventory update within a PostgreSQL transaction.

Conceptual SQL:

```sql
UPDATE inventory_stock
SET reserved_quantity = reserved_quantity + $1
WHERE product_id = $2
  AND on_hand_quantity - reserved_quantity >= $1
RETURNING product_id;
```

If no row is returned, the reservation fails.

For multiple products:

1. Use one database transaction.
2. Lock or update stock rows in a consistent order.
3. Create the reservation records.
4. Create the order.
5. Commit only if all operations succeed.

This prevents partial reservations and reduces deadlock risk.

## 13. Data Integrity Strategy

### Database Constraints

Use for:

- Primary keys.
- Foreign keys.
- Unique identities.
- Non-negative amounts.
- Positive quantities.
- Basic stock bounds.

### Domain Validation

Use for:

- Compatibility rules.
- Order state transitions.
- Payment state transitions.
- Category-specific specifications.
- Reservation lifecycle rules.

### Transactions

Use for:

- Order creation and stock reservation.
- Reservation release and stock update.
- Payment confirmation and coordinated order transitions.
- Idempotent webhook processing.

## 14. Open Decisions

1. ORM choice and migration tooling.
2. Authentication storage strategy.
3. Product specification schema and indexing.
4. Reservation expiration policy.
5. Payment retry and late-payment handling.
6. Order cancellation and refund inventory effects.
7. Soft-delete and archival policies.
8. Search implementation.
9. Data retention and privacy policies.

## 15. Definition of Done

- Core tables are identified.
- Primary and foreign keys are defined.
- Ownership aligns with module boundaries.
- Critical uniqueness constraints are identified.
- Inventory concurrency strategy is documented.
- Payment event idempotency is supported.
- Historical price snapshots are preserved.
- Open implementation decisions are recorded.

---

**Status:** Awaiting Architecture Review.