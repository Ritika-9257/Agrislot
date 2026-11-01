# AgriSlot - 3-Minute Viva Demonstration Walkthrough

Use this script during your evaluation. It takes the examiner through every major feature in 3 minutes while showing both the practical UI and the underlying DBMS principles.

---

## Pre-Demo Checklist (30 Seconds Before Presentation)
1. Run in terminal:
   ```bash
   bash start_agrislot.sh
   ```
2. The terminal will display:
   - MySQL 3306: ONLINE
   - Pre-Flight Health Audit: 25+ records per table, procedures, triggers, views all OK
   - Backend on `http://127.0.0.1:5001`
   - Frontend on `http://localhost:3000`
   - Automatically opens `http://localhost:3000` in your browser.

---

## Step 1: Inbound Clearance Desk & Language Switcher (1 Minute)
**URL:** `http://localhost:3000`

1. **Point out the Neo-Bento Design & Vernacular Switcher:**
   - In the top header, click **`[ हिं ]`** or **`[ ગુ ]`** in the language switcher pill.
   - Show how the hero headline, load cells, bay allocation, and service cards translate into Hindi or Gujarati instantly without page reload.
   - Switch back to **`[ EN ]`**.
2. **Demonstrate Ticket Pulling:**
   - The token input is pre-loaded with `AG-T001`.
   - Click **"Pull Ledger Record"**.
   - Show how the Farmer Dossier loads Ramesh Patel (Olpad), Bolero `GJ-05-EG-4412`, and the Polaroid ANPR camera snapshot.
3. **Demonstrate Real-Time Weighbridge Load Cells:**
   - Point out the Net Produce Payload ($10,000 \text{ KG}$), Gross Weight ($12,920 \text{ KG}$), and Registered Tare ($2,920 \text{ KG}$).
   - Show the ultrasonic moisture gauge ($11.8\%$ Grade A).
4. **Demonstrate Interactive Mandi Yard Map:**
   - Scroll to Section 2.5 ("Mandi Discharge Bays & Yard Map").
   - Click **Bay 01 (Export Corridor)** or **Bay 04 (Bulk Onion Dock)**. Show how it updates the active assignment dynamically.
5. **Demonstrate Dual-Channel Gate Pass:**
   - Click **"Print Pass Slip"** to view the thermal pass with QR code and barcode.
   - Click **"SMS Alert"** to showcase the simulated Government APMC SMS (`VK-APMCGJ`) and WhatsApp Business notification!

---

## Step 2: Farmer Slot Reservation Portal (45 Seconds)
**URL:** `http://localhost:3000/farmer`

1. **Reserve a New Slot:**
   - Select Producer: `Ramesh Patel` or `Suresh Chaudhary`.
   - Select Mandi: `Surat APMC Mandi`.
   - Select Crop: `Lokwan Sharbati Wheat`.
   - Select Slot Window: (e.g. `08:00 AM - 10:00 AM`).
   - Enter Weight: `8.5` Tons.
   - Click **"Confirm & Generate Gate-Pass Token"**.
2. **Showcase Output:**
   - The system atomically books the slot, updates slot capacity, and pops up the Gate Pass Ticket and Simulated SMS!
3. **Lookup Pass History:**
   - Click the **"Pass Lookup & History"** tab.
   - Search by token `AG-T001` or farmer name.
   - Show the **"Slip"**, **"SMS"**, and **"Cancel"** action buttons.

---

## Step 3: Mandi Officer Desk & Settlement (45 Seconds)
**URL:** `http://localhost:3000/admin`

1. **Sign In:**
   - Username: `admin`, Password: `admin123` (or click 1-Click Demo Admin in Auth Modal).
2. **Perform Gate Inbound Check-In:**
   - Enter token `AG-T001` (or click quick preset).
   - Click **"Verify & Admit Vehicle"**.
   - Show how status transitions from `Confirmed` to `Checked-In`.
3. **Authorize Settlement & UPI Payout:**
   - Switch to the **"Settlements"** tab.
   - Select booking `#BK-1`.
   - Enter Actual Net Scale Weight: `10.00` MT, Price: `₹26,000` / Ton.
   - Click **"Authorize e-NAM UPI Payout"**.
   - Show the generated receipt with status `Released`.
4. **Show 1-Click Database Reset:**
   - Point out the **"APMC Database State & Seed Maintenance"** banner.
   - Explain: *"If an examiner wants to re-test from a clean state, this button invokes `setup_db.sh` to restore all 25 records per table in 1 second."*

---

## Step 4: Concurrency Lab & Advanced SQL Telemetry (30 Seconds)
**URL:** `http://localhost:3000/analytics`

1. **Run DBMS Queries 1–8:**
   - Click Tab 1 (Complex Joins & Aggregates). Click **"Execute Query"** to show actual millisecond execution timers ($< 2 \text{ ms}$).
   - Show Tab 4 (XML Data Extraction) displaying formatted XML records.
2. **Demonstrate Concurrency Lab (Tab 5):**
   - Click **"Tab 5: Concurrency Lab"**.
   - Show the interactive dual-thread race condition simulation.
   - Click **"Simulate Concurrent Booking Race"**.
   - Explain to the examiner:
     > *"Both Thread A and Thread B request 8 Tons on a slot with only 10 Tons remaining. Thread A acquires the InnoDB row-level lock (`SELECT ... FOR UPDATE`), succeeds, and commits. Thread B is safely blocked, detects that remaining capacity is now 2 Tons, and triggers rollback with error 409."*

---

## Quick Reference for Common Viva Questions

| Question | Short Answer |
| :--- | :--- |
| **How is overbooking prevented?** | By InnoDB Pessimistic Row-Level Lock (`SELECT ... FOR UPDATE`) in an atomic transaction. |
| **Why is `Total_Amount` a generated column?** | MySQL computes `Actual_Weight * Price_Per_Ton` automatically at the engine level, preventing calculation mismatch. |
| **Where are triggers used?** | An AFTER INSERT trigger logs all booking events to `application_audit_log` with JSON payload and IP. |
| **What indexes did you create?** | Composite B-Tree index on `(Mandi_ID, Slot_Date, Start_Time)` following the Leftmost Prefix rule. |
