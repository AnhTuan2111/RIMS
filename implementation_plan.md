# RIMS Backend — Implementation Plan

> Derived from the Backend Consistency Audit Report
> Generated: 2026-07-14
> Status: PLANNING — DO NOT MODIFY CODE UNTIL EACH BATCH IS EXPLICITLY APPROVED

---

## Section 1 — Pre-Analysis: Root Cause Clustering

Before grouping into batches, all reported issues were analyzed for shared root causes, file overlaps, and
inter-dependencies.

### 1.1 Shared Root Causes

| Root Cause Group                                              | Issues Belonging |
|---------------------------------------------------------------|------------------|
| Missing/incorrect Spring Security configuration               | SEC-01           |
| Missing ownership/authorization validation in service layer   | SEC-02           |
| Developer left test/placeholder code in production path       | SEC-03           |
| Missing entity relationship setter during construction        | DATA-01          |
| Table lifecycle not cross-checked against Reservation state   | BUS-01           |
| Order total calculation not filtered by item status           | BUS-02           |
| Incomplete JWT lifecycle (no invalidation)                    | SEC-04           |
| Copy-paste duplication of business rule constants             | CODE-02          |
| Merge conflict artifact not cleaned up                        | CODE-01          |
| JPA FetchType.EAGER on collection causing cartesian explosion | PERF-01          |
| Scheduled task without distributed locking                    | PERF-02          |
| Controller bypassing Service layer                            | ARCH-01          |

### 1.2 File Overlap Map

| File                                  | Issues Touching It                   |
|---------------------------------------|--------------------------------------|
| `SecurityConfig.java`                 | SEC-01                               |
| `AdminController.java`                | SEC-01, ARCH-01                      |
| `CustomerReservationServiceImpl.java` | SEC-02, DATA-01, CODE-02             |
| `UserServiceImpl.java`                | SEC-03                               |
| `CashierServiceImpl.java`             | BUS-01, BUS-02                       |
| `WaiterServiceImpl.java`              | BUS-02, CODE-02, PERF-01, PERF-02    |
| `ChefServiceImpl.java`                | BUS-02 (trigger side)                |
| `AuthServiceImpl.java`                | SEC-04                               |
| `Order.java`                          | PERF-01                              |
| `UpdateAccountRequest.java`           | CODE-01                              |
| `ReservationRepository.java`          | BUS-01, CODE-02 (shared query logic) |

### 1.3 Issue Dependency Graph

```
SEC-01  ──────────────────────────────────────────────── (no upstream deps)
SEC-03  ──────────────────────────────────────────────── (no upstream deps)
DATA-01 ──> must precede SEC-02  (IDOR check is meaningless if user is never set)
SEC-02  ──> depends on DATA-01 being fixed first
BUS-01  ──> depends on understanding Reservation state; also impacted by CODE-02 refactor
BUS-02  ──> depends on understanding Order item lifecycle (independent of PERF-01 but should run BEFORE it)
PERF-01 ──> must run AFTER BUS-02 (changing EAGER->LAZY may expose LazyInitializationExceptions in BUS-02 code paths)
CODE-02 ──> must run BEFORE BUS-01 (shared validation helper is needed by BUS-01 cross-check logic)
SEC-04  ──> independent, but should run after auth flows stabilize (after SEC-01, SEC-03)
ARCH-01 ──> independent refactor, no runtime deps
CODE-01 ──> isolated, no deps
PERF-02 ──> depends on PERF-01 (lock granularity on scheduled tasks touching tables is affected by fetch strategy)
```

### 1.4 Conflicting Fixes

