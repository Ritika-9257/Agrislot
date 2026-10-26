# AgriSlot - DBMS Project Presentation Slide Deck

This markdown slide deck can be used directly for presentation slides or read during your viva defense.

---

## Slide 1: Title & Project Overview

# AgriSlot
### APMC Mandi Slot Booking & Logistics Management Platform

- **Domain:** Agricultural Produce Market Committee (APMC) Logistics & DBMS
- **Core Goal:** Eliminate mandi yard overcrowding, traffic bottlenecks, and manual weighbridge fraud using automated slot scheduling and ACID-compliant transaction controls.
- **Tech Stack:**
  - **Database:** MySQL 8.0 (InnoDB) with Stored Procedures, Triggers, Cursors, and Composite B-Tree Indexes.
  - **Backend:** Node.js, Express.js, `mysql2/promise` connection pooling, JWT, Zod.
  - **Frontend:** Next.js 14, React Pure JSX, Tailwind CSS Neo-Bento Design.

---

## Slide 2: The Core Problem in Traditional APMCs

### Problems in Existing Mandis:
1. **Uncontrolled Vehicle Influx:** Thousands of trucks arrive at dawn, causing 6–12 hour gridlocks.
2. **Weighbridge Disputes:** Manual paper weigh slips lead to weight discrepancy conflicts.
3. **Delayed Settlements:** Sale proceeds pass through multiple middlemen before reaching farmers.
4. **Data Fragmentation:** Lack of audit trails and real-time capacity tracking.

### AgriSlot's Solution:
- **Deterministic 2-Hour Inbound Windows:** Farmers reserve capacity online before departure.
- **Collision-Proof Gate Tokens:** Unique sequential QR passes (`AG-T001` to `AG-T025`).
- **Real-Time Electronic Load-Cell Clearance:** Automated gross and tare weight calculations.
- **Direct UPI Financial Settlements:** Revenue disbursed directly to registered farmer accounts.

---

## Slide 3: System Architecture

```
┌────────────────────────────────────────────────────────┐
│             PRESENTATION LAYER (Next.js 14)            │
│  Clearance Rig • Farmer Portal • Admin Desk • Tel. Lab │
└───────────────────────────┬────────────────────────────┘
                            │ REST APIs / JSON (Port 5001)
┌───────────────────────────▼────────────────────────────┐
│              APPLICATION LAYER (Express.js)            │
│  Zod Validation • JWT Auth • Error Envelopes • Pool    │
└───────────────────────────┬────────────────────────────┘
                            │ Parameterized SQL
┌───────────────────────────▼────────────────────────────┐
│               DATABASE LAYER (MySQL 8 InnoDB)          │
│  8 Relations • Row Locking • Triggers • Views • XML    │
└────────────────────────────────────────────────────────┘
```

---

## Slide 4: Relational Schema & 3NF Normalization

### 8 Normalized Relations:
1. `Mandis`: Market locations and daily handling capacities.
2. `Produce`: Crop catalog, seasons, and MSP benchmark prices.
3. `Farmers`: Verified producer master data, masked Aadhaar, and UPI IDs.
4. `Slots`: Operating time windows and real-time tonnage capacity.
5. `Bookings`: Reservations linking farmer, produce, slot, and gate-pass token.
6. `Warehouses`: Storage depots, temperature ratings (ambient vs cold).
7. `Traders`: APMC-licensed buyers and commission agents.
8. `Transactions`: Financial receipts, auction prices, and payout statuses.

### Normalization Highlights:
- **1NF:** All attributes are atomic scalars; primary keys defined.
- **2NF:** Zero partial key dependencies; all non-key fields depend on full primary keys.
- **3NF:** Zero transitive dependencies ($X \rightarrow Y$ eliminated by separation into reference tables).

---

## Slide 5: Concurrency Control & Row-Level Locking

### The Race Condition Challenge:
- Multiple farmers attempt to book the final remaining 5 Tons in a slot simultaneously.

