# Backend Consistency Audit Report

────────────────────────
Issue ID: SEC-01
Title: Admin API Endpoints Exposed Publicly
Severity: Critical
Category: Security Loopholes / Missing Authorization
Module: Security / Admin
Affected Files: 
- `vn/edu/fpt/swp391/g6/rimsapi/config/SecurityConfig.java`
- `vn/edu/fpt/swp391/g6/rimsapi/controller/AdminController.java`
Evidence: 
In `SecurityConfig.java` (Line 52): `.requestMatchers("/rims/admin/**").permitAll()`
In `AdminController.java`: No `@PreAuthorize` or `@Secured` annotations present.
Why it is inconsistent: The system protects Chef, Waiter, and Cashier endpoints but explicitly bypasses all authentication and authorization for the Admin endpoints, which contradictorily have the highest privileges.
Possible Runtime Impact: Unauthorized actors can access all admin features without logging in.
Business Impact: Total system compromise, data breach, and unauthorized user modification.
Root Cause: Incorrect Spring Security configuration path matching (`permitAll()` instead of `hasRole("ADMIN")`).
Recommended Fix: Change `.permitAll()` to `.hasRole("ADMIN")` for the `/rims/admin/**` matcher in `SecurityConfig`.
Dependencies: Spring Security Config.
Regression Risk: Low.
Confidence Level: 100%
────────────────────────

────────────────────────
Issue ID: SEC-02
Title: Insecure Direct Object Reference (IDOR) in Customer Reservation Cancellation
Severity: Critical
Category: Security Loopholes / Missing Authorization
Module: Reservation (Customer)
Affected Files: `vn/edu/fpt/swp391/g6/rimsapi/service/impl/CustomerReservationServiceImpl.java`
Evidence: 
```java
Reservation reservation = reservationRepository.findById(reservationId)...;
reservation.setStatus(ReservationStatus.CANCELLED);
```
Why it is inconsistent: The `cancelReservation` method verifies that the `userId` exists and has *some* active reservation, but it fetches the target `reservationId` directly from the database and cancels it without verifying `reservation.getUser().getId().equals(userId)`.
Possible Runtime Impact: A malicious customer can iterate through IDs and cancel reservations belonging to other users.
Business Impact: Sabotage of restaurant bookings, loss of revenue, and severe customer dissatisfaction.
Root Cause: Missing ownership validation before state mutation.
Recommended Fix: Add a check `if (!reservation.getUser().getId().equals(userId)) throw new AccessDeniedException(...)` before cancelling.
Dependencies: Entity mappings.
Regression Risk: Low.
Confidence Level: 100%
────────────────────────

────────────────────────
Issue ID: DATA-01
Title: Customer Reservation Creation Ignores User Linkage
Severity: High
Category: Entity Lifecycle Inconsistency / Data Integrity Problems
Module: Reservation (Customer)
Affected Files: `vn/edu/fpt/swp391/g6/rimsapi/service/impl/CustomerReservationServiceImpl.java`
Evidence: 
In `createReservation`, `request.getUserId()` is validated for existence, but `reservation.setUser(user)` is never called before `reservationRepository.save(reservation)`.
Why it is inconsistent: The customer creates a reservation through their app, but it is saved anonymously. 
Possible Runtime Impact: `getCurrentReservationByUser` and `cancelReservation` will fail to find the newly created reservation because the `user_id` foreign key is null.
Business Impact: Customers will not be able to see or manage their own reservations via the app.
Root Cause: Missing setter call during the entity instantiation.
Recommended Fix: Fetch the `User` entity by `userId` and set it on the `Reservation` object before saving.
Dependencies: `UserRepository`, `ReservationRepository`.
Regression Risk: Low.
Confidence Level: 100%
────────────────────────

────────────────────────
Issue ID: SEC-03
Title: Hardcoded Dummy Password on Customer Registration
Severity: Critical
Category: Security Loopholes / Contradictory Business Logic
Module: Auth / User
Affected Files: `vn/edu/fpt/swp391/g6/rimsapi/service/impl/UserServiceImpl.java`
Evidence: 
```java
user.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD)); // "123456"
```
Why it is inconsistent: The `CreateCustomerRequest` has a `password` field (validated for min 6 chars), but `UserServiceImpl.register()` completely ignores it and assigns "123456" to every newly registered customer.
Possible Runtime Impact: All new customer accounts are created with a known password.
Business Impact: Massive security breach; attackers can easily hijack newly registered customer accounts.
Root Cause: Developer hardcoded a test variable (`DEFAULT_PASSWORD`) instead of using `request.getPassword()`.
Recommended Fix: Replace `DEFAULT_PASSWORD` with `request.getPassword()` in the `register` method.
Dependencies: Authentication Flow.
Regression Risk: Low.
Confidence Level: 100%
────────────────────────