| Conflict          | Description                                                                                                                                           | Resolution                                                              |
|-------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| PERF-01 vs BUS-02 | Changing EAGER->LAZY on Order.orderItems may cause LazyInitializationException inside WaiterServiceImpl update-total logic if not done together       | Fix BUS-02 first, then PERF-01 adds @EntityGraph to guard the lazy path |
| BUS-01 vs CODE-02 | BUS-01 requires querying Reservations by table in CashierServiceImpl; the query logic is being consolidated in CODE-02                                | CODE-02 must be done first so BUS-01 can reuse the shared helper        |
| SEC-02 vs DATA-01 | Ownership check in SEC-02 calls reservation.getUser().getId() — if DATA-01 is not fixed, reservation.getUser() is always null -> NullPointerException | DATA-01 must land before SEC-02                                         |

---

## Section 2 — Implementation Batches

---

### BATCH 1 — Immediate Security Hardening (Zero Tolerance)

**Batch ID:** BATCH-1

**Purpose:** Eliminate all critical security vulnerabilities that allow unauthorized access to the system. These are
deployment-blocking issues — the system should not be in production without these fixes.

**Issues Included:**

- SEC-01 — Admin API Exposed Publicly
- SEC-03 — Hardcoded Dummy Password on Registration

**Why these issues belong together:**
Both are zero-code-dependency, zero-regression-risk, single-file fixes. Neither depends on any other issue. Both are
independently verifiable. Grouping them minimizes deployment cycles for critical security patches.

**Affected Modules:** Security Config, Auth/User

**Affected Files:**

- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/config/SecurityConfig.java`
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/impl/UserServiceImpl.java`

**Required Changes:**

#### SEC-01 — SecurityConfig.java

Change:

```java
.requestMatchers("/rims/admin/**").
permitAll()
```

To:

```java
.requestMatchers("/rims/admin/**").
hasRole("ADMIN")
```

#### SEC-03 — UserServiceImpl.java — register() method

Change:

```java
user.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD));
```

To:

```java
user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
```

**Risk Level:** LOW — both changes are surgical 1-line modifications with no cross-file impact.

**Testing Strategy:**

