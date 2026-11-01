# 06. Important SQL Queries in AgriSlot

This document compiles the 15 most important SQL queries used in AgriSlot, complete with syntax, real values, operational explanations, and expected output structures.

---

## Query 1: Atomic Slot Capacity Check with Row-Level Lock
- **Purpose:** Acquires an exclusive row lock on a slot to prevent race conditions during booking.
- **Location:** `src/repositories/booking.repository.js`
```sql
SELECT 
    Slot_ID,
    Mandi_ID,
    Slot_Date,
    Start_Time,
    End_Time,
    Max_Capacity_Tons,
    Booked_Capacity_Tons,
    (Max_Capacity_Tons - Booked_Capacity_Tons) AS Remaining_Capacity_Tons
FROM Slots
WHERE Slot_ID = 5
FOR UPDATE;
```
- **Explanation:** `FOR UPDATE` instructs MySQL's InnoDB storage engine to acquire an Exclusive Lock (X-Lock) on the row. Any concurrent transaction attempting to read or update this slot is suspended until the current transaction commits or rolls back.

---

## Query 2: Atomic Capacity Increment
- **Purpose:** Reserves capacity atomically inside the transaction.
- **Location:** `src/repositories/booking.repository.js`
```sql
UPDATE Slots
SET Booked_Capacity_Tons = Booked_Capacity_Tons + 8.50
WHERE Slot_ID = 5;
```
- **Explanation:** Increments `Booked_Capacity_Tons` by the farmer's estimated payload. Guarded by the database constraint `chk_slot_capacity`, ensuring `Booked_Capacity_Tons <= Max_Capacity_Tons`.

---

## Query 3: Multi-Table Gate Pass Verification (5-Table INNER JOIN)
- **Purpose:** Mandi Officer looks up arriving vehicle by token code.
- **Location:** `src/repositories/booking.repository.js`
```sql
SELECT 
    b.Booking_ID,
    b.Token_Number,
    b.Estimated_Weight_Tons,
    b.Booking_Status,
    b.Created_At,
    f.Name AS Farmer_Name,
    f.Phone AS Farmer_Phone,
    f.Village AS Farmer_Village,
    p.Produce_Name,
    p.Category AS Produce_Category,
    s.Slot_Date,
    s.Start_Time,
    s.End_Time,
    m.Mandi_Name,
    m.Location AS Mandi_Location
FROM Bookings b
INNER JOIN Farmers f ON b.Farmer_ID = f.Farmer_ID
INNER JOIN Produce p ON b.Produce_ID = p.Produce_ID
INNER JOIN Slots s ON b.Slot_ID = s.Slot_ID
INNER JOIN Mandis m ON s.Mandi_ID = m.Mandi_ID
WHERE b.Token_Number = 'AG-T001';
```
- **Expected Output:**
```
+------------+--------------+-----------------------+----------------+---------------------+-------------+--------------+----------------+--------------+------------------+------------+------------+----------+-------------+----------------+
| Booking_ID | Token_Number | Estimated_Weight_Tons | Booking_Status | Created_At          | Farmer_Name | Farmer_Phone | Farmer_Village | Produce_Name | Produce_Category | Slot_Date  | Start_Time | End_Time | Mandi_Name  | Mandi_Location |
+------------+--------------+-----------------------+----------------+---------------------+-------------+--------------+----------------+--------------+------------------+------------+------------+----------+-------------+----------------+
|          1 | AG-T001      |                 10.00 | Confirmed      | 2026-10-24 15:43:14 | Ramesh Patel| 9000000001   | Bardoli        | Lokwan Wheat | Grains           | 2026-11-01 | 09:00:00   | 09:20:00 | APMC Surat  | Ring Road      |
+------------+--------------+-----------------------+----------------+---------------------+-------------+--------------+----------------+--------------+------------------+------------+------------+----------+-------------+----------------+
```

---