────────────────────────
Issue ID: BUS-01
Title: Cashier Payment Unconditionally Wipes Out Future Table Reservations
Severity: High
Category: Status Transition Inconsistency / Table Lifecycle
Module: Cashier / Table Management
Affected Files: `vn/edu/fpt/swp391/g6/rimsapi/service/impl/CashierServiceImpl.java`
Evidence: 
In `completeCashPayment` and `processVnPaySuccess`:
```java
table.setStatus(TableStatus.AVAILABLE);
```
Why it is inconsistent: If a table is currently `SERVING` but also has a scheduled reservation marking it as `RESERVED` for an upcoming hour, paying the current bill forcefully reverts the table to `AVAILABLE`, wiping out the `RESERVED` lock.
Possible Runtime Impact: Walk-in customers might be seated at a table that was technically reserved for someone else.
Business Impact: Double booking, waiter confusion, and angry reserved customers.
Root Cause: Hardcoded state transition ignoring queued `Reservation` entities.
Recommended Fix: Before setting to `AVAILABLE`, check if `reservationRepository` has an upcoming `WAITING` or `RESERVED` status for this table, and conditionally set it to `RESERVED`.
Dependencies: Table Status Flow.
Regression Risk: Medium.
Confidence Level: 95%
────────────────────────

────────────────────────
Issue ID: BUS-02
Title: Order Total Calculation Ignores Chef Cancellations
Severity: High
Category: Invoice Flow Inconsistency / Data Integrity Problems
Module: Waiter / Chef / Cashier Flow
Affected Files: 
- `vn/edu/fpt/swp391/g6/rimsapi/service/impl/WaiterServiceImpl.java`
- `vn/edu/fpt/swp391/g6/rimsapi/service/impl/CashierServiceImpl.java`
Evidence: 
`WaiterServiceImpl.updateOrder` calculates `totalAmount` by summing `subTotal` of ALL items (including `CANCELLED`). `CashierServiceImpl` calculates the final payment by dynamically summing only `COMPLETED` items.
Why it is inconsistent: When a chef cancels an item due to running out of stock (`ChefServiceImpl.updateMenuStatus`), the `OrderItem` becomes `CANCELLED`. However, `Order.totalAmount` is never decremented. The Waiter's view of the order total will differ from the Cashier's final invoice.
Possible Runtime Impact: Waiters might quote incorrect totals to customers before they reach the cashier.
Business Impact: Customer disputes over pricing discrepancies.
Root Cause: `ChefService` does not trigger recalculation of `Order.totalAmount` upon cancellation, and `WaiterService` incorrectly sums items regardless of their `OrderItemStatus`.
Recommended Fix: Modify `WaiterServiceImpl.updateOrder` to filter `status != CANCELLED` when calculating the total. Trigger an order total update from `ChefService` when items are cancelled.
Dependencies: Order Total Flow.
Regression Risk: Medium.
Confidence Level: 100%
────────────────────────

────────────────────────
Issue ID: SEC-04
Title: JWT Logout Flow Does Not Invalidate Tokens
Severity: Medium
Category: JWT Flow Inconsistency
Module: Auth
Affected Files: `vn/edu/fpt/swp391/g6/rimsapi/service/impl/AuthServiceImpl.java`
Evidence: 
```java
public LogoutResponse logout() {
    return LogoutResponse.builder().message("Logged out successfully").build();
}
```
Why it is inconsistent: The logout endpoint is called, but neither the refresh token is deleted from a store nor is the access token blacklisted. 
Possible Runtime Impact: Tokens stolen post-logout remain fully functional until their expiry time.
Business Impact: Increased risk of session hijacking.
Root Cause: Incomplete logout implementation (missing token invalidation logic).
Recommended Fix: Implement a token blacklist table or delete the refresh token from the database/Redis upon logout.
Dependencies: JWT Architecture.
Regression Risk: Low.
Confidence Level: 100%
────────────────────────

────────────────────────
Issue ID: CODE-01
Title: Duplicate Validation Annotations on Phone Field
Severity: Low
Category: Duplicate Validation / Merge Leftovers
Module: DTO
Affected Files: `vn/edu/fpt/swp391/g6/rimsapi/dto/request/user/UpdateAccountRequest.java`
Evidence: 
```java
@NotBlank(message = "Số điện thoại không được để trống")
@Pattern(...)
@NotBlank
@Pattern(regexp = "^0[0-9]{9}$")
private String phone;
```
Why it is inconsistent: Annotations are repeated, likely due to a poorly resolved Git merge conflict.
Possible Runtime Impact: Minimal, but pollutes reflection and validation logic.
Business Impact: None directly, indicates code debt.
Root Cause: Merge artifact.
Recommended Fix: Remove the redundant `@NotBlank` and `@Pattern` annotations.
Dependencies: None.
Regression Risk: None.
Confidence Level: 100%
────────────────────────

