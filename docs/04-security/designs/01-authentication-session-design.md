# AI PC Builder — Authentication & Session Technical Design

**Document ID:** SEC-002.1  
**Version:** 1.0.2  
**Status:** Proposed — Awaiting Review  
**Path:** `docs/04-security/designs/01-authentication-session-design.md`  
**Related:** SEC-001, SEC-002, SEC-002-ADR, SEC-002.2, SEC-002.4, ARCH-004, SEC-INT-001  
**Scope:** Identity module and browser authentication; not payment webhooks or service-to-service authentication.

## 1. Goals and security invariants

- Verify JWT signature, allowed algorithm, issuer, audience, expiration and required claims.
- A cryptographically valid JWT must **not** authorize access if its server-side session is revoked, expired or belongs to a disabled user.
- Access JWTs are short-lived (proposed 10 minutes) and kept in browser memory; opaque refresh tokens are kept in Secure, HttpOnly cookies (proposed maximum session lifetime 7 days).
- Refresh credentials are single-use, stored only as hashes, and rotated atomically.
- Logout and administrative revocation invalidate all access JWTs linked to the revoked session, subject to the authoritative session check on every protected request.
- Authentication does not replace RBAC or object-level authorization.
- Never log raw JWTs, refresh tokens, passwords, CSRF tokens or cookie headers.
- If authoritative session status cannot be checked, protected operations fail closed.

## 2. Decisions and assumptions

| Decision | MVP baseline | Rationale / constraint |
|---|---|---|
| Access credential | Signed JWT, 10-minute TTL (proposed) | Short exposure window; verify `iss`, `aud`, `sub`, `sid`, `jti`, `iat`, `exp` |
| Refresh credential | CSPRNG-generated opaque token | Does not expose session data; single use |
| Browser storage | Access JWT in memory; refresh cookie HttpOnly/Secure | Avoid persistent JavaScript-readable credentials |
| Session authority | PostgreSQL | Immediate revocation without a growing JWT denylist |
| Rotation | PostgreSQL transaction and row lock | Prevent simultaneous successful use of one token |
| Reuse response | Revoke affected session family and require re-login | Conservative protection against replay |
| CSRF | Session-bound token + Origin validation on cookie-authenticated mutations | See SEC-002.2 for exact bootstrap and deployment topology |
| Audit | Versioned security audit event persisted in PostgreSQL | See SEC-002.4 |

**Deployment assumption:** Browser and API have a compatible same-site cookie deployment. Cross-site deployment requires a separate cookie/CSRF review. Cookie `Path` must cover refresh, logout and other endpoints that require the cookie; it must not be widened unnecessarily.

## 3. Component diagram

```mermaid
flowchart TB
    Browser["Next.js browser"]
    subgraph API["NestJS Identity boundary"]
      AuthController["AuthController"]
      CsrfGuard["Cookie CSRF / Origin Guard"]
      JwtGuard["AccessJwtGuard"]
      AuthService["AuthenticationService"]
      SessionService["SessionService"]
      TokenService["TokenService"]
      Authz["Authorization Guard / Policy"]
    end
    subgraph DB["PostgreSQL"]
      Users[("users")]
      Sessions[("auth_sessions")]
      Refresh[("refresh_token_records")]
      Audit[("security_audit_events")]
    end
    Browser --> AuthController
    Browser --> JwtGuard
    AuthController --> CsrfGuard
    AuthController --> AuthService
    AuthService --> TokenService
    AuthService --> SessionService
    AuthService --> Users
    JwtGuard --> TokenService
    JwtGuard --> SessionService
    JwtGuard --> Authz
    SessionService --> Sessions
    SessionService --> Refresh
    SessionService --> Audit
```

**Responsibilities:** `TokenService` creates/verifies cryptographic credentials; `SessionService` is authoritative for active/revoked status and refresh rotation; `AuthController` handles HTTP and cookie transport; authorization policies protect operations and resources after authentication.

## 4. CSRF bootstrap and login sequence

**Canonical behavior:** SEC-002.2 sections 5–7 define the CSRF bootstrap, Origin validation, cookie attributes, and CSRF token lifecycle. This diagram integrates those requirements with Identity login. The HTTP request/response contract will be finalized in ARCH-005.