### The AgriSlot Defense:
```sql
START TRANSACTION;

-- Exclusive pessimistic lock on target slot row
SELECT Max_Capacity_Tons, Booked_Capacity_Tons 
FROM Slots WHERE Slot_ID = ? FOR UPDATE;

-- Verify capacity within locked boundary
IF (Booked_Capacity_Tons + Requested_Weight <= Max_Capacity_Tons) THEN
    UPDATE Slots SET Booked_Capacity_Tons = Booked_Capacity_Tons + ? WHERE Slot_ID = ?;
    INSERT INTO Bookings (...) VALUES (...);
    COMMIT;
ELSE
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Capacity exceeded.';
END IF;
```

---

## Slide 6: Database Automation (PL/SQL)

### 1. Stored Procedures:
- `Book_Slot_Atomic`: Complete transaction lifecycle inside the database engine.
- `Process_Checkin_Transaction`: Atomic gate check-in and yard status transition.

### 2. Cursors:
- `Display_All_Farmers`: Demonstrates cursor declaration, `OPEN`, `FETCH`, `NOT FOUND` handler, and clean closure for daily dispatch manifests.

### 3. Triggers:
- `trg_after_booking_insert`: Immutable audit logging into `application_audit_log` with JSON payload and user IP.
- `trg_before_booking_update`: State-machine constraint validation.

### 4. Stored Functions:
- `Total_Booking_Weight(mandi_id, date)`: Deterministic aggregate tonnage calculation.

---

## Slide 7: Query Benchmarking & Optimization

### Composite B-Tree Indexes:
1. `idx_slots_mandi_date_time (Mandi_ID, Slot_Date, Start_Time)`
2. `idx_bookings_slot_status (Slot_ID, Booking_Status)`
3. `idx_bookings_token (Token_Number)`

### Leftmost Prefix Optimization:
- Evaluates search predicates in optimal hierarchical order: Mandi $\rightarrow$ Date $\rightarrow$ Slot Window.
- Tested using `EXPLAIN ANALYZE` with millisecond execution timers in the web analytics console.

---

## Slide 8: Key Frontend Innovations

1. **Pop-up Authentication (`AuthModal.jsx`):**
   - Blurred backdrop (`backdrop-blur-md`) with 1-click Google login, mobile/passcode, demo profiles, and instant farmer signup without separate page navigation.
2. **Vernacular Trilingual Engine (`LanguageContext.jsx`):**
   - Instant live language toggle between **English**, **हिन्दी**, and **ગુજરાતી**.
3. **Dual-Channel Gate Pass (`GatePassModal.jsx` & `SmsNotificationModal.jsx`):**
   - Thermal printable ticket (`@media print`) and simulated Government APMC SMS (`VK-APMCGJ`) notification.
4. **Interactive 6-Bay Mandi Yard Map (`page.jsx`):**
   - Real-time dock allocation for 6 unloading ramps with turnaround countdowns.
5. **Concurrency Lab (`analytics/page.jsx`):**
   - Interactive dual-thread simulation demonstrating `SELECT ... FOR UPDATE` row locks in real time.

---

## Slide 9: Verification, Testing & Robustness

- **Automated Test Suite:** 18 automated unit and mock tests (`npm test`):
  - Concurrency race conditions
  - Gate-pass token collision resistance
  - PII privacy masking (Aadhaar & UPI)
  - Input validation (Zod schemas)
  - Status transition state machines
- **Pre-Flight Diagnostic Tool:** `scripts/verify_system.js`:
  - Zero-dependency health check verifying 25+ seed records per table, procedures, views, and triggers in under 1 second.
- **Unified Launcher:** `start_agrislot.sh`:
  - Starts backend on port 5001, frontend on port 3000, opens browser, and handles clean `CTRL+C` termination.

---

## Slide 10: Conclusion & Practical Impact

- **Operational Efficiency:** Reduces mandi congestion and wait times from 8 hours to under 20 minutes.
- **Financial Transparency:** Real-time weighbridge load cells eliminate weight fraud; direct UPI payouts eliminate middleman deductions.
- **Academic Rigor:** Full realization of Relational DBMS concepts—ACID transactions, 3NF normalization, PL/SQL stored objects, and execution plan optimization.

*Thank You — AgriSlot Technical Team*
