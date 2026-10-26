# AgriSlot - Backend REST API & DBMS Platform

AgriSlot is an APMC (Agricultural Produce Market Committee) Mandi slot-booking and gate-pass management platform. It allows farmers to reserve delivery time slots before arriving at market yards, eliminating overcrowding, traffic congestion, and long queues while providing mandi administrators with transaction and capacity controls.

This project includes complete database automation (Stored Procedures, Explicit Cursors, Functions, Triggers, and Roles) and advanced analytics (Query Engine, Indexing & Execution Benchmarks, Views, XML Data Extraction, and an Interactive Web Dashboard).

---

## 1. System Architecture & Folder Layout

```text
/Users/gouravgodara/Documents/dbms project/
├── database/
│   ├── schema.sql                         # Core 8 APMC tables + User_Login + Audit Log
│   ├── seed_data.sql                      # 25 seed records for all tables + default Admin
│   ├── procedures_triggers.sql            # CRUD Procedures, Roles, Cursors, Triggers
│   ├── analytics_views_indexes.sql        # Advanced Queries, Indexes, Views, View Trigger
│   └── Table_formation.txt                # Original schema reference file
├── src/
│   ├── app.js                             # Express app setup, CORS, Helmet, Rate Limiter
│   ├── server.js                          # Server startup & graceful shutdown
│   ├── config/
│   │   ├── env.js                         # Environment configuration
│   │   └── database.js                    # mysql2 connection pool with Promise API
│   ├── routes/
│   │   ├── index.js                       # Mounts all API v1 endpoints
│   │   ├── health.routes.js               # /api/v1/health and /api/v1/health/db
│   │   ├── auth.routes.js                 # Admin / Staff login & register
│   │   ├── mandi.routes.js                # Mandis listing & slots
│   │   ├── produce.routes.js              # Produce catalog
│   │   ├── farmer.routes.js               # Farmer registration & profile
│   │   ├── slot.routes.js                 # Slot availability & utilization
│   │   ├── booking.routes.js              # Atomic booking & cancellation
│   │   ├── transaction.routes.js          # Sale transactions & summaries
│   │   ├── admin.routes.js                # Protected admin management
│   │   ├── lab10.routes.js                # Lab 10 procedures, cursors, triggers
│   │   └── lab11.routes.js                # Lab 11 queries, timing benchmarks, views
│   ├── controllers/                       # HTTP request handlers
│   ├── services/                          # Business logic & atomic transactions
│   ├── repositories/                      # Parameterized SQL database operations
│   ├── middleware/
│   │   ├── authenticate.js                # JWT verification & role authorization
│   │   ├── errorHandler.js                # Centralized error mapping
│   │   ├── notFound.js                    # 404 handler
│   │   ├── rateLimiter.js                 # Request rate limiter
│   │   └── validateRequest.js             # Zod schema validation
│   ├── validators/                        # Zod schemas for input validation
│   └── utils/
│       ├── apiResponse.js                 # Standardized JSON response envelope
│       ├── logger.js                      # Safe logger (redacts PII & passwords)
│       ├── maskData.js                    # Masks Aadhaar and UPI ID
│       ├── tokenGenerator.js              # Collision-resistant gate pass generator
│       └── xmlFormatter.js                # XML formatting for Lab 11 Query 1, 3, 4
├── public/                                # Interactive HTML/JS Web Dashboard
│   └── index.html                         # Workbench UI for Lab 10, Lab 11 & Booking
├── tests/
│   ├── unit_and_mock.test.js              # Concurrency, token, privacy & logic tests
│   └── integration_mysql.test.js          # Live database integration tests
├── .env.example                           # Sample environment configuration
├── .gitignore
├── package.json
└── README.md
```

---

## 2. Key Database Findings & Schema Assumptions

1. **Database Name (`agrislot`)**:
   - The database name is `agrislot`, configurable via `DB_NAME` in `.env`.
2. **Transaction-Safe Concurrency & Slot Capacity**:
   - When multiple farmers attempt to book the last available slot capacity simultaneously, database transactions with row-level locks (`SELECT ... FOR UPDATE`) prevent overselling.
   - Cancelled bookings atomically restore slot capacity **exactly once**.
3. **Authentication**:
   - `User_Login` table is included for Admin and Staff authentication with bcrypt-hashed passwords and JWT tokens.
   - Admin routes (`/api/v1/admin/*`) require a valid JWT with `role: 'Admin'`.
4. **Payment Statuses**:
   - The MySQL schema explicitly restricts `Transactions.Payment_Status` to `ENUM('Pending', 'Released', 'Failed')`. The backend preserves these exact values.
