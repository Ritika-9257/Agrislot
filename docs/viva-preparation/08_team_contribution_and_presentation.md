# 08. Presentation Outline, Viva Demo Script & Team Contribution

---

## 1. 10-Slide Presentation Deck Outline (10 Minutes)

| Slide | Title | Core Points to Present | Visual on Screen |
| :---: | :--- | :--- | :--- |
| **1** | **Title Slide** | Project Title: AgriSlot — APMC Mandi Slot Booking & Management System<br>Course: Database Management Systems (DBMS)<br>Team Members: Gourav Godara, Soham, Ritika | Title banner, logo, college affiliation |
| **2** | **Problem Statement** | Market yard congestion, unpredictable arrival surges, weighbridge bottlenecks, manual paper registers prone to error. | Photo of APMC queue / flowchart of manual chaos |
| **3** | **Proposed Solution** | Discretized 20-minute arrival windows, hard physical capacity enforcement (50.0 Tons), cryptographic gate tokens, automated check-in. | AgriSlot 3-pillar diagram (Farmer, Officer, Admin) |
| **4** | **System Architecture** | 3-Tier Client-Server Architecture: Next.js 14 Frontend $\leftrightarrow$ Express.js REST API $\leftrightarrow$ MySQL InnoDB Database. | Mermaid full-stack architecture diagram |
| **5** | **Relational Schema & 3NF** | 11 relational tables in Third Normal Form (3NF). Primary keys, foreign keys (`CASCADE`, `SET NULL`), generated stored columns. | ER Diagram / Schema layout table |
| **6** | **ACID & Concurrency Control** | Solving overselling: Atomic transactions with pessimistic row locking (`SELECT ... FOR UPDATE`). Concurrency simulation results. | Code snippet of `booking.repository.js` |
| **7** | **Advanced Database Objects** | Stored Procedures (`Insert_Farmer`, `Display_First_Five`), Cursors, Functions (`Total_Booking_Weight`), Triggers (`Audit_Farmer_Update`), Views. | Database objects summary table |
| **8** | **Role-Based Access Control (RBAC)** | Role segregation: Farmer vs Mandi Officer vs Admin. Stale token prevention via live DB role lookup. Self-demotion safeguards. | RBAC permissions matrix |
| **9** | **Live System Demo** | Step 1: Farmer books 8 Tons $\rightarrow$ Step 2: Officer verifies token at gate $\rightarrow$ Step 3: Admin inspects live MySQL capacity and audit trail. | Live web application running on localhost |
| **10** | **Conclusion & Learnings** | Zero overselling verified, 56 passing unit, SSL, integration & HTTP tests, 25+ real records per table, full relational integrity achieved. | Test pass output & summary metrics |

---

## 2. 5-Minute Live Viva Demo Script

### Preparation Before Examiner Sits Down:
1. Ensure MySQL is running on `127.0.0.1:3307` (`mysqld is alive`).
2. Run backend in Terminal 1: `cd backend && npm run dev` (Listening on `http://localhost:5001`).
3. Run frontend in Terminal 2: `cd frontend && npm run dev` (Listening on `http://localhost:3000`).
4. Keep MySQL CLI open in Terminal 3: `mysql -u root -p -P 3307 agrislot`.

---

### Step-by-Step Viva Script (Spoken Demonstration)

#### Minute 1: The Problem & The Farmer Booking Portal
- **Spoken:** *"Good morning, Professors. We present AgriSlot, an APMC Mandi Slot Booking System built on MySQL. First, we demonstrate the Farmer Interface at `http://localhost:3000/farmer`."*
- **Action:** Open browser at `http://localhost:3000/farmer`.
- **Spoken:** *"Notice that our authenticated user is linked 1:1 to a verified farmer identity in the database (`Ramesh Patel`, Farmer ID #1). When we select APMC Surat for today, the system loads 20-minute arrival slots. Green slots have remaining capacity, red slots are fully booked, and 1:00 PM to 2:00 PM is reserved for lunch."*
- **Action:** Select Produce: *Lokwan Wheat*, Weight: *8.0 Tons*, and click on an available 09:40 AM slot. Click **"Confirm & Book Slot"**.
- **Spoken:** *"Under the hood, MySQL executes an atomic transaction with row locking (`FOR UPDATE`). It checks remaining capacity, increments `Booked_Capacity_Tons`, and creates a booking record with a unique token `AG-T...`. Here is the generated gate pass with QR code."*