────────────────────────
Issue ID: PERF-01
Title: N+1 Query Risk and Eager Fetch Cartesian Product
Severity: High
Category: Possible Runtime Failures / Database Consistency
Module: Entity / Waiter
Affected Files: 
- `vn/edu/fpt/swp391/g6/rimsapi/entity/Order.java`
- `vn/edu/fpt/swp391/g6/rimsapi/service/impl/WaiterServiceImpl.java`
Evidence: 
`Order.java` has `@OneToMany(fetch = FetchType.EAGER) private List<OrderItem> orderItems;`.
`OrderItem.java` has `@ManyToOne private Dish dish;` (Eager by default).
`WaiterServiceImpl.updateOrder` uses `orderRepository.findById(id)` inside a loop processing logic.
Why it is inconsistent: `FetchType.EAGER` forces JPA to fetch all order items and their dishes immediately. While the repository tries to optimize with `JOIN FETCH`, implicit lookups will trigger a chain of immediate N+1 queries.
Possible Runtime Impact: Severe database load and memory bloat when querying orders in bulk (e.g., Cashier dashboards).
Business Impact: System sluggishness or OutOfMemory exceptions during peak hours.
Root Cause: Misuse of `FetchType.EAGER` on collections.
Recommended Fix: Change `FetchType.EAGER` to `FetchType.LAZY` on `orderItems`. Use `@EntityGraph` or explicit `JOIN FETCH` when collection initialization is needed.
Dependencies: JPA Repositories.
Regression Risk: High (requires testing lazy initialization exceptions).
Confidence Level: 95%
────────────────────────

────────────────────────
Issue ID: ARCH-01
Title: Controller Bypasses Service Layer
Severity: Medium
Category: Architectural Consistency
Module: Admin Controller
Affected Files: `vn/edu/fpt/swp391/g6/rimsapi/controller/AdminController.java`
Evidence: 
```java
@GetMapping("/tables")
public ResponseEntity<List<TableDetailResponse>> getAllTables() {
    List<RestaurantTable> tables = restaurantTableRepository.findAll();
```
Why it is inconsistent: The controller directly injects `RestaurantTableRepository` instead of using a Service.
Possible Runtime Impact: None directly.
Business Impact: Breaks layered architecture, making business logic testing and transaction boundary management harder.
Root Cause: Developer shortcut.
Recommended Fix: Move `getAllTables` logic to a `RestaurantTableService` and inject the service into the controller.
Dependencies: Table Service.
Regression Risk: Low.
Confidence Level: 100%
────────────────────────

────────────────────────
Issue ID: CODE-02
Title: Duplicate Reservation Conflict Logic
Severity: Medium
Category: Duplicated Business Rules
Module: Reservation
Affected Files: 
- `WaiterServiceImpl.java`
- `CustomerReservationServiceImpl.java`
Evidence: The 150-minute time boundary check (`request.getReservationTime().minusMinutes(150)`) and iterative conflict validation loop are copy-pasted verbatim across three different methods.
Why it is inconsistent: If the restaurant decides to change the turnaround time to 120 minutes, developers must remember to update it in multiple undocumented places.
Possible Runtime Impact: Desynchronized business rules.
Business Impact: Customers might face different booking restrictions depending on who creates the reservation.
Root Cause: Copy-paste programming instead of utilizing a shared validation utility.
Recommended Fix: Extract the time conflict validation into a shared method in a helper/util class or a dedicated domain service.
Dependencies: Reservation validation.
Regression Risk: Low.
Confidence Level: 100%
────────────────────────

────────────────────────
Issue ID: PERF-02
Title: Concurrency Race Conditions on Scheduled Tasks
Severity: Medium
Category: Concurrency Risk
Module: Background Jobs
Affected Files: `vn/edu/fpt/swp391/g6/rimsapi/service/impl/WaiterServiceImpl.java`
Evidence: 
`@Scheduled(fixedRate = 60000)` on `autoUpdateTableStatusToReserved` reads and modifies table status via standard JPA dirty checking.
Why it is inconsistent: If the backend scales horizontally to multiple instances, multiple schedulers will fire simultaneously, causing race conditions and potentially double-assigning tables.
Possible Runtime Impact: Deadlocks or duplicate table assignments.
Business Impact: System instability in scaled environments.
Root Cause: Lack of distributed locking (e.g., ShedLock) or pessimistic database locks.
Recommended Fix: Use `@SchedulerLock` (ShedLock) or apply `@Lock(LockModeType.PESSIMISTIC_WRITE)` on the repository fetch query.
Dependencies: Spring Scheduling.
Regression Risk: Medium.
Confidence Level: 90%
────────────────────────