## Query 4: Active In-Yard Monitoring
- **Purpose:** Mandi Officers monitor vehicles currently inside the yard unloading produce.
- **Location:** `src/repositories/booking.repository.js`
```sql
SELECT 
    b.Booking_ID,
    b.Token_Number,
    f.Name AS Farmer_Name,
    f.Phone AS Farmer_Phone,
    p.Produce_Name,
    b.Estimated_Weight_Tons,
    s.Start_Time,
    s.End_Time,
    b.Created_At AS Arrival_Time
FROM Bookings b
JOIN Farmers f ON b.Farmer_ID = f.Farmer_ID
JOIN Produce p ON b.Produce_ID = p.Produce_ID
JOIN Slots s ON b.Slot_ID = s.Slot_ID
WHERE b.Booking_Status = 'Checked-In'
ORDER BY b.Created_At ASC;
```

---

## Query 5: Single-Credit Atomic Cancellation
- **Purpose:** Restores slot capacity exactly once upon cancellation.
- **Location:** `src/repositories/booking.repository.js`
```sql
-- Step A: Start Transaction
START TRANSACTION;

-- Step B: Verify status is 'Confirmed' with row lock
SELECT Booking_ID, Slot_ID, Estimated_Weight_Tons, Booking_Status
FROM Bookings
WHERE Booking_ID = 14 AND Farmer_ID = 2
FOR UPDATE;

-- Step C: Update status to 'Cancelled'
UPDATE Bookings
SET Booking_Status = 'Cancelled'
WHERE Booking_ID = 14;

-- Step D: Release reserved capacity back to the slot
UPDATE Slots
SET Booked_Capacity_Tons = GREATEST(0.00, Booked_Capacity_Tons - 6.50)
WHERE Slot_ID = 8;

-- Step E: Commit
COMMIT;
```

---

## Query 6: Mandi Capacity Utilization Aggregate (GROUP BY & HAVING)
- **Purpose:** Evaluates daily capacity usage across all regional yards.
- **Location:** `src/services/analytics.service.js`
```sql
SELECT 
    m.Mandi_Name,
    m.District,
    s.Slot_Date,
    COUNT(b.Booking_ID) AS Total_Bookings,
    SUM(b.Estimated_Weight_Tons) AS Total_Tons_Booked,
    ROUND(AVG(b.Estimated_Weight_Tons), 2) AS Avg_Load_Tons,
    m.Total_Daily_Capacity_Tons,
    ROUND((SUM(b.Estimated_Weight_Tons) / m.Total_Daily_Capacity_Tons) * 100, 2) AS Yard_Utilization_Pct
FROM Mandis m
JOIN Slots s ON m.Mandi_ID = s.Mandi_ID
LEFT JOIN Bookings b ON s.Slot_ID = b.Slot_ID AND b.Booking_Status != 'Cancelled'
GROUP BY m.Mandi_ID, m.Mandi_Name, m.District, s.Slot_Date, m.Total_Daily_Capacity_Tons
HAVING Total_Tons_Booked > 0
ORDER BY Total_Tons_Booked DESC;
```

---

## Query 7: Top 5 Produce Commodities by Tonnage
- **Purpose:** Identifies the highest-volume crops traded at the APMC yard.
```sql
SELECT 
    p.Category,
    p.Produce_Name,
    COUNT(b.Booking_ID) AS Number_Of_Deliveries,
    SUM(b.Estimated_Weight_Tons) AS Total_Weight_Tons
FROM Produce p
JOIN Bookings b ON p.Produce_ID = b.Produce_ID
WHERE b.Booking_Status IN ('Confirmed', 'Checked-In', 'Completed')
GROUP BY p.Produce_ID, p.Category, p.Produce_Name
ORDER BY Total_Weight_Tons DESC
LIMIT 5;
```

---

## Query 8: Trader Financial Settlements with Generated Column
- **Purpose:** Summarizes payments released vs pending across commission traders.
```sql
SELECT 
    t.Name AS Trader_Name,
    t.License_No,
    COUNT(tx.Txn_ID) AS Total_Transactions,
    SUM(tx.Actual_Weight) AS Total_Weight_Purchased,
    SUM(tx.Total_Amount) AS Total_Settlement_Value,
    SUM(CASE WHEN tx.Payment_Status = 'Released' THEN tx.Total_Amount ELSE 0 END) AS Paid_Amount,
    SUM(CASE WHEN tx.Payment_Status = 'Pending' THEN tx.Total_Amount ELSE 0 END) AS Pending_Amount
FROM Traders t
JOIN Transactions tx ON t.Trader_ID = tx.Trader_ID
GROUP BY t.Trader_ID, t.Name, t.License_No
ORDER BY Total_Settlement_Value DESC;
```

