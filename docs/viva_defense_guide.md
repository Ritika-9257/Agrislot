# AgriSlot - DBMS Project Viva & Technical Defense Guide

This comprehensive defense document is prepared for the external viva evaluation, laboratory assessment, and technical project presentation for the **AgriSlot (APMC Mandi Slot Booking & Logistics Management System)**.

---

## 1. Executive Summary & Problem Formulation

### Q: What core problem does AgriSlot address?
**Model Answer:**
> In traditional Agricultural Produce Market Committees (APMCs), thousands of farmers arrive simultaneously without prior scheduling. This causes 6 to 12-hour vehicle congestion queues outside mandi gates, manual paper token errors, weighbridge tampering disputes, and delay in sale proceeds reaching farmers.
> 
> **AgriSlot** provides an end-to-end digital slot booking, dynamic capacity-managed entry clearance, and automated weighbridge settlement system. It guarantees farmers a deterministic 2-hour arrival window, eliminates yard congestion through automated load-cell tare calculation, and records immutable transaction audit trails in MySQL.

---

## 2. System Architecture & Tech Stack Justification

```
┌────────────────────────────────────────────────────────┐
│                   PRESENTATION TIER                    │
│   Next.js 14 • React Pure JSX • Tailwind Bento Neo    │
└───────────────────────────┬────────────────────────────┘
                            │ REST APIs / JSON
┌───────────────────────────▼────────────────────────────┐
│                    APPLICATION TIER                    │
│  Node.js • Express.js • Zod • JWT • mysql2 Pool       │
└───────────────────────────┬────────────────────────────┘
                            │ Parameterized SQL (ACID)
┌───────────────────────────▼────────────────────────────┐
│                     DATABASE TIER                      │
│   MySQL 8.0 (InnoDB) • Stored Procedures • Triggers   │
│   Cursors • Composite B-Tree Indexes • Audit Logs      │
└────────────────────────────────────────────────────────┘
```

### Q: Why MySQL 8.0 with InnoDB instead of MongoDB or SQLite?
**Model Answer:**
> Mandi slot booking requires **strict ACID compliance** and financial-grade consistency. In APMC logistics, physical capacity (e.g., 50 metric tons per hour) is finite. If two farmers attempt to book the remaining 5 tons simultaneously, a NoSQL eventual consistency model could permit overbooking. InnoDB provides **Pessimistic Row-Level Locking (`SELECT ... FOR UPDATE`)**, atomic multi-statement transactions, and foreign key referential integrity that prevent data anomalies at the engine level.

---

## 3. Database Schema, Normalization & Relational Proof

The database contains 8 core normalized tables:

1. `Mandis`: APMC market locations, operational capacities, districts.
2. `Produce`: Agricultural commodities, categories (Kharif, Rabi, Cash), and standard MSP.
3. `Farmers`: Farmer master data, Aadhaar hash, village, verified contact details.
4. `Slots`: Operating time windows, maximum tonnage capacity, booked tonnage.
5. `Bookings`: Reservations linking farmer, produce, slot, with collision-proof token (`AG-T001`).
6. `Warehouses`: Storage facilities, temperature types (ambient, cold storage, silo).
7. `Traders`: Licensed commission agents and buyers with APMC licenses.
8. `Transactions`: Financial settlement records, sale gross, commission deductions, payout status.

### Q: Prove that the AgriSlot schema satisfies 3rd Normal Form (3NF).
**Model Answer:**
- **1st Normal Form (1NF):** Every column contains atomic (indivisible) scalar values; there are no repeating groups or comma-separated lists. Primary keys are defined for all relations.
- **2nd Normal Form (2NF):** Satisfies 1NF, and all non-key attributes are **fully functionally dependent** on the primary key. For example, in `Bookings`, `Estimated_Weight_Tons` depends entirely on `Booking_ID`, not on any partial key.
- **3rd Normal Form (3NF):** Satisfies 2NF, and there are **no transitive functional dependencies** ($X \rightarrow Y$ where $Y$ is non-prime and $X$ is not a superkey). For example, farmer details (`Name`, `Village`, `Phone`) are stored exclusively in `Farmers` and referenced via foreign key `Farmer_ID` in `Bookings`, rather than duplicated inside `Bookings`.

---

## 4. Concurrency Control & The Oversubscription Prevention Mechanism

### Q: How does AgriSlot prevent race conditions when two farmers book the final remaining slot capacity at the exact same millisecond?
**Model Answer:**
> We use **Pessimistic Concurrency Control** via MySQL InnoDB's `SELECT ... FOR UPDATE` statement within an atomic transaction:

