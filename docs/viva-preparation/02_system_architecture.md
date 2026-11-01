# 02. System Architecture & Data Flow

## 1. High-Level Architectural Paradigm

AgriSlot is built as a classic enterprise **Three-Tier Client-Server Architecture**:

1. **Presentation Layer (Frontend):** Next.js 14 React framework running on Node.js. Delivers responsive single-page interfaces for Farmers (`/farmer`), Mandi Officers (`/admin?tab=verify`), and Administrators (`/admin`), with client-side JWT token handling and real-time state synchronization.
2. **Business Logic & API Layer (Backend):** Node.js and Express RESTful API running on port `5001`. Handles request validation (Zod), JWT authentication, cryptographic token generation, and role-based access control (RBAC).
3. **Data Persistence Layer (Database):** MySQL 8.x relational database running InnoDB engine. Enforces referential integrity, row-level concurrency locking, transactions, stored procedures, cursors, triggers, views, and B-Tree indexes.

---

## 2. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["Presentation Layer (Client Devices)"]
        FClient["🧑🌾 Farmer Device\n(/farmer)"]
        OClient["👮 Mandi Officer Terminal\n(/admin?tab=verify)"]
        AClient["🛡️ APMC Admin Console\n(/admin)"]
    end

    subgraph API["Application & Logic Layer (Express API :5001)"]
        Router["REST Router & Controllers\n(/api/v1/*)"]
        AuthMid["authenticateToken & requireActiveRole\n(JWT & DB Live Verification)"]
        ValMid["Zod Input Validation\n(Payload & Schema Guard)"]
        Repo["Data Access Repositories\n(booking, farmer, slot, user)"]
        Pool["MySQL Connection Pool\n(mysql2/promise, 10 Connections)"]
    end

    subgraph DB["Database Layer (MySQL InnoDB :3307)"]
        subgraph Tables["Relational Tables (3NF)"]
            T_Users["User_Login (RBAC, 1:1 Farmer)"]
            T_Farmers["Farmers (Identity)"]
            T_Slots["Slots (20-Min Capacity)"]
            T_Bookings["Bookings (Tokens & State)"]
            T_Mandis["Mandis & Produce"]
            T_Txn["Transactions & Warehouses"]
            T_Audit["application_audit_log"]
        end

        subgraph Progs["Database Programmable Objects"]
            Triggers["Triggers\n(Audit_Farmer_Insert/Update/Delete)"]
            Procs["Stored Procedures & Cursors\n(Insert_Farmer, Display_First_Five)"]
            Views["Relational Views\n(Farmer_Bookings_Detail_View)"]
        end
    end

    FClient -->|"HTTP / HTTPS (JWT)"| Router
    OClient -->|"HTTP / HTTPS (JWT)"| Router
    AClient -->|"HTTP / HTTPS (JWT)"| Router

    Router --> ValMid
    ValMid --> AuthMid
    AuthMid --> Repo
    Repo --> Pool
    Pool -->|"TCP/IP Connection"| Tables

    Tables -.->|"Fires on Change"| Triggers
    Repo -.->|"CALL Statement"| Procs
    Repo -.->|"SELECT FROM"| Views