### 1. Executive Summary
The backend architecture is functional but suffers from critical security flaws, entity mapping negligence, and lifecycle desynchronization. The most alarming issues revolve around the total exposure of the Admin API and severe IDOR vulnerabilities in the customer reservation flow. Additionally, payment logic unconditionally resets table statuses, creating dangerous business logic contradictions.

### 2. Architecture Overview
The system follows a classic Spring Boot layered monolith pattern (Controller → Service → Repository → DB). Authentication is managed via stateless JWTs. It heavily leverages JPA for entity relations and uses WebSockets for real-time Waiter-Kitchen communication.

### 3. Consistency Score (0–100)
**65/100** - While standard CRUD flows are consistent, cross-module interactions (Chef to Waiter to Cashier) break down, specifically regarding total calculations and table lifecycles.

### 4. Security Score
**30/100** - Critical failures exist. `permitAll()` on Admin endpoints, hardcoded passwords during registration, and lack of ownership validation on record deletion (IDOR).

### 5. Business Rule Score
**70/100** - Rules exist (e.g., 2.5 hr reservation gaps) but are duplicated. Cancellation logic fails to propagate financial adjustments correctly.

### 6. Database Score
**75/100** - Good use of JPA auditing, but hindered by `FetchType.EAGER` mapping causing potential N+1 bottlenecks.

### 7. API Score
**85/100** - DTOs are well isolated from Entities. Endpoints are cleanly RESTful, though some controllers bypass services.

### 8. Validation Score
**80/100** - Jakarta validation is effectively utilized across DTOs. Some merge artifacts caused duplicate validation annotations.

### 9. Maintainability Score
**70/100** - High levels of duplicated business rules across distinct services (`WaiterService` vs `CustomerReservationService`).

### 10. Critical Issues
- Admin API Endpoints Exposed Publicly (SEC-01)
- IDOR in Customer Reservation Cancellation (SEC-02)
- Hardcoded Dummy Password on Customer Registration (SEC-03)

### 11. High Priority Issues
- Customer Reservation Creation Ignores User Linkage (DATA-01)
- Cashier Payment Wipes Out Future Table Reservations (BUS-01)
- Order Total Calculation Ignores Chef Cancellations (BUS-02)
- N+1 Query Risk and Eager Fetch Cartesian Product (PERF-01)

### 12. Medium Issues
- JWT Logout Flow Does Not Invalidate Tokens (SEC-04)
- Controller Bypasses Service Layer (ARCH-01)
- Duplicate Reservation Conflict Logic (CODE-02)
- Concurrency Race Conditions on Scheduled Tasks (PERF-02)

### 13. Low Issues
- Duplicate Validation Annotations on Phone Field (CODE-01)

### 14. Duplicate Business Logic
- The 150-minute boundary check for table availability is duplicated across `CustomerReservationServiceImpl` and `WaiterServiceImpl`.

### 15. Dead Code
- No substantial dead code detected, though `updateProfile` in `AdminController` behaves redundantly to `updateAccount` due to the lack of security context checks.

### 16. Unused Components
- None strictly identified within the execution flow.

### 17. Merge Artifacts
- `UpdateAccountRequest.java` contains duplicate `@NotBlank` and `@Pattern` annotations for the `phone` variable.

### 18. Missing Features
- Proper JWT Token Blacklisting upon logout.
- Missing linkage logic assigning Users to Reservations during customer booking.

### 19. Technical Debt
- Direct Controller-to-Repository communication in Admin Table fetch.
- Eager fetching on OneToMany Collections.

### 20. Recommended Fix Order
1. **SEC-01**: Patch SecurityConfig to protect Admin endpoints immediately.
2. **SEC-03**: Fix Customer Registration to use the user-provided password.
3. **SEC-02** & **DATA-01**: Repair the Reservation linkage and add ownership checks to prevent IDOR.
4. **BUS-01**: Fix the Cashier Table Status transition to respect upcoming reservations.
5. **BUS-02**: Synchronize the Order Total logic to handle Chef cancellations dynamically.
6. **PERF-01**: Refactor JPA Fetch types from EAGER to LAZY.
7. **SEC-04**: Implement token invalidation.
8. Refactor duplicated logic and fix minor merge artifacts.