```sql
START TRANSACTION;

-- 1. Acquire exclusive X-Lock on the specific slot row
SELECT Max_Capacity_Tons, Booked_Capacity_Tons 
FROM Slots 
WHERE Slot_ID = p_slot_id 
FOR UPDATE;

-- 2. Verify capacity in memory with locked state
IF (v_booked + p_weight) <= v_max THEN
    -- 3. Update slot capacity
    UPDATE Slots 
    SET Booked_Capacity_Tons = Booked_Capacity_Tons + p_weight 
    WHERE Slot_ID = p_slot_id;

    -- 4. Insert booking record
    INSERT INTO Bookings (Farmer_ID, Slot_ID, Produce_ID, Estimated_Weight_Tons, Token_Number)
    VALUES (p_farmer_id, p_slot_id, p_produce_id, p_weight, v_token);

    COMMIT;
ELSE
    -- 5. Rollback and signal capacity violation
    ROLLBACK;
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Capacity exceeded for selected slot window.';
END IF;
```

**Examiner Follow-up:** What happens to the second concurrent transaction while the first is running?
> The second transaction blocks at the `SELECT ... FOR UPDATE` stage until the first transaction executes `COMMIT` or `ROLLBACK`. When the lock releases, the second transaction reads the newly incremented `Booked_Capacity_Tons` and safely triggers the rejection path.

---

## 5. Advanced SQL / PL-SQL Objects in AgriSlot

### 1. Stored Procedure: `Book_Slot_Atomic`
- **Purpose:** Encapsulates the entire booking lifecycle, pessimistic row lock, token generation, and capacity update inside a single ACID transaction boundary.
- **Benefits:** Minimizes network round-trips between Node.js and MySQL, ensures zero-leak transactions.

### 2. Cursor: `Display_All_Farmers` & `Display_First_Five_Farmers`
- **Purpose:** Demonstrates PL/SQL cursor lifecycle:
  1. `DECLARE cur_farmers CURSOR FOR SELECT Farmer_ID, Name, Phone, Village FROM Farmers;`
  2. `DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;`
  3. `OPEN cur_farmers;`
  4. `FETCH cur_farmers INTO v_id, v_name, v_phone, v_village;` (inside `read_loop: LOOP`)
  5. `CLOSE cur_farmers;`
- **Significance:** Used for sequential batch processing such as generating daily farmer dispatch manifests.

### 3. Triggers: `trg_after_booking_insert` & `trg_before_booking_capacity_check`
- **AFTER INSERT ON Bookings:** Automatically records a tamper-proof audit log row in `application_audit_log` capturing:
  - Event Type: `BOOKING_CREATED`
  - Record ID: `NEW.Booking_ID`
  - Payload JSON: `{"farmer_id": NEW.Farmer_ID, "token": NEW.Token_Number, "weight": NEW.Estimated_Weight_Tons}`
  - Timestamp: `NOW()`
- **BEFORE UPDATE ON Bookings:** Validates state machine rules (e.g., prevent moving from `Completed` back to `Confirmed`).

### 4. Deterministic Stored Function: `Total_Booking_Weight(p_mandi_id, p_date)`
- Computes aggregate tonnage scheduled for a specific Mandi on a given calendar day.
- Returns `DECIMAL(10,2)`.

### 5. Views: `Farmer_Bookings_Detail_View` & `Surat_Mandi_Operations_View`
- **Security & Encapsulation:** Shields underlying table joins (`Bookings` ⋈ `Farmers` ⋈ `Produce` ⋈ `Slots` ⋈ `Mandis`) from client queries.
- Read-only abstraction for fast operator lookup.

---

## 6. Indexing & Query Optimization

### Q: Which indexes did you create and how do they optimize performance?
**Model Answer:**
> We created composite B-Tree indexes based on common query predicates:
> 1. `idx_slots_mandi_date_time ON Slots (Mandi_ID, Slot_Date, Start_Time)`
> 2. `idx_bookings_slot_status ON Bookings (Slot_ID, Booking_Status)`
> 3. `idx_bookings_token ON Bookings (Token_Number)`

**Why Composite Index Order Matters (Leftmost Prefix Rule):**
> In `(Mandi_ID, Slot_Date, Start_Time)`, MySQL can satisfy queries filtering on:
> - `Mandi_ID` alone
> - `Mandi_ID` AND `Slot_Date`
> - `Mandi_ID` AND `Slot_Date` AND `Start_Time`
> But it cannot use the index for queries filtering on `Start_Time` alone. This structure reflects how farmers search for availability: first select Mandi, then select Date, then select Slot.

---

## 7. Security & API Defense

