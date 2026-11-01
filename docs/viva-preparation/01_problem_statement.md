# 01. Problem Statement & Project Overview

## 1. APMC Mandi Background & Context

An **APMC (Agricultural Produce Market Committee)** is a statutory market yard established by state governments in India to ensure that farmers are protected from exploitation by intermediaries, receive transparent auction pricing, and obtain prompt payment for their agricultural produce (grains, pulses, oilseeds, fruits, and vegetables).

Under standard APMC operations:
- Farmers harvest crops and transport them in trucks, tractor-trolleys, or pick-up vans to the nearest regional market yard (Mandi).
- The mandi yard contains weighbridges for measuring gross vehicle weight, auction platforms (sheds) where licensed commission agents and traders bid, and storage warehouses.
- A physical gate controls inbound and outbound vehicular movement.

---

## 2. Real-World Operational Challenges

Before AgriSlot, market yards operated on physical entry registers and uncoordinated farmer arrivals. This created severe structural bottlenecks:

1. **Severe Yard Traffic & Gridlock:** Without scheduled arrival windows, hundreds of tractor-trolleys arrive simultaneously during peak morning hours (8:00 AM – 11:00 AM), causing multi-kilometer traffic queues outside the mandi gates.
2. **Weighbridge & Unloading Bottlenecks:** Mandi weighbridges and unloading docks have a fixed throughput (e.g., 50 metric tons per 20-minute operational block). Unscheduled surges exceed yard physical capacity, leaving perishable produce exposed to adverse weather.
3. **Manual, Vulnerable Record-Keeping:** Paper-based gate passes are prone to damage, unauthorized duplications, and manual data-entry errors.
4. **Lack of Transparency for Farmers:** Farmers travel long distances without knowing whether the mandi has capacity to receive their commodity on a given day.
5. **No Systemic Concurrency Control:** In manual and naive digital systems, multiple operators can book or accept loads exceeding the physical yard capacity, leading to chaotic overbooking.

---

## 3. Proposed Solution: AgriSlot

**AgriSlot** is a high-integrity, MySQL database-driven APMC Mandi Slot Booking and Yard Management System. It replaces manual gate entry with a real-time, capacity-controlled digital workflow:

- **20-Minute Time Slots:** Mandi operating hours are discretized into structured 20-minute arrival windows (e.g., 09:00–09:20, 09:20–09:40), excluding a mandatory 1-hour lunch break (13:00–14:00).
- **Physical Capacity Enforcement:** Each 20-minute slot has a hard physical capacity limit (e.g., 50.0 metric tons). Every booking reserves capacity atomically using database row-level locking (`SELECT ... FOR UPDATE`).
- **Cryptographic Gate Pass Tokens:** Every successful booking generates a unique alphanumeric gate token (e.g., `AG-T001` or `AG-T87B32F`) formatted as a scannable QR pass.
- **Strict Role-Based Access Control (RBAC):** Complete architectural separation between Farmers, Mandi Officers, and System Administrators.

---

## 4. The Three Distinct User Roles

```
+-----------------------------------------------------------------------------------+
|                                 AGRISLOT RBAC                                     |
+--------------------------+------------------------------+-------------------------+
|        1. FARMER         |       2. MANDI OFFICER       |        3. ADMIN         |
+--------------------------+------------------------------+-------------------------+
| • 1:1 Identity Profile   | • Gate Clearance Terminal    | • Centralized Dashboard |
| • Live Slot Availability | • Alphanumeric Token Lookup  | • System Slot Manager   |
| • Green/Red Visual Chart | • Weighbridge Check-In       | • RBAC User Promotion   |
| • One-Click Booking      | • Active In-Yard Monitor     | • MySQL Audit Trail     |
| • Pass Display & Print   | • Mark Delivery Completed    | • DBMS Query Telemetry  |
| • 1-Credit Cancellation  | ✕ Barred from Admin & RBAC   | • Full DB Operations    |
+--------------------------+------------------------------+-------------------------+
```

### Role 1: Farmer
- Authenticates securely via email/password or Google OAuth 2.0.
- Exactly **one user account corresponds to one registered farmer identity** in the `Farmers` table (`User_Login.Farmer_ID = Farmers.Farmer_ID`). A farmer cannot forge or submit bookings under another person's identity.
- Views real-time slot availability for any selected date and APMC Mandi yard:
  - **Green Slots:** Available capacity remaining.
  - **Red Slots:** Fully booked (50.0 Tons booked) or lunch break.
- Selects produce, enters estimated weight, and commits an atomic booking transaction.
- Views past and active gate passes, downloads pass credentials, or cancels upcoming bookings (which atomically restores slot capacity exactly once).

### Role 2: Mandi Officer (Gatekeeper & Weighbridge Operator)
- Dedicated terminal interface at `/admin?tab=verify`.
- Looks up arriving vehicles by token number or scan.
- Validates arrival details (Farmer Name, Commodity, Scheduled Window).
- Performs gate check-in: atomically updates booking status from `Confirmed` to `Checked-In`, logs arrival timestamp, and marks the vehicle as **Active / In Process** inside the yard.
- Monitors active vehicles currently unloading at commodity auction platforms.
- Records departure and transitions status to `Completed`.
- **Strictly Barred:** Mandi Officers are explicitly prohibited from accessing user administration, RBAC privilege modification, database schema analysis, or audit log clearing.

### Role 3: APMC System Administrator
- Centralized control desk at `/admin`.
- Live monitoring of mandi-wide slot capacity, utilization percentages, and daily tonnage.
- **RBAC User Management:** Search registered accounts and dynamically promote or demote user roles (`Farmer` ↔ `Mandi_Officer` ↔ `Admin`).
- **Security Safeguards:** Prevents self-demotion, protects the last active administrator from accidental removal, and invalidates stale sessions immediately via live database role re-verification.
- **DBMS Telemetry & Audit Logs:** Live inspection of the `application_audit_log` table, relational view data, stored procedure executions, and transactional throughput.

---

## 5. Database-First Engineering Philosophy

Rather than treating the database as a dumb key-value store, AgriSlot places **relational database concepts at the core of the system architecture**:

1. **ACID Transactions:** Slot booking and cancellation run inside isolated transactions with pessimistic concurrency control (`FOR UPDATE`).
2. **Third Normal Form (3NF):** Elimination of insertion, update, and deletion anomalies across 11 normalized tables.
3. **Database-Level Integrity Constraints:** Foreign key constraints, domain checks (`CHECK (Booked_Capacity_Tons <= Max_Capacity_Tons)`), and stored generated columns.
4. **Programmable Objects:** Stored procedures for modular CRUD operations, stored functions for mathematical aggregations, cursors for batch record processing, and triggers for automated change logging.
5. **Relational Views:** Abstract complex multi-table joins into performant, secure virtual tables for farmer dashboards and mandi officer terminals.
