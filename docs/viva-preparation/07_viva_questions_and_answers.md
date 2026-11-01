# 07. Comprehensive Viva Questions & Model Answers (35 Q&A)

This document contains 35 targeted questions that professors and external viva examiners frequently ask during college DBMS project evaluations, accompanied by concise answers based on the AgriSlot codebase.

---

## Category A: Project Overview & APMC Domain

### Q1: What is AgriSlot and what core problem does it solve?
**Answer:** AgriSlot is a MySQL-driven slot booking and gate management system for state-regulated APMC Mandis (agricultural market yards). It solves unpredictable traffic congestion, uncoordinated farmer arrivals, and manual paperwork bottlenecks by discretizing mandi operating hours into capacity-enforced 20-minute arrival windows with verified gate tokens.

### Q2: What are the three user roles in your application?
**Answer:**
1. **Farmer:** Registers, checks live slot availability (green/red), books arrival slots, receives unique gate passes (`AG-T001`), and cancels bookings.
2. **Mandi Officer:** Operates the gate terminal, verifies tokens, performs weighbridge check-in, monitors active in-yard vehicles, and records completed deliveries. Strictly barred from administrative operations.
3. **Admin:** Monitors yard-wide capacity, manages user roles (RBAC: promote/demote accounts), inspects audit trails, and analyzes DBMS query telemetry.

### Q3: Why did you eliminate truck tracking and OCR simulations from the project?
**Answer:** To prioritize **relational database integrity, ACID transactions, and clean normalization** over superficial mock features. An APMC Mandi primarily manages physical slot capacity and commodity delivery batches, not long-haul freight tracking.

### Q4: Why are time slots 20 minutes long and why is 1:00 PM – 2:00 PM excluded?
**Answer:** APMC Mandi weighbridges and unloading docks have an average throughput of 50 metric tons every 20 minutes. The 1:00 PM to 2:00 PM window is excluded from booking because it represents the mandatory daily yard lunch and equipment calibration break.

### Q5: How is a booking token formatted?
**Answer:** Every booking receives a unique alphanumeric token formatted as `AG-T` followed by a sequence or hexadecimal randomizer (e.g., `AG-T001`, `AG-T87B32F`). It has a `UNIQUE` constraint in the `Bookings` table.

---

## Category B: Relational Design, Normalization & Schema

### Q6: What normal form is your database in? Prove it.
**Answer:** The database is in **Third Normal Form (3NF)**:
- **1NF:** All column values are atomic (no repeating groups, no delimited strings).
- **2NF:** It is in 1NF, and all non-key attributes are fully functionally dependent on primary keys (e.g., in `Bookings`, `Estimated_Weight_Tons` depends on `Booking_ID`, not a partial composite key).
- **3NF:** It is in 2NF, and there are no transitive dependencies ($X \rightarrow Y \rightarrow Z$). For example, `District` is stored only in `Mandis`, not in `Slots` or `Bookings`.

### Q7: Why do you have separate `Farmers` and `User_Login` tables?
**Answer:** To enforce a clean separation of concerns:
- `User_Login` manages authentication credentials (username, password hash, role, OAuth Google Subject ID).
- `Farmers` stores domain demographic information (Aadhaar number, phone number, village, UPI VPA).
- A 1:1 foreign key (`User_Login.Farmer_ID = Farmers.Farmer_ID`) connects them. This prevents authentication data from polluting the physical farmer registry.

### Q8: What is a surrogate key and where did you use one?
**Answer:** A surrogate key is an artificial, system-generated primary key without business meaning (usually `AUTO_INCREMENT INT`). We used surrogate keys (`Mandi_ID`, `Slot_ID`, `Booking_ID`, `Farmer_ID`) because natural keys like phone number or Aadhaar could change or be subject to privacy masking.

### Q9: What happens to slots if a mandi is deleted?
**Answer:** The foreign key constraint `fk_slots_mandi` uses `ON DELETE CASCADE`. If a Mandi is removed, MySQL automatically deletes all associated slots, preventing orphaned records.

### Q10: What happens to a user login if the farmer record is deleted?
**Answer:** The constraint `fk_user_farmer` uses `ON DELETE SET NULL`. The user's account remains functional, but `Farmer_ID` is set to `NULL`, preventing user login failure.

### Q11: What is a generated column and where did you use it?
**Answer:** In the `Transactions` table, `Total_Amount` is defined as:
```sql
Total_Amount DECIMAL(12,2) GENERATED ALWAYS AS (Actual_Weight * Price_Per_Ton) STORED
```
The database calculates and stores it on disk, preventing calculation mismatches and allowing B-Tree indexing.

