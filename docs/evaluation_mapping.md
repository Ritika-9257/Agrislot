# AgriSlot - Project Evaluation & Technical Feature Mapping

This document provides the exact mapping of all advanced database features, stored programs, triggers, cursors, benchmark queries, views, and frontend controls implemented across **AgriSlot**. Use this cheat-sheet during project evaluation.

---

## 0. Official AgriSlot Tech Stack

| Layer | Technologies | Role & Implementation Details |
| :--- | :--- | :--- |
| **Frontend** | **Next.js, React.js, Tailwind CSS** | Farmer booking portal and admin dashboard, developed after the backend. Features a Playful Neo-Editorial Bento Grid design system in pure React JSX (`.jsx`). |
| **Backend** | **Node.js, Express.js** | REST APIs, booking logic, capacity management, and administrative operations. Features row-level lock concurrency protection and port 5001 fallback. |
| **Database** | **MySQL, MySQL Workbench** | Stores farmers, mandis, produce, slots, bookings, warehouses, traders, and transactions across 8 relational tables + application audit log. |
| **Database Connectivity** | **mysql2** | Connects the Node.js backend to MySQL using parameterized queries and connection pooling with Promise API. |
| **Security and Validation** | **JWT, bcrypt, Zod or express-validator, Helmet, CORS** | Authentication, authorization, input validation, and API security. JWT and bcrypt are proposed choices for implementation. |
| **Development and Testing** | **Nodemon, Supertest, Node.js test runner** | Automatic server restarts and API testing with 18 automated unit and mock test suites. |

---

## 1. Stored Procedures & Data Manipulation

| Feature Requirement | AgriSlot Implementation | SQL File Location | API & UI Location |
| :--- | :--- | :--- | :--- |
| **Insertion Procedure** | `Insert_Farmer(Name, Phone, Aadhar_No, UPI_ID, Village)` | `database/procedures_triggers.sql` | `POST /api/v1/automation/procedures/farmer/insert` |
| **Update Procedure** | `Update_Farmer(Farmer_ID, Name, Phone, Aadhar_No, UPI_ID, Village)` | `database/procedures_triggers.sql` | `PUT /api/v1/automation/procedures/farmer/update` |
| **Deletion Procedure** | `Delete_Farmer(Farmer_ID)` | `database/procedures_triggers.sql` | `DELETE /api/v1/automation/procedures/farmer/:id` |
| **User Login Procedures** | `Insert_Login`, `Update_Login`, `Delete_Login`, `Check_Login` | `database/procedures_triggers.sql` | `POST /api/v1/auth/login`, `POST /api/v1/automation/procedures/login/*` |

---

## 2. Database User Roles & Security Privileges

| User / Role | Description & SQL Privileges | Purpose in AgriSlot |
| :--- | :--- | :--- |
| **`naive_role` / `naive_user`** | `GRANT SELECT ON agrislot.Farmers` | Read-only public farmer directory lookup. |
| **`app_developer_role` / `app_dev`** | `GRANT SELECT, INSERT, UPDATE, DELETE ON Farmers, Slots, Bookings` | Application backend service operations. |
| **`dba_role` / `agrislot_dba`** | `GRANT ALL PRIVILEGES ON agrislot.*` | Complete administrative database management. |

---

## 3. Explicit Cursor Implementations

| Cursor Program | Mechanism | SQL File Location | UI Button (Procedures & Automation Tab) |
| :--- | :--- | :--- | :--- |
| **`Display_All_Farmers`** | Explicit cursor with `OPEN`, `FETCH`, `CLOSE`, and loop handler to iterate table without `LIMIT`. | `database/procedures_triggers.sql` | **"Cursor: All Farmers"** button |
| **`Display_First_Five_Farmers`** | Explicit cursor loop configured with `LIMIT 5`. | `database/procedures_triggers.sql` | **"Cursor: First 5 (Limit)"** button |

---

## 4. Paginated Search Procedures

| Procedure | Parameters | Description | UI Location |
| :--- | :--- | :--- | :--- |
| **`Search_Farmers_Paginated`** | `(p_Page, p_Page_Size)` | Uses SQL `LIMIT` and calculated `OFFSET = (Page - 1) * Page_Size`. | Tab 2: Pagination search bar |
| **`Search_Farmers_Filtered`** | `(p_Village, p_Page, p_Page_Size)` | Dynamic search filtering by location/village with pagination. | Tab 2: "Paginated Location Search" |

---

## 5. Numeric Column Functions & Aggregations

| Program | SQL Mechanism | Description | UI Button |
| :--- | :--- | :--- | :--- |
| **`Total_Booking_Weight()`** | Stored Function returning `DECIMAL(12,2)` | Calculates sum of all active estimated booking weights across all mandis. | **"Total Booking Weight (Stored Function)"** |
| **`Total_Weight_By_Farmer()`** | Stored Procedure with `GROUP BY Farmer_ID` | Aggregates booking weights and counts grouped by farmer. | **"Weight By Farmer (Grouped Procedure)"** |

---

## 6. Database Triggers

