# AgriSlot - API Documentation Reference

Base URL: `http://localhost:5001/api/v1`

## Endpoints Summary

### 1. Health
- `GET /health` - Service heartbeat
- `GET /health/db` - Database connectivity
- `GET /health/rig` - Real-time weighbridge load-cells & ANPR camera status

### 2. Mandis
- `GET /mandis` - List APMC Mandis (filters: `district`, `page`, `limit`)
- `GET /mandis/:id` - Get specific mandi details
- `GET /mandis/:id/slots` - Get slots for a mandi (filters: `date`, `availableOnly`)

### 3. Produce
- `GET /produce` - List all produce commodities (filter: `category`)
- `GET /produce/:id` - Get specific produce details

### 4. Farmers
- `GET /farmers` - List registered farmers (filters: `page`, `limit`, `search`)
- `POST /farmers` - Register farmer (supports resilient field names, 10-digit phone, 12-digit Aadhaar)
- `GET /farmers/:id` - Farmer profile (Aadhaar masked as `XXXX-XXXX-0001`)
- `GET /farmers/:id/bookings` - History of bookings for farmer

### 5. Slots
- `GET /slots` - List slots across all mandis (filters: `mandiId`, `date`, `availableOnly`)
- `GET /slots/:id` - Specific slot availability and capacity
- `GET /slots/utilization` - Mandi capacity utilization percentage

### 6. Bookings
- `GET /bookings` - List bookings with optional filters (`status`, `date`, `mandiId`, `farmerId`, `token`)
- `POST /bookings` - Concurrency-safe slot booking with atomic row lock (`SELECT ... FOR UPDATE`)
- `POST /bookings/check-in` - Fast-track weighbridge entry clearance & tare calculation
- `GET /bookings/:id` - Booking record
- `GET /bookings/token/:token` - Verify digital gate-pass token
- `PATCH /bookings/:id/cancel` - Cancel booking and atomically restore slot capacity

### 7. Sale Transactions
- `GET /transactions` - List transactions
- `GET /transactions/:id` - Transaction details
- `POST /transactions` - Record sale (Calculates `Total_Amount` via stored generated column)
- `GET /transactions/summary` - Turnover and payment summary
- `GET /transactions/traders` - List registered traders
- `GET /transactions/warehouses` - List warehouses and available capacities

### 8. Admin (Protected by JWT)
- `POST /auth/login` - Admin login
- `GET /admin/dashboard` - Admin overview metrics
- `GET /admin/bookings` - Filter bookings by `status`, `date`, `mandiId`, `farmerId`, `token`
- `PATCH /admin/bookings/:id/status` - Booking status state machine (`Confirmed` -> `Checked-In` -> `Completed`)
- `PATCH /admin/transactions/:id/payment-status` - Update payment (`Pending`, `Released`, `Failed`)
- `POST /admin/reset-database` - Restore schema, reset counters, and re-insert 25+ seed records per table

### 9. Database Stored Procedures & Automation
- `POST /automation/procedures/farmer/insert` - Calls `Insert_Farmer`
- `PUT /automation/procedures/farmer/update` - Calls `Update_Farmer`
- `DELETE /automation/procedures/farmer/:id` - Calls `Delete_Farmer`
- `GET /automation/cursors/farmers/all` - Explicit cursor without limit
- `GET /automation/cursors/farmers/first-five` - Explicit cursor with limit
- `GET /automation/search/paginated` - Paginated search procedure
- `GET /automation/search/filtered` - Filtered paginated search procedure
- `GET /automation/functions/total-weight` - Stored numeric function
- `GET /automation/procedures/weight-by-farmer` - Grouped weight procedure
- `GET /automation/audit-logs` - View `application_audit_log` records written by triggers

### 10. Advanced SQL Queries & Benchmark Engine
- `GET /analytics/query1` - Display all with timing (`&format=xml` supported)
- `POST /analytics/query2` - Insert data maintaining integrity constraints
- `GET /analytics/query3` - Aggregation dropdown (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)
- `GET /analytics/query4` - Condition dropdown (`=`, `>`, `<`, `<=`, `>=`, `!=`)
- `GET /analytics/query5` - Dynamic 2-table JOIN (`INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`)
- `GET /analytics/query6` - Subquery
- `GET /analytics/query7` - Correlated subquery
- `POST /analytics/query8` - Update table data
- `GET /analytics/views/farmer-bookings` - Detail View
- `GET /analytics/views/surat-operations` - City/District View
- `GET /analytics/dashboard/statistics` - Record count dashboard across all tables