---

## Query 9: User Promotion with Audit Trail
- **Purpose:** Admin promotes user to Mandi Officer and logs event.
- **Location:** `src/controllers/admin.controller.js`
```sql
-- 1. Update user role
UPDATE User_Login
SET User_Role = 'Mandi_Officer'
WHERE User_ID = 4 AND User_Role != 'Admin';

-- 2. Insert audit log record
INSERT INTO application_audit_log (
    Table_Name,
    Operation_Type,
    Record_ID,
    Old_Data,
    New_Data,
    Changed_By
) VALUES (
    'User_Login',
    'ROLE_CHANGE',
    '4',
    JSON_OBJECT('User_Role', 'Farmer'),
    JSON_OBJECT('User_Role', 'Mandi_Officer'),
    'admin@agrislot.com'
);
```

---

## Query 10: Calling Stored Procedure `Insert_Farmer`
- **Purpose:** Executes modular insertion procedure with parameterized arguments.
```sql
CALL Insert_Farmer(
    'Kishore Bhai',
    '9825123456',
    '987654321098',
    'kishore@okhdfcbank',
    'Navsari'
);
```

---

## Query 11: Calling Stored Procedure with Cursor (`Display_First_Five_Farmers`)
- **Purpose:** Invokes procedural row-by-row cursor evaluation.
```sql
CALL Display_First_Five_Farmers();
```
- **Output:**
```
+-----------+------------------+------------+
| Farmer_ID | Name             | Phone      |
+-----------+------------------+------------+
|         1 | Ramesh Patel     | 9000000001 |
|         2 | Suresh Chaudhary | 9000000002 |
|         3 | Mahesh Parmar    | 9000000003 |
|         4 | Rajesh Solanki   | 9000000004 |
|         5 | Dinesh Varma     | 9000000005 |
+-----------+------------------+------------+
```

---

## Query 12: Executing Stored Function `Total_Booking_Weight()`
- **Purpose:** Computes the grand total tonnage booked in the system.
```sql
SELECT Total_Booking_Weight() AS Grand_Total_Booked_Tons;
```

---

## Query 13: Querying Relational View `Farmer_Bookings_Detail_View`
- **Purpose:** Retrieves sanitized pass records for farmer view.
```sql
SELECT 
    Token_Number,
    Produce_Name,
    Estimated_Weight_Tons,
    Slot_Date,
    Start_Time,
    End_Time,
    Booking_Status
FROM Farmer_Bookings_Detail_View
WHERE Farmer_ID = 1
ORDER BY Slot_Date DESC, Start_Time ASC;
```

---

## Query 14: Querying Relational View `Surat_Mandi_Operations_View`
- **Purpose:** Retrieves operational overview for Surat APMC Yard.
```sql
SELECT * FROM Surat_Mandi_Operations_View
LIMIT 10;
```

---

## Query 15: Index Performance EXPLAIN Analysis
- **Purpose:** Proves query plan uses B-Tree index instead of full-table scan.
```sql
EXPLAIN SELECT * FROM Slots 
WHERE Mandi_ID = 1 AND Slot_Date = '2026-11-01';
```
- **Execution Plan Output:**
```
+----+-------------+-------+------------+------+---------------------+---------------------+---------+-------------+------+----------+-------+
| id | select_type | table | partitions | type | possible_keys       | key                 | key_len | ref         | rows | filtered | Extra |
+----+-------------+-------+------------+------+---------------------+---------------------+---------+-------------+------+----------+-------+
|  1 | SIMPLE      | Slots | NULL       | ref  | idx_slots_mandi_date| idx_slots_mandi_date| 7       | const,const |   18 |   100.00 | NULL  |
+----+-------------+-------+------------+------+---------------------+---------------------+---------+-------------+------+----------+-------+
```
- **Verification:** `type: ref`, `key: idx_slots_mandi_date`, scanning only 18 rows instead of all 214 rows!