```mermaid
sequenceDiagram
    autonumber
    participant B as Next.js Browser
    participant C as AuthController
    participant X as CSRF Service
    participant A as AuthenticationService
    participant DB as PostgreSQL
    participant T as TokenService
    B->>C: GET /api/v1/auth/csrf
    C->>X: Issue anonymous bootstrap context
    X->>DB: Store bootstrap token hash and expiry
    DB-->>X: Context persisted
    X-->>C: Bootstrap cookie and CSRF token
    C-->>B: 200 with cookie and token and no-store
    B->>C: POST /api/v1/auth/login with cookie and CSRF header
    C->>X: Validate Origin and bootstrap proof
    alt Invalid or expired bootstrap proof
        X-->>C: Reject request
        C-->>B: 403 Forbidden
    else Valid bootstrap proof
        C->>A: Authenticate credentials
        A->>DB: Read user and password hash
        alt Invalid credentials or disabled account
            A-->>C: Authentication failed
            C-->>B: 401 generic error
        else Valid credentials
            A->>DB: Atomically consume bootstrap and create session
            A->>DB: Persist refresh hash and session CSRF hash
            A->>T: Issue signed access JWT
            T-->>A: Access JWT
            A-->>C: JWT and refresh credential and session CSRF token
            C-->>B: 200 with JWT and CSRF token and refresh cookie
        end
    end
```

**Behavioral requirements:**
- `GET /auth/csrf` is anonymous, rate-limited as appropriate, returns `Cache-Control: no-store`, and issues a short-lived bootstrap context; it is not proof of identity.
- `POST /auth/login` requires an allowed Origin, bootstrap cookie, and matching `X-CSRF-Token`. Missing, expired, or mismatched proof is rejected before credentials can establish a session.
- Successful login consumes the bootstrap context and creates a new authenticated session-bound CSRF token. The bootstrap cookie is cleared or invalidated as specified by SEC-002.2.
- Invalid credentials return a non-enumerating error. The design must explicitly decide whether failed attempts consume bootstrap contexts; this is **open** and must be consistent in SEC-002.2 and ARCH-005.
- Session and refresh-token persistence must commit before a successful login response is returned. CSRF bootstrap consumption and session creation must not permit the same bootstrap context to create multiple sessions concurrently.
- Authentication credentials, cookies, and CSRF tokens must not appear in application or audit logs.

## 5. Protected request and revocation sequence

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant G as AccessJwtGuard
    participant S as SessionService
    participant DB as PostgreSQL
    participant P as AuthorizationPolicy
    participant U as UseCase
    B->>G: Authorization: Bearer access-JWT
    G->>G: Verify signature, algorithm, iss, aud, exp, required claims
    alt Invalid JWT
      G-->>B: 401 Unauthorized
    else Cryptographically valid
      G->>S: Check session sid and user sub
      S->>DB: Load session + account status
      alt Session revoked/expired, account disabled, or DB unavailable
        S-->>G: Not authorized
        G-->>B: 401 or 503 for infrastructure outage (no access granted)
      else Active session
        G->>P: Check role and resource permissions
        alt Not authorized
          P-->>B: 403 Forbidden
        else Authorized
          P->>U: Execute
          U-->>B: Result
        end
      end
    end
```

**Guarantee:** Logout/revoke takes effect for requests whose authoritative session check occurs after the revocation commit. Already-running operations require separate transaction/business controls; do not promise retroactive cancellation.

## 6. Refresh rotation sequence

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant C as AuthController
    participant X as CSRFGuard
    participant S as SessionService
    participant DB as PostgreSQL
    B->>C: POST /api/v1/auth/refresh with cookie and CSRF header
    C->>X: Validate Origin and session-bound CSRF
    alt CSRF invalid
      X-->>B: 403 Forbidden
    else CSRF valid
      C->>S: Rotate refresh credential
      S->>DB: Begin transaction and lock session row
      DB-->>S: Current status + token record
      alt Current, active, unexpired token
        S->>DB: Mark old token consumed and insert successor hash
        S->>DB: Update current token reference and commit
        S-->>C: New access JWT and refresh token and CSRF state
        C-->>B: HTTP 200 with rotated cookie and access JWT
      else Known consumed token (reuse)
        S->>DB: Revoke session and token family then commit
        C-->>B: 401 Reauthentication required
      else Unknown, expired, or revoked token
        S->>DB: No credential issued
        C-->>B: 401 Unauthorized
      end
    end
```