#### Minute 2: Mandi Officer Gate Clearance & Check-In
- **Spoken:** *"Now, the farmer drives to the APMC market yard. The gatekeeper operates the Mandi Officer Desk."*
- **Action:** Navigate to `http://localhost:3000/admin?tab=verify`.
- **Spoken:** *"Notice the interface: as a Mandi Officer, administrative tabs like User Management and DB Analysis are hidden for role security. The officer enters the farmer's token code."*
- **Action:** Type or paste the token and click **"Lookup Token"**. The farmer's details appear.
- **Action:** Click **"Allow Entry / Check In"**.
- **Spoken:** *"The booking status is updated to `Checked-In`. If we click on the 'Active In-Yard' tab, this truck is now listed as currently unloading inside the yard. Once unloaded, the officer clicks 'Mark Completed'."*

#### Minute 3: APMC Administrator Control & RBAC
- **Spoken:** *"Next, we demonstrate the APMC Administrator Desk."*
- **Action:** Navigate to `http://localhost:3000/admin?tab=overview` (or `tab=access`).
- **Spoken:** *"The administrator has centralized oversight. Under 'Slot Capacity', they view live capacity across all 20-minute windows. Under 'Manage Admin Access', the administrator can promote any registered farmer to a Mandi Officer or Admin. The system enforces strict safeguards: an administrator cannot accidentally demote themselves or remove the last active admin."*

#### Minute 4: Database Proof (Terminal & Triggers)
- **Spoken:** *"Now we show the underlying MySQL database proof."*
- **Action:** Switch to Terminal 3 (MySQL prompt). Run:
```sql
SELECT Booking_ID, Token_Number, Estimated_Weight_Tons, Booking_Status FROM Bookings ORDER BY Booking_ID DESC LIMIT 3;
```
- **Spoken:** *"Here is the booking just created in MySQL, showing its real status and foreign keys."*
- **Action:** Run:
```sql
SELECT * FROM application_audit_log ORDER BY Audit_ID DESC LIMIT 3;
```
- **Spoken:** *"And here is the `application_audit_log` table, populated automatically by our database triggers and audit services storing JSON snapshots of old and new data."*

#### Minute 5: Wrap-Up & Test Verification
- **Action:** Switch to Terminal 4 and run `npm test`.
- **Spoken:** *"All 56 unit, SSL compatibility, live database integration, and HTTP dispatch tests pass with zero errors, verifying atomicity, single-credit cancellation, and RBAC defense. We are ready for your questions."*

---

## 3. Team Contribution Matrix

To ensure seamless credit sharing during your evaluation, here is the official division of responsibilities across the team:

| Area | Team Member | Key Deliverables & Contributions |
| :--- | :--- | :--- |
| **System Architecture & Database Design** | **Gourav Godara** | • Designed 3NF Relational Schema (11 tables, constraints, foreign keys).<br>• Implemented atomic transaction repository with `SELECT ... FOR UPDATE`.<br>• Configured MySQL connection pooling, database triggers, and audit logging.<br>• Built RBAC backend middleware and Google OAuth 2.0 user linking. |
| **Frontend Portals & Responsive UI** | **Soham** | • Developed Next.js 14 Farmer Slot Booking Interface (`/farmer`).<br>• Implemented dynamic 20-minute Green/Red slot availability grid.<br>• Built Mandi Officer Gate Clearance Desk (`/admin?tab=verify`).<br>• Created Gate Pass Modal with QR code generation and SMS simulation. |
| **Testing, Advanced SQL & Evaluation Docs** | **Ritika** | • Implemented Lab 10 Stored Procedures, Functions, and Cursors.<br>• Created Lab 11 Relational Views and B-Tree Performance Indexes.<br>• Developed automated test suites (56 passing tests across unit, SSL, integration & HTTP routes).<br>• Authored project documentation, viva defense guide, and presentation slides. |

---

## 4. Examiner Defense Checklist & Tips

1. **Be Confident About the Port:** If asked about MySQL port (`3307`), answer: *"Our Homebrew MySQL instance runs on port 3307 to ensure dedicated isolation from any legacy system daemons, configured via `/opt/homebrew/etc/my.cnf` and environment variables."*
2. **Emphasize Concurrency:** Whenever asked why AgriSlot is better than standard web apps, highlight: *"Most beginner web applications suffer from race conditions. AgriSlot uses row-level locking (`FOR UPDATE`) inside an ACID transaction to guarantee zero slot overselling."*
3. **Know Your Tables:** Remember the 11 tables: `Mandis`, `Produce`, `Farmers`, `Slots`, `Bookings`, `Warehouses`, `Traders`, `Transactions`, `User_Login`, `application_audit_log`, `notifications`.
4. **Point to Tests:** If an examiner asks whether your concurrency logic actually works, cite Test #9 in `npm test`: *"We have an automated simulation test where two concurrent threads compete for the remaining 10 Tons, proving that exactly one succeeds and the other receives a 409 Conflict."*