5. **Stored Generated Column**:
   - `Transactions.Total_Amount` is a generated column (`Actual_Weight * Price_Per_Ton`). The backend lets MySQL compute this column automatically.
6. **Privacy Protection**:
   - Farmer `Aadhar_No` is masked as `XXXX-XXXX-0001` and `UPI_ID` is masked in standard API responses. Neither is ever output in logs.

---

## 3. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **MySQL**: MySQL 8.0 or MySQL Workbench

---

## 4. Setup Instructions

### Step 1: Database Setup in MySQL Workbench or CLI

Run the SQL scripts in this exact order:

```bash
# 1. Create tables and constraints
mysql -u root -p < database/schema.sql

# 2. Insert 25 sample records for all tables
mysql -u root -p < database/seed_data.sql

# 3. Create Lab 10 stored procedures, functions, triggers, and roles
mysql -u root -p < database/lab10_procedures_triggers.sql

# 4. Create Lab 11 views, indexes, and procedures
mysql -u root -p < database/lab11_queries_views_indexes.sql
```

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` to match your MySQL credentials:

```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=agrislot
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Run the Backend Server

```bash
# Production mode
npm start

# Development mode (with nodemon auto-restart)
npm run dev
```

Server will start on `http://localhost:5000`.

Open **`http://localhost:5000`** in your browser to view the interactive **AgriSlot & DBMS Lab 10/11 Dashboard**!

---

## 5. Running Automated Tests

```bash
npm test
```

This runs:
- Concurrency simulation (simultaneous farmers competing for slot capacity)
- Gate-pass token collision resistance and format verification
- Cancellation capacity restoration rules
- Aadhaar and UPI privacy masking
- Input validation (Zod)
- Status transition validations
- Live database integration checks (when MySQL is reachable)

---

## 6. API Reference & Endpoints

### Standard Response Envelope

**Success (200 / 201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": { ... }
}
```

**Error (400 / 401 / 403 / 404 / 409 / 500):**
```json
{
  "success": false,
  "message": "Insufficient slot capacity. Requested: 10 tons, Available: 5.00 tons",
  "code": "INSUFFICIENT_CAPACITY"
}
```

---

### A. Health & Diagnostics

- `GET /api/v1/health` - Server heartbeat.
- `GET /api/v1/health/db` - Database connectivity verification.

```bash
curl http://localhost:5000/api/v1/health/db
```

---

### B. Mandis

- `GET /api/v1/mandis` - List mandis (filters: `district`, `page`, `limit`).
- `GET /api/v1/mandis/:id` - Get mandi details.
- `GET /api/v1/mandis/:id/slots` - Get slots for a mandi (filters: `date`, `availableOnly`).

```bash
curl "http://localhost:5000/api/v1/mandis/1/slots?availableOnly=true"
```

---

### C. Produce Catalog

- `GET /api/v1/produce` - List all produce (filter: `category`).
- `GET /api/v1/produce/:id` - Get produce details.

```bash
curl "http://localhost:5000/api/v1/produce?category=Grains"
```

---

### D. Farmers

- `POST /api/v1/farmers` - Register a new farmer.
- `GET /api/v1/farmers/:id` - Get farmer profile (Aadhaar masked as `XXXX-XXXX-XXXX`).
- `GET /api/v1/farmers/:id/bookings` - Get booking history for farmer.

```bash
curl -X POST http://localhost:5000/api/v1/farmers \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Kailash Choudhary",
    "Phone": "9898112233",
    "Aadhar_No": "989811223344",
    "UPI_ID": "kailash@upi",
    "Village": "Bardoli"
  }'
```

---

### E. Slot Availability

- `GET /api/v1/slots` - List slots (filters: `mandiId`, `date`, `availableOnly`).
- `GET /api/v1/slots/:id` - Slot details with remaining capacity calculation.
- `GET /api/v1/slots/utilization` - Mandi slot utilization percentages.

---

### F. Bookings & Digital Gate Passes

- `POST /api/v1/bookings` - Concurrency-safe slot reservation.
- `GET /api/v1/bookings/:id` - Booking details.
- `GET /api/v1/bookings/token/:token` - Verify digital gate-pass token.
- `PATCH /api/v1/bookings/:id/cancel` - Cancel booking and atomically restore slot capacity.

**Create Booking Request:**
```bash
curl -X POST http://localhost:5000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "Farmer_ID": 1,
    "Slot_ID": 1,
    "Produce_ID": 1,
    "Estimated_Weight_Tons": 8.5
  }'