1. **SQL Injection Prevention:**
   All backend queries utilize Node.js `mysql2/promise` with parameterized placeholders (`?`). User inputs are never directly concatenated into raw SQL strings.
2. **Password Security:**
   Administrative and officer passwords are encrypted using `bcrypt` (salt rounds: 10).
3. **Data Integrity Constraints:**
   - Unique Tokens: `UNIQUE KEY uk_token (Token_Number)`
   - Phone Format Check: `CHECK (LENGTH(Phone) = 10)`
   - ENUM Type Constraints: `Booking_Status ENUM('Confirmed', 'Checked-In', 'Completed', 'Cancelled')`
   - Weight Verification: `CHECK (Estimated_Weight_Tons > 0)`

---

## 8. Top 15 Quick-Fire Viva Questions & Model Answers

| # | Question | One-Line Model Answer |
|---|---|---|
| 1 | **What is a candidate key?** | A minimal superkey that can uniquely identify every tuple in a relation (e.g., `Booking_ID` and `Token_Number`). |
| 2 | **What is referential integrity?** | A database constraint ensuring foreign key values correspond to a valid primary key in the parent table or are null. |
| 3 | **What is the difference between TRUNCATE and DELETE?** | `DELETE` is a logged DML operation that triggers rollback and row triggers; `TRUNCATE` is a DDL operation that drops and recreates the table, resetting auto-increments. |
| 4 | **What is SQLSTATE '45000'?** | A standard unhandled user-defined exception code used in MySQL stored procedures to raise custom runtime errors. |
| 5 | **What is the difference between a Stored Procedure and a Function?** | A function must return a scalar value and can be called inside `SELECT` queries; a procedure can return multiple result sets, perform DML, and cannot be used in `SELECT` directly. |
| 6 | **What is an ACID transaction?** | Atomicity (all or nothing), Consistency (preserves schema constraints), Isolation (concurrent executions do not interfere), Durability (committed data survives server crashes). |
| 7 | **What is the phantom read anomaly?** | When a transaction re-reads a range of rows and finds new rows inserted by another concurrent transaction that just committed. |
| 8 | **How does InnoDB avoid dirty reads?** | By implementing Multi-Version Concurrency Control (MVCC) and `READ COMMITTED` or `REPEATABLE READ` snapshot reads. |
| 9 | **What is a B-Tree index?** | A self-balancing search tree data structure that maintains sorted keys for logarithmic $O(\log n)$ search, insert, and range queries. |
| 10 | **Why use `mysql2` connection pooling?** | Reuses existing TCP connections to MySQL instead of creating a new socket handshake per HTTP request, increasing throughput by 400%+. |
| 11 | **What does `EXPLAIN ANALYZE` do?** | Executes the SQL statement and outputs the actual execution time, iterator tree, and row count compared to optimizer estimates. |
| 12 | **What is the purpose of an audit log trigger?** | Provides non-repudiation and forensic tracking of state changes without relying on client-side application logic. |
| 13 | **What is the Leftmost Prefix rule?** | A multi-column composite index can only be used by the optimizer if query filter conditions start with the leftmost column of the index definition. |
| 14 | **How are tokens formatted in AgriSlot?** | Structured format `AG-T` followed by zero-padded sequential digits (e.g., `AG-T001` to `AG-T025`) ensuring human readability and barcode compatibility. |
| 15 | **Can a view be updated in MySQL?** | Yes, if it is an updatable view (references a single base table without `GROUP BY`, `DISTINCT`, aggregate functions, or `UNION`). |

---

---

## 9. Specialized Operational & Usability Features

1. **Vernacular Trilingual Engine (`LanguageContext`):**
   - Implements full state-level multi-language support (English, Hindi, and Gujarati).
   - Instant live translation for clearance desk labels, load-cell metrics, and core farmer services with zero page reloads.
2. **Dual-Channel Gate Pass Transmission (SMS & WhatsApp):**
   - Simulated smartphone notifications emulate the Government of Gujarat APMC SMS header (`VK-APMCGJ`) and WhatsApp Business API.
   - Farmers who cannot carry printed papers can present the mobile SMS or QR screen at Gate 02.
3. **1-Click Database State Maintenance (`/api/v1/admin/reset-database`):**
   - Enables examiners or administrators to restore the entire 8-table schema, re-align the 25+ seed records per table, and reset all booking sequences with a single click during a live demonstration.
4. **Digital Slip Export & Printer Isolation:**
   - Provides instant `.txt` pass slip download and `@media print` thermal slip stylesheet for APMC weighbridge ticket printers.

---

*AgriSlot Engineering & Academic Viva Guide • All Rights Reserved*
