# AgriSlot - Frontend Application (Next.js 14, React JSX & Neo-Bento Design)

Modern, tactile web interface for the AgriSlot Agricultural Produce Market Committee (APMC) slot allocation, weighbridge clearance, and mandi logistics platform.

Built with **pure React JSX (`.jsx`)** and styled using the **Playful Neo-Editorial / Bento Grid Design System**.

## Design System & Features

- **Palette**: Forest (`#064E3B`), Mint Foam (`#E6F7F0`), Saffron (`#F59E0B`), Navy Border (`#0F2B20`), Lilac (`#EEF2FF`), Periwinkle (`#E0E7FF`), and Coral (`#FEE2E2`).
- **Tactile Bento Cards**: 24px rounded corners (`rounded-bento`) with high-contrast tactile shadows (`shadow-bento: 4px 4px 0px #0F2B20`).
- **Pop-up Login & Sign-up Modal**: Global blurred backdrop (`backdrop-blur-md`) modal with "Continue with Google", mobile/passcode login, 1-click demo profiles, and instant farmer registration without page reloads.
- **Farmer & Mandi Services Section**: Highlights the 6 core APMC services (Advance Slot Booking, Digital Gate-Pass Tokens, Certified Weighbridge, Fair Quality Grading, Direct UPI Payouts, Depot Warehousing).
- **Perforated Ticket Stubs**: Boarding-pass tickets with circular punch cutouts, barcode/QR code simulation, and tear-off coupons.
- **Typography**: Plus Jakarta Sans, Outfit, and Space Mono for tabular numbers and telemetry metrics.

## Page Routes

1. **Overview & Clearance Rig (`/`)**:
   - Fast-track inbound pass scanner widget with Series 2026-X badge.
   - Master interactive bento cards:
     - Farmer Dossier (e-NAM verified stamp, UID, Bolero license plate pill `GJ-05-EG-4412`, commodity specs).
     - Instant-camera Polaroid styled ANPR snapshot with washi tape accent (`polaroid-tape`) and OCR stamp.
     - Real-time load cells deck with giant net payload (`4,500 KG / 4.50 MT`), gross vs tare breakdown, ultrasonic moisture gauge (`11.8% Grade A`), and bay assignment.
   - Physical vehicle queue cards with active/standby badges (`ON SCALE`, `WAIT: ~4 MIN`, `DOCS PENDING`).
2. **Farmer Portal (`/farmer`)**:
   - Destination mandi picker & slot cards with live remaining capacity bars (Green / Amber / Red).
   - Farmer identification & popup producer registration.
   - Concurrency-safe slot booking with instant boarding pass gate token generation (`AG-T******`).
   - Booking management with instant cancellation restoring slot capacity atomically.
3. **Gate-Pass Check (`/verify`)**:
   - Quick token verification terminal with barcode simulation and printable boarding pass slips.
4. **Mandi Gatekeeper & Operations (`/admin`)**:
   - Mandi Officer authentication (`admin` / `admin123`).
   - Fast-track gate check-in terminal (advances status to `CHECKED_IN`).
   - Live bookings ledger table with status transitions.
   - Yard capacity saturation visualizer.
   - Weighbridge load recorder & instant e-NAM UPI payout authorization (`PAID`).
5. **Database Studio & Analytics (`/analytics`)**:
   - 8 SQL benchmark queries with real-time execution duration timers in milliseconds (`Execution Time: X ms`).
   - Relational views inspector (`Farmer_Bookings_Detail_View`, `Surat_Mandi_Operations_View`).
   - Stored procedures runner, explicit cursors (`Display_All_Farmers`, `Display_First_Five_Farmers`), and numeric tonnage function.
   - Live trigger audit trail from `application_audit_log` and formatted XML data export.

## Setup & Running

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The frontend runs at **`http://localhost:3000`** and connects to the backend at **`http://localhost:5001/api/v1`**.