```

**Cancel Booking Request:**
```bash
curl -X PATCH http://localhost:5000/api/v1/bookings/1/cancel
```

---

### G. Authentication & Admin Operations

- `POST /api/v1/auth/login` - Admin/Staff login returning JWT token.
- `GET /api/v1/admin/dashboard` - Admin overview dashboard.
- `GET /api/v1/admin/bookings` - Filter bookings by `status`, `date`, `mandiId`, `farmerId`, `token`.
- `PATCH /api/v1/admin/bookings/:id/status` - Transition booking status (`Confirmed` -> `Checked-In` -> `Completed`).
- `GET /api/v1/admin/slots/utilization` - Capacity summary.
- `PATCH /api/v1/admin/transactions/:id/payment-status` - Update payment status (`Pending`, `Released`, `Failed`).

**Admin Login Example:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin@123"}'
```

---

### H. Transactions, Traders & Warehouses

- `GET /api/v1/transactions` - List sale transactions.
- `GET /api/v1/transactions/:id` - Transaction details.
- `POST /api/v1/transactions` - Create transaction (Total amount auto-calculated by DB).
- `GET /api/v1/transactions/summary` - Payment totals and release summaries.
- `GET /api/v1/transactions/traders` - List registered traders.
- `GET /api/v1/transactions/warehouses` - List warehouses and available capacities.

---

### I. Lab 10: PL/SQL Stored Procedures, Cursors & Triggers

- `POST /api/v1/lab10/procedures/farmer/insert` - Calls `Insert_Farmer` stored procedure.
- `PUT /api/v1/lab10/procedures/farmer/update` - Calls `Update_Farmer` stored procedure.
- `DELETE /api/v1/lab10/procedures/farmer/:id` - Calls `Delete_Farmer` stored procedure.
- `GET /api/v1/lab10/cursors/farmers/all` - Explicit cursor without limit (`Display_All_Farmers`).
- `GET /api/v1/lab10/cursors/farmers/first-five` - Explicit cursor with limit (`Display_First_Five_Farmers`).
- `GET /api/v1/lab10/search/paginated` - Paginated procedure search (`Search_Farmers_Paginated`).
- `GET /api/v1/lab10/search/filtered` - Filtered paginated search (`Search_Farmers_Filtered`).
- `GET /api/v1/lab10/functions/total-weight` - Stored function (`Total_Booking_Weight()`).
- `GET /api/v1/lab10/procedures/weight-by-farmer` - Grouped weight procedure (`Total_Weight_By_Farmer`).
- `GET /api/v1/lab10/audit-logs` - View `application_audit_log` records written by AFTER triggers.

---

### J. Lab 11: SQL Statements, Benchmarks & XML Output

- `GET /api/v1/lab11/query1?table=Bookings&format=json` - Query 1: Display all with timing benchmark (`&format=xml` returns XML).
- `POST /api/v1/lab11/query2` - Query 2: Insert data maintaining integrity constraints with benchmark.
- `GET /api/v1/lab11/query3?func=SUM&column=Estimated_Weight_Tons&table=Bookings&format=json` - Query 3: Aggregate function dropdown with timing (`&format=xml` supported).
- `GET /api/v1/lab11/query4?column=Max_Capacity_Tons&operator=>&value=40&format=json` - Query 4: Condition dropdown with timing (`&format=xml` supported).
- `GET /api/v1/lab11/query5?table1=Bookings&table2=Farmers&joinType=INNER+JOIN` - Query 5: Dynamic 2-table JOIN with dropdowns.
- `GET /api/v1/lab11/query6?district=Surat` - Query 6: Subquery with timing.
- `GET /api/v1/lab11/query7` - Query 7: Correlated subquery with timing.
- `POST /api/v1/lab11/query8` - Query 8: Update table data with timing.
- `GET /api/v1/lab11/views/farmer-bookings` - Section C View: `Farmer_Bookings_Detail_View`.
- `GET /api/v1/lab11/views/surat-operations` - Section C View: `Surat_Mandi_Operations_View`.
- `GET /api/v1/lab11/dashboard/statistics` - Section E: Live record count for all tables.

---

## 7. Connecting Next.js Frontend (Phase 2 Guide)

In Phase 2, connect your Next.js application by creating an API client in `frontend/src/lib/api.js`:

```javascript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function fetchMandis() {
  const res = await fetch(`${API_BASE}/mandis`);
  return res.json();
}

export async function createBooking(data) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}
```

Set your Next.js `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```