- SEC-01: Attempt GET/POST against any /rims/admin/** endpoint without a Bearer token -> expect 401. Attempt with a
  CUSTOMER token -> expect 403. Attempt with a valid ADMIN token -> expect 200.
- SEC-03: Register a new customer with password "mySecret99" -> attempt login with "mySecret99" (must succeed). Attempt
  login with "123456" (must fail).

**Dependencies on other batches:** None. This batch is fully independent.

**Expected Result:** Admin endpoints are protected. New customer accounts use their chosen password.

---

### BATCH 2 — Reservation Data Integrity and Ownership (SEC-02 + DATA-01)

**Batch ID:** BATCH-2

**Purpose:** Fix the broken customer reservation lifecycle — first ensure the User is correctly linked to a newly
created Reservation (DATA-01), then enforce that only the reservation owner can cancel their own booking (SEC-02). These
two fixes in a single file must land together to avoid an intermediate state where the IDOR check throws a
NullPointerException.

**Issues Included:**

- DATA-01 — Customer Reservation Creation Ignores User Linkage
- SEC-02 — IDOR in Customer Reservation Cancellation

**Why these issues belong together:**
Both touch CustomerReservationServiceImpl.java exclusively. DATA-01 creates the precondition that SEC-02 depends on:
reservation.getUser() can only be compared against the calling user's ID after it has been reliably set. Deploying
SEC-02 without DATA-01 would introduce a NullPointerException crash on every cancellation attempt.

**Affected Modules:** Reservation (Customer)

**Affected Files:**

- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/impl/CustomerReservationServiceImpl.java`

**Required Changes:**

#### DATA-01 — createReservation() method

After fetching/validating the user, add the missing setter:

```java
User user = userRepository.findById(request.getUserId())
        .orElseThrow(...);
// ADD THIS LINE:
        reservation.
setUser(user);
reservationRepository.
save(reservation);
```

#### SEC-02 — cancelReservation() method

After fetching the reservation entity, add the ownership guard:

```java
Reservation reservation = reservationRepository.findById(reservationId)
        .orElseThrow(...);
// ADD THIS BLOCK:
        if(!reservation.
getUser().
getId().
equals(userId)){
        throw new
AccessDeniedException("Ban khong co quyen huy dat ban nay");
}
        reservation.
setStatus(ReservationStatus.CANCELLED);
```

**Risk Level:** LOW for DATA-01 (missing setter, no logic side-effects). LOW for SEC-02 (adds guard, does not change
happy-path logic).

**Testing Strategy:**

- DATA-01: Create a reservation as CustomerA. Fetch reservations for CustomerA — the newly created reservation must
  appear. Before the fix, it would not.
- SEC-02: As CustomerB, attempt to cancel CustomerA's reservationId -> expect 403. As CustomerA, cancel their own
  reservationId -> expect 200.
- Regression: Existing QUEUED/WAITING/RESERVED reservation flow must not be disrupted.

**Dependencies on other batches:** BATCH-1 must be deployed first (Admin and auth endpoints must be secured before
testing reservation access).

**Expected Result:** All new reservations are correctly linked to the creating user. Users cannot cancel reservations
they do not own.

---

### BATCH 3 — Reservation Business Rule Consolidation (CODE-02)

**Batch ID:** BATCH-3

**Purpose:** Extract the duplicated 150-minute time boundary check into a single shared utility, eliminating divergence
risk. This is a pure refactoring batch with no behavior change — it is a prerequisite for BATCH-4 (BUS-01) because the
Cashier table-status post-payment logic will need to query reservations using the same canonical time window constant.

**Issues Included:**

- CODE-02 — Duplicate Reservation Conflict Logic

**Why these issues belong together:**
Single-issue batch. Must precede BATCH-4 to provide the shared helper.

**Affected Modules:** Reservation (Waiter + Customer paths)

**Affected Files:**

- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/impl/WaiterServiceImpl.java`
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/impl/CustomerReservationServiceImpl.java`
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/util/ReservationConflictValidator.java` [NEW FILE]

**Required Changes:**

#### NEW — ReservationConflictValidator.java

Create a @Component utility class with:

```java
public static final int TABLE_TURNAROUND_MINUTES = 150;

public boolean hasConflict(List<Reservation> existingReservations,
                           LocalDateTime requestedTime,
                           Integer excludeReservationId)
{ ...}
```

#### WaiterServiceImpl.java

- Inject ReservationConflictValidator.
- Replace inline time boundary calculation with validator.hasConflict(...).

#### CustomerReservationServiceImpl.java

- Inject ReservationConflictValidator.
- Replace inline time boundary calculation with validator.hasConflict(...).

**Risk Level:** LOW — pure refactoring, behavior must be identical to current logic. No database changes.

**Testing Strategy:**

- Integration test: Create two reservations 140 minutes apart on the same table -> expect conflict error (same as before
  the refactor).
- Create two reservations 160 minutes apart -> expect success.
- Ensure the same behavior holds whether the reservation is created via Waiter endpoint or Customer endpoint.

**Dependencies on other batches:** BATCH-2 must be complete (user linkage must be correct for conflict queries to return
accurate results against real user-linked reservations).

**Expected Result:** A single, canonical source of truth for the 150-minute turnaround window. Changing it in one place
affects all code paths uniformly.

---

### BATCH 4 — Cross-Module Business Logic Correction (BUS-01 + BUS-02)

**Batch ID:** BATCH-4

**Purpose:** Fix the two critical cross-module business logic failures that span the Chef -> Waiter -> Cashier
pipeline: (1) Order totals must exclude cancelled items so Waiter and Cashier see the same amount; (2) Payment
completion must not blindly set the table to AVAILABLE if an upcoming reservation exists.

**Issues Included:**

- BUS-01 — Cashier Payment Wipes Out Future Table Reservations
- BUS-02 — Order Total Calculation Ignores Chef Cancellations

**Why these issues belong together:**
Both issues involve CashierServiceImpl.java and both relate to post-payment state consistency. They share no conflicting
changes within the same method — BUS-02 affects total calculation across WaiterServiceImpl + CashierServiceImpl, while
BUS-01 affects table status reset logic inside CashierServiceImpl. Fixing them together in one PR/batch reduces
integration risk.

**Affected Modules:** Waiter, Chef, Cashier, Table Management

**Affected Files:**

- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/impl/CashierServiceImpl.java`
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/impl/WaiterServiceImpl.java`
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/impl/ChefServiceImpl.java`
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/repository/ReservationRepository.java` (Add query method)

**Required Changes:**

#### BUS-02 — WaiterServiceImpl.java — updateOrder() or total calculation method

Change total calculation to exclude CANCELLED items:

```java
// BEFORE (incorrect):
BigDecimal total = order.getOrderItems().stream()
                .map(OrderItem::getSubTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

// AFTER (correct):
BigDecimal total = order.getOrderItems().stream()
        .filter(item -> item.getStatus() != OrderItemStatus.CANCELLED)
        .map(OrderItem::getSubTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
```

#### BUS-02 — ChefServiceImpl.java — requestCancel() and cancelAllPreparingItemsOfDish()

After saving the cancelled items, trigger an order total recalculation. Inject OrderRepository and reuse the same filter
logic above to update order.setTotalAmount(recalculated).

#### BUS-01 — ReservationRepository.java

Add query:

```java
Optional<Reservation> findFirstByTableAndStatusInAndReservationTimeAfterOrderByReservationTimeAsc(
        RestaurantTable table,
        List<ReservationStatus> statuses,
        LocalDateTime after
);
```

#### BUS-01 — CashierServiceImpl.java — completeCashPayment() and processVnPaySuccess()

Replace the unconditional table status reset:

```java
// BEFORE (incorrect):
table.setStatus(TableStatus.AVAILABLE);

// AFTER (correct):
boolean hasUpcomingReservation = reservationRepository
        .findFirstByTableAndStatusInAndReservationTimeAfterOrderByReservationTimeAsc(
                table,
                List.of(ReservationStatus.WAITING, ReservationStatus.RESERVED),
                LocalDateTime.now()
        ).isPresent();

table.
setStatus(hasUpcomingReservation ?TableStatus.RESERVED:TableStatus.AVAILABLE);
```

**Risk Level:** MEDIUM — touches the payment critical path. Requires thorough end-to-end testing of all payment flows.

**Testing Strategy:**

- BUS-02: Place an order with 3 items. Chef cancels 1. Verify Order.totalAmount equals the sum of the 2 remaining items,
  not 3.
- BUS-02: Verify Cashier invoice total matches Waiter view after cancellation.
- BUS-01: Table with active RESERVED status upcoming -> payment completes -> table must remain RESERVED.
- BUS-01: Table with no upcoming reservations -> payment completes -> table must become AVAILABLE.
- BUS-01: Run both payment flows: Cash (completeCashPayment) and VNPay (processVnPaySuccess).

**Dependencies on other batches:** BATCH-3 must be complete (shared reservation conflict helper is available). PERF-01 (
BATCH-5) must NOT yet be deployed — the EAGER fetch on orderItems is still needed for the BUS-02 total calculation to
work without explicit JOIN FETCH until PERF-01 guards it.

**Expected Result:** The Waiter and Cashier will always display consistent totals. Paying the bill will never destroy an
upcoming reservation lock on a table.

---

### BATCH 5 — JPA Performance Hardening (PERF-01 + PERF-02)

**Batch ID:** BATCH-5

**Purpose:** Fix the systemic JPA performance problems. PERF-01 changes FetchType.EAGER to LAZY on Order.orderItems and
adds explicit @EntityGraph / JOIN FETCH queries where the collection is genuinely needed. PERF-02 adds pessimistic
locking to the scheduled table status updater to prevent race conditions.

**Issues Included:**

- PERF-01 — N+1 Query Risk and Eager Fetch Cartesian Product
- PERF-02 — Concurrency Race Conditions on Scheduled Tasks

**Why these issues belong together:**
Both are performance/reliability issues that touch the persistence and scheduling layers. PERF-02 depends on PERF-01
conceptually because locking granularity decisions are only safe to make after fetch strategy is finalized. They share
no conflicting file changes.

**Affected Modules:** Entity, Waiter, Background Jobs

**Affected Files:**

- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/entity/Order.java`
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/repository/OrderRepository.java`
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/impl/WaiterServiceImpl.java`
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/impl/CashierServiceImpl.java`
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/repository/RestaurantTableRepository.java`

**Required Changes:**

#### PERF-01 — Order.java

Change:

```java

@OneToMany(mappedBy = "order", cascade = CascadeType.ALL,
        orphanRemoval = true, fetch = FetchType.EAGER)
private List<OrderItem> orderItems;
```

To:

```java

@OneToMany(mappedBy = "order", cascade = CascadeType.ALL,
        orphanRemoval = true, fetch = FetchType.LAZY)
private List<OrderItem> orderItems;
```

#### PERF-01 — OrderRepository.java

Add JOIN FETCH query for all callers that need orderItems + dish in a single roundtrip:

```java

@Query("SELECT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.dish WHERE o.id = :id")
Optional<Order> findByIdWithItems(@Param("id") Long id);
```

#### PERF-01 — All Callers

Replace orderRepository.findById(id) with orderRepository.findByIdWithItems(id) in any service method that subsequently
accesses order.getOrderItems().

#### PERF-02 — RestaurantTableRepository.java

Add pessimistic-write query:

```java

@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT t FROM RestaurantTable t WHERE t.id = :id")
Optional<RestaurantTable> findByIdForUpdate(@Param("id") Long id);
```

#### PERF-02 — WaiterServiceImpl.java — scheduled method autoUpdateTableStatusToReserved()

Replace standard findById with findByIdForUpdate inside the scheduled loop to obtain a row-level lock before mutating
status.

**Risk Level:** HIGH — changing FetchType.EAGER to LAZY is a high-risk refactor. Any code path that accesses orderItems
outside a transaction will now throw LazyInitializationException. All call sites must be audited before deployment.

**Testing Strategy:**

- PERF-01: Run integration tests for all endpoints that return order details. Verify no LazyInitializationException
  appears.
- PERF-01: Profile with SQL logging enabled (spring.jpa.show-sql=true) — verify that fetching an order no longer fires N
  separate queries for items.
- PERF-01: Cashier dashboard loading test with 50+ active orders — should complete without OOM.
- PERF-02: Simulate concurrent scheduler triggers (two threads executing autoUpdateTableStatusToReserved
  simultaneously) — verify only one wins the lock and the other waits or skips.

**Dependencies on other batches:** BATCH-4 must be complete. BUS-02 total calculation code paths must already use the
correct filter logic before LAZY fetch is introduced (to avoid regression where LAZY causes the filter stream to fail).

**Expected Result:** Reduced database query count per request. Scheduler race conditions eliminated.

---

### BATCH 6 — Auth Hardening: JWT Token Invalidation (SEC-04)

**Batch ID:** BATCH-6

**Purpose:** Implement proper token lifecycle management. When a user logs out, their refresh token must be invalidated
server-side. This prevents stolen tokens from being usable after logout.

**Issues Included:**

- SEC-04 — JWT Logout Flow Does Not Invalidate Tokens

**Why these issues belong together:**
Single-issue batch. Placed here because it requires a new infrastructure component (token blacklist entity/table or
Redis integration), making it a more involved change than BATCH-1/2/3. It must not block those earlier, more critical
fixes.

**Affected Modules:** Auth

**Affected Files:**

- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/impl/AuthServiceImpl.java`
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/entity/RevokedToken.java` [NEW FILE]
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/repository/RevokedTokenRepository.java` [NEW FILE]
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/security/JwtAuthFilter.java` (Add blacklist check)

**Required Changes:**

#### NEW — RevokedToken.java Entity

```java

@Entity
@Table(name = "revoked_tokens")
public class RevokedToken
{
    @Id
    private String jti; // JWT ID claim
    private LocalDateTime revokedAt;
    private LocalDateTime expiresAt;
}
```

#### NEW — RevokedTokenRepository.java

```java
public interface RevokedTokenRepository extends JpaRepository<RevokedToken, String>
{
    boolean existsByJti(String jti);

    void deleteAllByExpiresAtBefore(LocalDateTime cutoff); // for cleanup
}
```

#### AuthServiceImpl.java — logout() method

Require UserPrincipal in the method signature (to extract jti), then persist to RevokedToken table:

```java
public LogoutResponse logout(UserPrincipal principal, String rawAccessToken)
{
    String jti = jwtService.extractJti(rawAccessToken);
    LocalDateTime exp = jwtService.extractExpiry(rawAccessToken);
    revokedTokenRepository.save(new RevokedToken(jti, LocalDateTime.now(), exp));
    return LogoutResponse.builder().message("Logged out successfully").build();
}
```

#### JwtAuthFilter.java

After token signature validation, add:

```java
String jti = jwtService.extractJti(claims);
if(revokedTokenRepository.
existsByJti(jti)){
        response.
sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token has been revoked");
    return;
            }
```

**Risk Level:** MEDIUM — requires schema migration (new revoked_tokens table). No existing logic is removed, only
extended. However, the filter-chain addition is security-critical and must be tested thoroughly.

**Testing Strategy:**

- Login -> obtain access token -> call GET /rims/auth/me (expect 200) -> logout -> call GET /rims/auth/me with same
  token (expect 401).
- Refresh flow: after logout, attempt to use the old refresh token -> expect 401.
- Load test: verify token blacklist check does not add more than 5ms to average request latency (index on jti column).
- Scheduled cleanup test: confirm expired rows are removed from revoked_tokens on schedule.

**Dependencies on other batches:** BATCH-1 must be complete (admin endpoints must be secured first, otherwise SEC-04 is
redundant for admin paths).

**Expected Result:** Post-logout tokens are rejected immediately. Stolen tokens cannot be reused after the victim logs
out.

---

### BATCH 7 — Architecture Cleanup and Code Quality (ARCH-01 + CODE-01)

**Batch ID:** BATCH-7

**Purpose:** Clean up architectural violations and merge artifacts. These have no runtime impact but affect
maintainability, testability, and code quality scores.

**Issues Included:**

- ARCH-01 — Controller Bypasses Service Layer
- CODE-01 — Duplicate Validation Annotations on Phone Field

**Why these issues belong together:**
Both are purely structural/cleanup changes with zero business logic impact. Neither is a prerequisite for any other
batch. Grouping them at the end prevents them from cluttering higher-priority PRs.

**Affected Modules:** Admin Controller, DTO

**Affected Files:**

- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/controller/AdminController.java`
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/TableService.java` [NEW INTERFACE]
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/impl/TableServiceImpl.java` [NEW FILE]
- `src/main/java/vn/edu/fpt/swp391/g6/rimsapi/dto/request/user/UpdateAccountRequest.java`

**Required Changes:**

#### ARCH-01 — New TableService.java Interface and TableServiceImpl.java

Move getAllTables logic from AdminController into the service layer:

```java
public interface TableService
{
    List<TableDetailResponse> getAllTables();
}
```

#### ARCH-01 — AdminController.java

Remove direct RestaurantTableRepository injection. Replace:

```java

@Autowired
RestaurantTableRepository restaurantTableRepository;
// ...
List<RestaurantTable> tables = restaurantTableRepository.findAll();
```

With:

```java

@Autowired
TableService tableService;
// ...
return ResponseEntity.
ok(tableService.getAllTables());
```

#### CODE-01 — UpdateAccountRequest.java

Remove the two duplicate annotations from the phone field:

```java
// REMOVE these redundant duplicate lines:
@NotBlank
@Pattern(regexp = "^0[0-9]{9}$")
// Keep only the annotated versions with full message attributes.
```

**Risk Level:** LOW — no logic changes, only structural reorganization.

**Testing Strategy:**

- ARCH-01: Call GET /rims/admin/tables — expect same response as before. Run all admin integration tests.
- CODE-01: Submit a user update request with an invalid phone number -> expect validation error (must still work
  identically).

**Dependencies on other batches:** BATCH-1 (Admin endpoints must be secured before testing admin API behavior
meaningfully). All other batches are independent.

**Expected Result:** Admin controller no longer directly accesses repositories. Phone field has clean, non-duplicated
validation annotations.

---

## Section 3 — Implementation Order (Sequential Execution Roadmap)

```
BATCH-1  -->  BATCH-2  -->  BATCH-3  -->  BATCH-4  -->  BATCH-5  -->  BATCH-6  -->  BATCH-7
 (Crit)        (High)        (Medium)       (High)        (High)         (Medium)       (Low)
```

| Step | Batch   | Issues           | Estimated Complexity                       | Regression Risk |
|------|---------|------------------|--------------------------------------------|-----------------|
| 1    | BATCH-1 | SEC-01, SEC-03   | XS (2 lines total)                         | LOW             |
| 2    | BATCH-2 | DATA-01, SEC-02  | S (1 setter + 1 guard block)               | LOW             |
| 3    | BATCH-3 | CODE-02          | M (new utility class + 2 refactors)        | LOW             |
| 4    | BATCH-4 | BUS-01, BUS-02   | L (cross-service logic + new repo query)   | MEDIUM          |
| 5    | BATCH-5 | PERF-01, PERF-02 | XL (entity change + all callers + lock)    | HIGH            |
| 6    | BATCH-6 | SEC-04           | L (new entity + new table + filter change) | MEDIUM          |
| 7    | BATCH-7 | ARCH-01, CODE-01 | M (new service layer + annotation cleanup) | LOW             |

---

## Section 4 — Cross-Cutting Concerns

### 4.1 Files Most Frequently Modified

| File                                  | Batches Touching It                   | Notes                                                                        |
|---------------------------------------|---------------------------------------|------------------------------------------------------------------------------|
| `CashierServiceImpl.java`             | BATCH-4, BATCH-5                      | Highest change density. PRs must be sequenced, never merged in parallel.     |
| `WaiterServiceImpl.java`              | BATCH-3, BATCH-4, BATCH-5             | Three separate batches. Each must be fully merged and tested before next.    |
| `CustomerReservationServiceImpl.java` | BATCH-2, BATCH-3                      | BATCH-2 precedes BATCH-3.                                                    |
| `AdminController.java`                | BATCH-1 (indirect: security), BATCH-7 | Low merge conflict risk if batches are sequential.                           |
| `ReservationRepository.java`          | BATCH-3, BATCH-4                      | Shared query surface. Queries added in BATCH-3 must be preserved in BATCH-4. |
| `OrderRepository.java`                | BATCH-5                               | New query added — must not break existing callers.                           |
| `JwtAuthFilter.java`                  | BATCH-6                               | Security-critical file. Any mistake causes all requests to be rejected.      |

### 4.2 Potential Merge Conflicts

| Conflict Risk | Files                                 | Situation                                                                                                            |
|---------------|---------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| HIGH          | `WaiterServiceImpl.java`              | BATCH-3 (CODE-02 refactor) and BATCH-4 (BUS-02 total fix) both modify the same service. Must be strictly sequential. |
| HIGH          | `CashierServiceImpl.java`             | BATCH-4 modifies completeCashPayment and processVnPaySuccess. BATCH-5 adds JOIN FETCH callers. Must be sequential.   |
| MEDIUM        | `CustomerReservationServiceImpl.java` | BATCH-2 and BATCH-3 both modify this file. Must be strictly sequential.                                              |
| LOW           | `ReservationRepository.java`          | Additive-only changes across BATCH-3 and BATCH-4. Low risk if queries are named distinctly.                          |
| LOW           | `AuthServiceImpl.java`                | BATCH-6 only. No other batch touches it.                                                                             |

### 4.3 Estimated Complexity Summary

| Complexity            | Batches                                      |
|-----------------------|----------------------------------------------|
| XS (less than 1 hour) | BATCH-1                                      |
| S (1-3 hours)         | BATCH-2                                      |
| M (3-6 hours)         | BATCH-3, BATCH-7                             |
| L (6-12 hours)        | BATCH-4, BATCH-6                             |
| XL (12-20 hours)      | BATCH-5                                      |
| **Total Estimate**    | **~45-55 hours of implementation + testing** |

### 4.4 Testing Priority

| Priority | Batch   | Reason                                                                                      |
|----------|---------|---------------------------------------------------------------------------------------------|
| P0       | BATCH-1 | Security — must not regress. Admin lockout and login regression are catastrophic.           |
| P0       | BATCH-6 | Security — token blacklist filter touches every authenticated request.                      |
| P1       | BATCH-2 | Data integrity — reservation ownership is a core business invariant.                        |
| P1       | BATCH-4 | Business critical — payment flow and order total are revenue-impacting.                     |
| P2       | BATCH-5 | Performance — High regression risk due to LAZY fetch. Full integration test suite required. |
| P3       | BATCH-3 | Pure refactor — verify behavior parity with unit tests.                                     |
| P3       | BATCH-7 | Architecture — regression is nearly impossible; verify API contracts.                       |

---

## Section 5 — Execution Guardrails for the Implementing Agent

These rules MUST be followed by any AI agent executing this plan.

1. **Sequential only.** Do not start BATCH-N+1 before BATCH-N has been implemented, compiled, and tested.

2. **No file should be modified by two batches in parallel.** If concurrent work is needed, split files and serialize
   the final merge.

3. **BATCH-5 (PERF-01) is the highest regression risk** in the entire plan. Before deploying BATCH-5, run the full
   integration test suite from BATCH-4 first, with spring.jpa.show-sql=true enabled.

4. **BATCH-6 changes JwtAuthFilter.java**, a security-critical filter in the Spring Security filter chain. Any error in
   this file causes all authenticated requests to fail. Test this batch in an isolated environment before merging.

5. **Do not optimize BATCH-7** by merging it with any other batch. It is deliberately last to avoid cluttering critical
   security PRs with low-risk cosmetic changes.

6. **For BATCH-4 (BUS-01):** The ReservationStatus enum values referenced in the query (WAITING, RESERVED) must be
   verified against the actual enum definition before writing the repository query.

7. **Never remove DEFAULT_PASSWORD constant** from UserServiceImpl.java without confirming it is not used in any other
   method (notably createCustomer() which is the admin path for customer creation). The fix is in register() only.

8. **The @Transactional annotation** must be verified present on every method that touches the RevokedToken repository
   in BATCH-6 to avoid partial writes.

9. **Schema migration (BATCH-6)** requires a Flyway or Liquibase migration script for the revoked_tokens table. Do not
   rely on spring.jpa.hibernate.ddl-auto=update in production.

10. **After BATCH-5**, re-run all Cashier, Waiter, and Chef endpoint tests and compare response payloads to a baseline
    captured before BATCH-5 to detect any data shape changes from the fetch strategy overhaul.

---

## Section 6 — Final Score Projection After Full Plan Execution

| Dimension             | Before | After (Projected) |
|-----------------------|--------|-------------------|
| Consistency Score     | 65/100 | 90/100            |
| Security Score        | 30/100 | 88/100            |
| Business Rule Score   | 70/100 | 92/100            |
| Database Score        | 75/100 | 93/100            |
| API Score             | 85/100 | 93/100            |
| Validation Score      | 80/100 | 95/100            |
| Maintainability Score | 70/100 | 90/100            |