**Concurrent requests:** The browser must implement single-flight refresh (one refresh request, many waiting callers). The database lock and conditional update ensure only one rotation commits. A duplicate refresh from another tab, a retry after a lost response, or an attacker replay may be indistinguishable from the server's perspective; the conservative MVP policy revokes the family upon confirmed reuse of a consumed token. Cross-tab coordination, network retry UX and false-positive risk require explicit tests. Do **not** silently accept a consumed refresh token during a grace period without a separate threat review.

## 7. Logout, logout-all and administrative revocation

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant C as AuthController
    participant S as SessionService
    participant DB as PostgreSQL
    B->>C: POST /auth/logout + access JWT + CSRF + refresh cookie
    C->>C: Verify identity, Origin and CSRF as applicable
    C->>S: Revoke current session
    S->>DB: Transaction: mark revoked + invalidate refresh family + audit event
    DB-->>S: Commit
    S-->>C: Revocation complete
    C-->>B: 204 + clear refresh cookie
    Note over B,DB: Subsequent protected requests using old sid are rejected
```

`logout-all` revokes every active session belonging to the authenticated user. Account suspension and credential compromise must also revoke sessions. A logout endpoint should be idempotent and should clear the browser cookie even when the session is already invalid, without leaking session existence. Precise behavior when an access JWT has expired but a refresh cookie remains valid is part of the auth API contract; it must not rely on accepting an expired access JWT.

## 8. Session and refresh credential state machines

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: login committed
    ACTIVE --> REVOKED: logout / admin / detected reuse
    ACTIVE --> EXPIRED: absolute expiry
    REVOKED --> [*]
    EXPIRED --> [*]
```

```mermaid
stateDiagram-v2
    [*] --> CURRENT: issued
    CURRENT --> CONSUMED: successful rotation
    CURRENT --> REVOKED: session revoked
    CURRENT --> EXPIRED: token expiry
    CONSUMED --> REPLAY_DETECTED: presented again
    CONSUMED --> [*]: retention cleanup
    REPLAY_DETECTED --> [*]
    REVOKED --> [*]
    EXPIRED --> [*]
```

`REPLAY_DETECTED` is an audit/processing classification for a consumed credential presented again, not a credential that can become valid. Cleanup must preserve sufficient evidence for the intended detection window.

## 9. Proposed persistence schema

```mermaid
erDiagram
    USERS ||--o{ AUTH_SESSIONS : owns
    AUTH_SESSIONS ||--o{ REFRESH_TOKEN_RECORDS : rotates
    AUTH_SESSIONS ||--o{ SECURITY_AUDIT_EVENTS : generates
    USERS {
      uuid id PK
      string account_status
      timestamp password_changed_at
    }
    AUTH_SESSIONS {
      uuid id PK
      uuid user_id FK
      uuid token_family_id
      uuid current_refresh_token_id
      timestamp created_at
      timestamp expires_at
      timestamp revoked_at
      string revocation_reason
      timestamp last_used_at
    }
    REFRESH_TOKEN_RECORDS {
      uuid id PK
      uuid session_id FK
      string token_hash UK
      string status
      timestamp issued_at
      timestamp expires_at
      timestamp consumed_at
      uuid replaced_by_token_id
    }
    SECURITY_AUDIT_EVENTS {
      uuid id PK
      uuid session_id FK
      string event_name
      string event_outcome
      timestamp occurred_at
      jsonb metadata
    }
```

**Persistence requirements:**
- Enforce foreign keys and unique token hashes; token hashes must not reveal the original random credential.
- Use a unique session/token identifier and collision-resistant hash lookup; never store raw refresh tokens.
- Rotation uses one transaction with row locking and a conditional update to ensure a single current token.
- Session expiration is an absolute upper bound; rotation must not silently extend beyond it unless an explicit renewal policy is approved.
- Retention/cleanup for consumed token records and audit events must be documented.
- Audit event schema is governed by SEC-002.4; diagram fields are indicative, not a finalized migration.

## 10. HTTP contract outline