| Trigger Name | Timing & Event | Integrity Rule Enforced |
| :--- | :--- | :--- |
| **`Before_Farmer_Insert`** | `BEFORE INSERT ON Farmers` | Enforces non-empty name and regex 10-digit phone number (`^[0-9]{10}$`). |
| **`Before_Farmer_Update`** | `BEFORE UPDATE ON Farmers` | Enforces integrity constraints on updates. |
| **`Uppercase_Farmer_Insert`** | `BEFORE INSERT ON Farmers` | Automatically capitalizes Name and Village to uppercase (`UPPER(TRIM(...))`). |
| **`Uppercase_Farmer_Update`** | `BEFORE UPDATE ON Farmers` | Maintains uppercase formatting upon record updates. |
| **`Audit_Farmer_Insert`** | `AFTER INSERT ON Farmers` | Logs new record details into `application_audit_log` with JSON snapshot. |
| **`Audit_Farmer_Update`** | `AFTER UPDATE ON Farmers` | Logs before/after diff into `application_audit_log`. |
| **`Audit_Farmer_Delete`** | `AFTER DELETE ON Farmers` | Logs deletion event into `application_audit_log`. |
| **`Restrict_Farmer_Insert`** | `BEFORE INSERT ON Farmers` | Prohibits table modifications during specified window (Monday 2 PM–4 PM). |
| **`Validate_Booking_Slot_Capacity`** | `BEFORE INSERT ON Bookings` | Validates that estimated tons does not exceed remaining slot capacity before inserting. |

---

## 7. Advanced SQL Queries & Benchmark Timings

In the **Query Studio & Analytics** tab, each query displays its execution time in milliseconds:

| Query Type | SQL Operation | Description in UI |
| :--- | :--- | :--- |
| **1. Main Table Display** | `SELECT * FROM Bookings LIMIT 100` | "View Table Records" (Supports JSON and XML format export). |
| **2. Insert with Integrity** | `INSERT INTO Farmers ... ON DUPLICATE KEY UPDATE` | "Farmer Data Entry (Integrity Protected)". |
| **3. Aggregation Dropdown** | `COUNT(*)`, `SUM(...)`, `AVG(...)`, `MIN(...)`, `MAX(...)` | "Commodity & Booking Aggregations" with dropdown for functions and tables. |
| **4. Condition Dropdown** | `WHERE Column [=, !=, >, <, >=, <=, LIKE] Value` | "Conditional Capacity Query" with operator dropdown. |
| **5. Dynamic 2-Table JOIN** | `Table1 [INNER/LEFT/RIGHT] JOIN Table2 ON fk` | "Relational Table Join Explorer" with 3 interactive dropdowns. |
| **6. Subquery** | Multi-table subquery finding farmers with bookings in Surat | "Multi-Table Subquery". |
| **7. Correlated Subquery** | Correlated subquery comparing booking weight against slot average | "Correlated Analysis". |
| **8. Table Update** | `UPDATE Warehouses SET Occupied_Capacity = ...` | "Warehouse Inventory Allocation". |

---

## 8. Indexing & Performance Optimization

File: `database/analytics_views_indexes.sql`:
1. **`idx_bookings_farmer_slot`**: Composite index on `Bookings(Farmer_ID, Slot_ID)`.
2. **`idx_slots_mandi_date`**: Composite index on `Slots(Mandi_ID, Slot_Date)`.
3. **`idx_farmers_village`**: Index on `Farmers(Village)`.
4. **`idx_transactions_payment_status`**: Index on `Transactions(Payment_Status)`.
5. **`idx_mandis_district`**: Index on `Mandis(District)`.

---

## 9. Database Views

1. **`Farmer_Bookings_Detail_View`**: Joins `Bookings`, `Farmers`, `Slots`, `Mandis`, and `Produce` into a comprehensive operational view.
2. **`Surat_Mandi_Operations_View`**: Location-filtered view calculating remaining capacities for Surat district APMCs.
3. **`Display_Surat_Operations_View()`**: Stored procedure displaying data from the view.

---

## 10. XML Data Formatting

- Implemented in `src/utils/xmlFormatter.js`.
- Available on Query 1, Query 3, and Query 4 by checking **"Export as XML"** in the UI or passing `?format=xml` to the API.

---

## 11. Transaction Isolation & Concurrency Laboratory

- **Mechanism**: `SELECT ... FOR UPDATE` acquires row-level exclusive locks on slot capacity records in MySQL InnoDB.
- **ACID Verification**: Two simulated transactions fire simultaneously. One is committed (`✓`), the second is rolled back (`↩`) without negative capacity or overselling.
- **UI Location**: Market Analytics (`/analytics`) ➔ Tab 5: "Concurrency Lab"

---

## 12. Next.js Frontend Page Route Mapping (React JSX & Neo-Bento Design)

| Web Route | Page Description & Components | Features Showcased |
| :--- | :--- | :--- |
| **`/`** (Home) | `src/app/page.jsx` | Neo-Bento Inbound Clearance Rig, live ANPR camera match with washi tape, real-time load cells (4,500 KG net weight deck), ultrasonic moisture gauge (11.8%), bay assignment, perforated ticket scanner, and physical queue cards. |
| **`/farmer`** | `src/app/farmer/page.jsx` | Mandi & slot browser with remaining ton visual capacity bars, farmer registration, atomic slot booking, perforated boarding pass modal (`AG-T******`), and booking cancellation with instant capacity restoration. |
| **`/verify`** | `src/app/verify/page.jsx` | Security gate verification terminal, barcode / QR preview, instant gate authorization badge, and printable perforated boarding pass ticket. |
| **`/admin`** | `src/app/admin/page.jsx` | Mandi Officer JWT login, 1-click vehicle gate check-in (`Checked-In`), live bookings ledger table, yard capacity saturation bars, weighbridge settlement recorder, and UPI payment release. |
| **`/analytics`** | `src/app/analytics/page.jsx` | Query benchmarks (Queries 1–8) with live millisecond timer, relational views viewer, stored procedure and cursor runner, trigger audit log trail, Concurrency Lab, and XML export modal. |