```

---

## 3. End-to-End Booking Data Flow Sequence

The most critical operational path in the system is booking a 20-minute delivery slot. The sequence below illustrates how AgriSlot maintains zero data overselling across concurrent users:

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 🧑🌾 Farmer
    participant UI as Next.js (/farmer)
    participant API as Express API
    participant Auth as Auth Middleware
    participant Repo as Booking Repository
    participant DB as MySQL (InnoDB)

    Farmer->>UI: Selects Mandi, Produce, Date, Slot & Weight (e.g., 8.0 Tons)
    UI->>API: POST /api/v1/bookings {Slot_ID, Produce_ID, Estimated_Weight_Tons} + Bearer JWT
    API->>Auth: authenticateToken(req)
    Auth->>DB: Verify JWT signature & lookup User_Login.Farmer_ID
    DB-->>Auth: Farmer_ID = 14 (Verified Registered Farmer)
    Auth-->>API: req.farmerId = 14, req.user = {userId: 3, role: 'Farmer'}
    API->>Repo: createBookingWithCapacityCheck(...)
    
    rect rgb(240, 248, 255)
        note right of Repo: ACID Transaction Starts
        Repo->>DB: START TRANSACTION
        Repo->>DB: SELECT * FROM Slots WHERE Slot_ID = ? FOR UPDATE
        note over DB: Row Lock Acquired on Slots row.<br/>Concurrent requests queue up.
        DB-->>Repo: Slot record (Max: 50.0T, Booked: 35.0T, Remaining: 15.0T)
        
        alt Remaining Capacity >= 8.0 Tons (Success)
            Repo->>DB: UPDATE Slots SET Booked_Capacity_Tons = Booked_Capacity_Tons + 8.0 WHERE Slot_ID = ?
            Repo->>DB: INSERT INTO Bookings (Farmer_ID, Slot_ID, Produce_ID, Estimated_Weight_Tons, Token_Number, Booking_Status) VALUES (14, 5, 2, 8.0, 'AG-T87B32F', 'Confirmed')
            Repo->>DB: COMMIT
            note over DB: Row lock released. Changes permanently durable.
            Repo-->>API: Booking ID #45 created, Token 'AG-T87B32F'
            API-->>UI: 201 Created {Token: 'AG-T87B32F', Status: 'Confirmed'}
            UI-->>Farmer: Displays Gate Pass Modal with QR Code
        else Remaining Capacity < 8.0 Tons (Capacity Exceeded)
            Repo->>DB: ROLLBACK
            note over DB: Row lock released. No changes made.
            Repo-->>API: Error: INSUFFICIENT_SLOT_CAPACITY
            API-->>UI: 409 Conflict "Selected slot cannot accommodate 8.0 Tons"
            UI-->>Farmer: Red Alert: Slot Full. Please select another slot.
        end
    end
```

---

## 4. Gate Clearance & Weighbridge Flow Sequence

When a farmer arrives at the APMC Mandi yard:

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 🧑🌾 Arriving Farmer
    actor Officer as 👮 Mandi Gate Officer
    participant UI as Officer Desk (/admin?tab=verify)
    participant API as Express API
    participant DB as MySQL (InnoDB)

    Farmer->>Officer: Presents Gate Pass Token 'AG-T87B32F'
    Officer->>UI: Types or scans 'AG-T87B32F'
    UI->>API: GET /api/v1/bookings/token/AG-T87B32F
    API->>DB: SELECT * FROM farmer_bookings_detail_view WHERE Token_Number = 'AG-T87B32F'
    DB-->>API: Returns verified farmer identity, produce, scheduled window
    API-->>UI: Displays Booking Details & "Allow Entry / Check In" button
    
    Officer->>UI: Clicks "Allow Entry / Check In"
    UI->>API: POST /api/v1/bookings/check-in {token: 'AG-T87B32F'} + Officer JWT
    API->>DB: UPDATE Bookings SET Booking_Status = 'Checked-In' WHERE Token_Number = 'AG-T87B32F'
    DB-->>API: 1 Row Affected
    API-->>UI: 200 OK "Gate clearance granted. Vehicle is now Active In-Yard."
    UI-->>Officer: Status card updates to 'Checked-In' (Active In-Yard badge)
    
    note over Farmer,Officer: Truck unloads at commodity auction platform.<br/>Weighbridge verifies tare weight.
    
    Officer->>UI: Navigates to 'Active In-Yard' & clicks "Mark Completed"
    UI->>API: PATCH /api/v1/admin/bookings/45/status {Booking_Status: 'Completed'}
    API->>DB: UPDATE Bookings SET Booking_Status = 'Completed' WHERE Booking_ID = 45
    DB-->>API: 1 Row Affected
    API-->>UI: 200 OK "Delivery marked Completed."
    UI-->>Officer: Vehicle discharged from yard.
```

---

## 5. Security & Role Separation Safeguards

1. **Live Database Role Validation:** Authentication does not rely solely on the static claims in the JWT token. The `requireActiveRole` middleware executes a fresh lookup against `User_Login` to ensure a revoked or suspended officer cannot perform administrative actions using an unexpired token.
2. **Strict Route Segregation:**
   - `/api/v1/bookings`: Public reading of slot capacity; authenticated farmers can book and cancel their own records.
   - `/api/v1/admin/bookings/*` and `/api/v1/bookings/check-in`: Accessible by both `Mandi_Officer` and `Admin`.
   - `/api/v1/admin/users/*` and `/api/v1/admin/audit-logs`: Strictly restricted to `Admin`. Mandi Officers receive `403 FORBIDDEN`.