| Operation | Endpoint | Auth / CSRF | Expected behavior |
|---|---|---|---|
| Register | `POST /api/v1/auth/register` | Public; input validation and anti-abuse; registration CSRF policy to be defined | Create customer account |
| CSRF bootstrap | `GET /api/v1/auth/csrf` | Anonymous; allowed Origin and no-store response | Issue bootstrap cookie and anonymous CSRF token |
| Login | `POST /api/v1/auth/login` | Anonymous credentials; allowed Origin, bootstrap cookie and matching CSRF header, rate limit | Consume bootstrap; establish session; return access JWT and session CSRF token; set refresh cookie |
| Refresh | `POST /api/v1/auth/refresh` | Refresh cookie + Origin + CSRF token | Atomic rotation; issue new credentials |
| Logout | `POST /api/v1/auth/logout` | Authenticated session and/or validated refresh-cookie flow; CSRF | Revoke current session; clear cookie |
| Logout all | `POST /api/v1/auth/logout-all` | Valid access JWT + session, CSRF if cookies are used | Revoke all user's sessions |
| Me | `GET /api/v1/auth/me` | Valid access JWT + active session | Return safe profile projection |

Detailed status codes, DTOs, error bodies, cookie Path, CSRF bootstrap, and pre-auth flows belong to ARCH-005 and SEC-002.2. Do not treat this outline as the final OpenAPI contract.

## 11. Failure handling

| Scenario | Required behavior |
|---|---|
| JWT expired/invalid | Reject with 401; no protected operation |
| JWT valid but session revoked | Reject with 401 |
| Session DB unavailable | Fail closed; respond with appropriate service error, never authorize |
| Refresh token unknown/expired | Reject with 401; clear invalid cookie where appropriate |
| Consumed refresh token replayed | Revoke affected session family; audit; require login |
| Two simultaneous refreshes | At most one rotation commits; client single-flight minimizes false replay |
| Network fails after rotation commit | Do not return old token to valid state; require recovery/re-login as policy dictates |
| Missing/invalid CSRF on cookie-authenticated mutation | Reject with 403 before state change |
| Disabled account | Deny protected requests and revoke sessions according to account policy |
| Audit persistence failure for mandatory event | Roll back sensitive state transition when audit must be atomic |

## 12. Security test matrix

| Test ID | Threat | Scenario | Expected result | Tool |
|---|---|---|---|---|
| SEC-AUTH-001 | THR-014 | Revoked session with otherwise valid JWT | Access denied | Supertest |
| SEC-AUTH-002 | THR-014 | Expired or incorrectly signed JWT | 401 | Supertest |
| SEC-AUTH-003 | THR-014 | Wrong issuer, audience, or algorithm | 401 | Vitest + Supertest |
| SEC-AUTH-004 | THR-014 | Two concurrent refreshes | One commit maximum | PostgreSQL integration test |
| SEC-AUTH-005 | THR-014 | Reuse consumed refresh credential | Family revoked, audit emitted | Supertest |
| SEC-AUTH-006 | THR-014 | Logout all devices | All previous sessions denied | Supertest |
| SEC-AUTH-007 | THR-014 | Session registry unavailable | Protected access denied | Integration test |
| SEC-AUTH-008 | THR-014 | Lost refresh response and retry | No silent reuse; documented recovery | Integration test |
| SEC-CSRF-001 | THR-015 | Missing/invalid CSRF token | 403; no mutation | Supertest |
| SEC-CSRF-002 | THR-015 | CSRF token from different session | 403 | Supertest |
| SEC-AUDIT-001 | THR-012 | Logout or replay detection | Durable, redacted event | Integration test |

Use test-only users and tokens. No external service or third-party environment is required.

## 13. Open decisions

1. Signing algorithm and signing-key rotation.
2. Registration CSRF policy and bootstrap consumption behavior after failed credentials (coordinate with SEC-002.2).
3. Deployment topology, cookie Domain/Path and CORS allowlist.
4. Cross-tab refresh coordination and lost-response UX.
5. Exact session/refresh expiry, cleanup and audit retention.
6. Logout semantics when access token has expired but refresh cookie is present.
7. Password reset, account lockout and compromised-credential response.

## 14. Definition of Done

- [ ] Architecture, login, protected request, refresh and revoke diagrams reviewed.
- [ ] Session/token state machines reviewed.
- [ ] Persistence model reviewed with ARCH-004.
- [x] CSRF bootstrap/login dependency aligned with SEC-002.2 (design only).
- [ ] Concurrency, replay and failure cases accepted.
- [ ] Security test matrix approved.
- [ ] Open decisions tracked in project status.

**Status:** Proposed — Awaiting Review. No implementation or security test execution is claimed.