### Q12: How do you enforce data integrity at the database level without relying on backend code?
**Answer:**
1. `PRIMARY KEY` and `UNIQUE` constraints (`Phone`, `Aadhar_No`, `Token_Number`).
2. `FOREIGN KEY` constraints with referential actions.
3. `CHECK` constraints (`Max_Capacity_Tons > 0`, `Booked_Capacity_Tons <= Max_Capacity_Tons`, `Estimated_Weight_Tons > 0`, `End_Time > Start_Time`).
4. `NOT NULL` constraints on mandatory operational fields.

---

## Category C: Transactions, ACID & Concurrency Control

### Q13: What are the ACID properties and how are they implemented?
**Answer:**
- **Atomicity:** Wrapped in `connection.beginTransaction()` and `connection.rollback()`.
- **Consistency:** Database check constraints prevent invalid states.
- **Isolation:** Pessimistic row locking (`SELECT ... FOR UPDATE`) prevents dirty reads and lost updates.
- **Durability:** MySQL InnoDB redo log (WAL) commits data permanently to non-volatile disk.

### Q14: How does AgriSlot prevent overbooking when two farmers book the last available slot simultaneously?
**Answer:** Using pessimistic concurrency control. The backend runs:
```sql
SELECT * FROM Slots WHERE Slot_ID = ? FOR UPDATE;
```
This acquires an Exclusive Lock (X-Lock) on that slot row. The second transaction must wait until the first transaction commits. When the second transaction unblocks, it reads the updated booked capacity, detects insufficient remaining capacity, rolls back, and returns HTTP 409 Conflict.

### Q15: What is the difference between optimistic and pessimistic locking? Why choose pessimistic?
**Answer:**
- **Optimistic Locking:** Checks a version column at update time. If modified, the transaction fails and retries.
- **Pestic Locking:** Locks the record immediately on read (`FOR UPDATE`).
- **Why Pessimistic:** In high-contention scenarios like slot opening at 9:00 AM, hundreds of farmers compete for the same 20-minute window. Optimistic locking causes massive retry storms; pessimistic locking serializes the queue fairly and eliminates retries.

### Q16: How does cancellation work without causing capacity leaks?
**Answer:** Cancellation runs in an isolated transaction:
1. Locks the booking row (`FOR UPDATE`) to verify its status is `Confirmed`.
2. Sets `Booking_Status = 'Cancelled'`.
3. Decrements `Slots.Booked_Capacity_Tons` by `Estimated_Weight_Tons` using `GREATEST(0.00, Booked_Capacity_Tons - ?)`.
4. Commits both statements atomically. If either fails, neither executes.

### Q17: What transaction isolation level does MySQL InnoDB use by default?
**Answer:** `REPEATABLE READ`. It uses multi-version concurrency control (MVCC) and Next-Key Locks (gap locks + record locks) to prevent dirty reads, non-repeatable reads, and phantom reads.

### Q18: What is a deadlock and how can it occur in a booking system?
**Answer:** A deadlock occurs when Transaction 1 holds a lock on Record A and waits for Record B, while Transaction 2 holds a lock on Record B and waits for Record A. We prevent deadlocks in AgriSlot by always acquiring locks in a strict alphabetical table hierarchy: first `Slots`, then `Bookings`.

---

## Category D: Advanced SQL (Procedures, Cursors, Functions & Triggers)

### Q19: What is the difference between a Stored Procedure and a Stored Function?
**Answer:**
- **Stored Procedure:** Can execute DML (`INSERT`, `UPDATE`, `DELETE`), return multiple result sets, accept `IN`, `OUT`, and `INOUT` parameters, and is invoked with `CALL ProcedureName()`.
- **Stored Function:** Must return a single scalar value via `RETURN`, cannot perform transaction management (`COMMIT`/`ROLLBACK`), and is invoked inline within SQL statements (e.g., `SELECT Total_Booking_Weight();`).

### Q20: What is a Cursor and when do you use it?
**Answer:** A cursor is a database pointer that allows row-by-row navigation through a query result set. In `Display_First_Five_Farmers()`, we declare a cursor, open it, loop through records with `FETCH`, check `CONTINUE HANDLER FOR NOT FOUND`, and explicitly `CLOSE` it.

### Q21: What is a Trigger and what triggers are active in AgriSlot?
**Answer:** A trigger is a stored program that executes automatically in response to an `INSERT`, `UPDATE`, or `DELETE` event on a table. In AgriSlot:
- `Audit_Farmer_Update`: Automatically logs previous and new values into `application_audit_log` as JSON.
- `Audit_Farmer_Delete`: Logs deleted farmer records for forensic compliance.
- `Uppercase_Farmer_Insert`: Normalizes farmer names to uppercase before storing.

### Q22: What are `NEW` and `OLD` in triggers?
**Answer:**
- `OLD`: References the existing column values before an `UPDATE` or `DELETE`.
- `NEW`: References the incoming column values during an `INSERT` or `UPDATE`.

### Q23: Why store audit logs in JSON format?
**Answer:** The `Old_Data` and `New_Data` columns in `application_audit_log` use MySQL's native `JSON` datatype. This provides a schema-agnostic audit trail capable of storing changes from any table without requiring separate audit tables.

### Q24: What is the purpose of `DETERMINISTIC` in stored functions?
**Answer:** It informs the MySQL query optimizer that the function will always produce the same output for the same input parameters, enabling execution plan caching.

### Q25: Can a trigger invoke a stored procedure?
**Answer:** Yes, but with restrictions: the invoked procedure cannot execute transaction control statements (`START TRANSACTION`, `COMMIT`, `ROLLBACK`) or dynamic SQL.

---

## Category E: Views, Indexing & Query Optimization

### Q26: What is a Relational View and why use it?
**Answer:** A view is a virtual table defined by an underlying SQL query. It does not store physical data (unless materialized). Benefits:
1. **Security:** Exposes only required columns to users (e.g., hiding Aadhaar numbers).
2. **Simplicity:** Encapsulates complex 5-way joins into simple `SELECT * FROM ViewName` calls.

### Q27: What views exist in AgriSlot?
**Answer:**
1. `Farmer_Bookings_Detail_View`: Joins `Bookings`, `Farmers`, `Produce`, `Slots`, and `Mandis`.
2. `Surat_Mandi_Operations_View`: Pre-filters operational metrics specifically for APMC Surat market yard.

### Q28: What is a B-Tree Index and how does it speed up queries?
**Answer:** A balanced tree (B-Tree) index maintains sorted column keys with pointers to physical disk pages, reducing search complexity from $O(N)$ (full table scan) to $O(\log N)$.
- We created `idx_slots_mandi_date` on `(Mandi_ID, Slot_Date)`.

### Q29: What is `EXPLAIN` in MySQL and what did it reveal?
**Answer:** `EXPLAIN` displays the query execution plan generated by the optimizer. When running `EXPLAIN SELECT * FROM Slots WHERE Mandi_ID = 1 AND Slot_Date = '2026-11-01'`:
- `type` changed from `ALL` (full table scan) to `ref` (index lookup).
- `rows` examined dropped from 214 to 18, reducing latency by over 95%.

### Q30: What is a Composite Index and why is column order important?
**Answer:** A composite index indexes multiple columns (e.g., `(Mandi_ID, Slot_Date)`). Column order matters due to the **Leftmost Prefix Rule**: the index can satisfy queries filtering on `Mandi_ID` alone or `(Mandi_ID, Slot_Date)`, but not `Slot_Date` alone.

---

## Category F: Security, RBAC & Full-Stack Integration

### Q31: How do you prevent SQL Injection?
**Answer:** By exclusively using **Parameterized Prepared Statements** via `mysql2/promise`:
```javascript
await connection.query('SELECT * FROM Slots WHERE Slot_ID = ?', [slotId]);
```
The database driver sends the query template and values in separate network packets; the MySQL parser never treats user input as executable SQL syntax.

### Q32: How is Role-Based Access Control (RBAC) enforced?
**Answer:** AgriSlot implements a three-tier RBAC architecture:
1. `User_Login.User_Role` ENUM: `'Admin'`, `'Mandi_Officer'`, `'Trader'`, `'Farmer'`.
2. Express Middleware: `authenticateToken` extracts JWT, and `requireActiveRole('Admin')` queries the live database to confirm permissions.
3. Protected endpoints return `403 FORBIDDEN` if an unauthorized role attempts access.

### Q33: How do you protect against stale JWT role tampering?
**Answer:** In `requireActiveRole`, we do not blindly trust the role string embedded inside the JWT payload. The middleware performs a live database query against `User_Login` on each privileged request. If an admin demoted a user 5 seconds ago, their next request fails immediately.

### Q34: How is sensitive farmer data (PII) protected?
**Answer:**
1. Aadhaar numbers are masked on the frontend (e.g., `XXXXXXXX1234`).
2. Passwords are never stored in plaintext; they are hashed using `bcrypt` with 10 salt rounds.
3. The API never returns password hashes or full Aadhaar numbers in response payloads.

### Q35: What database connection pooling strategy do you use?
**Answer:** We configure a connection pool with `connectionLimit: 10` using `mysql2/promise`. Instead of opening and closing an expensive TCP connection on every HTTP request, connections are borrowed from the pool and released back upon completion, supporting hundreds of concurrent requests with low latency.
