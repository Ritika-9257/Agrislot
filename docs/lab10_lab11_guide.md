# AgriSlot - Lab 10 & Lab 11 Documentation

## 1. Lab 10: PL/SQL Implementation

All procedures, functions, cursors, triggers, and roles are defined in `database/lab10_procedures_triggers.sql`:

1. **Stored Procedures for CRUD**:
   - `Insert_Farmer(Name, Phone, Aadhar_No, UPI_ID, Village)`
   - `Update_Farmer(Farmer_ID, Name, Phone, Aadhar_No, UPI_ID, Village)`
   - `Delete_Farmer(Farmer_ID)`
2. **Roles and Grants**:
   - `naive_role`: Granted `SELECT` on `Farmers`.
   - `app_developer_role`: Granted `SELECT, INSERT, UPDATE, DELETE` on `Farmers`, `Slots`, `Bookings`.
   - `dba_role`: Granted `ALL PRIVILEGES` on `agrislot.*`.
3. **User Login Stored Procedures**:
   - `Insert_Login(Username, Password_Hash, User_Role)`
   - `Update_Login(User_ID, Username, User_Role, Account_Status)`
   - `Delete_Login(User_ID)`
   - `Check_Login(Username)`
4. **Explicit Cursors**:
   - `Display_All_Farmers`: Uses explicit cursor loop without limit.
   - `Display_First_Five_Farmers`: Uses explicit cursor loop with `LIMIT 5`.
5. **Paginated Search**:
   - `Search_Farmers_Paginated(Page, Page_Size)`
   - `Search_Farmers_Filtered(Village, Page, Page_Size)`
6. **Numeric Column Sum**:
   - Stored Function `Total_Booking_Weight()`: Returns overall sum of `Estimated_Weight_Tons`.
   - Stored Procedure `Total_Weight_By_Farmer()`: Returns booking weight sum grouped by farmer.
7. **BEFORE Integrity Triggers**:
   - `Before_Farmer_Insert` & `Before_Farmer_Update`: Validates farmer name is non-empty and phone is exactly 10 digits (`^[0-9]{10}$`).
8. **Uppercase Statement Triggers**:
   - `Uppercase_Farmer_Insert` & `Uppercase_Farmer_Update`: Converts Name and Village to UPPERCASE.
9. **AFTER Audit Logging Triggers**:
   - `Audit_Farmer_Insert`, `Audit_Farmer_Update`, `Audit_Farmer_Delete`: Logs modifications to `application_audit_log` with JSON before/after snapshots.
10. **Office Hours Modification Restriction Triggers**:
   - `Restrict_Farmer_Insert`, `Restrict_Farmer_Update`, `Restrict_Farmer_Delete`: Rejects modifications on Monday between 2:00 PM and 4:00 PM with SQLSTATE 45000.

---

## 2. Lab 11: SQL Statements, Indexes, Views & Frontend

All queries, indexes, and views are defined in `database/lab11_queries_views_indexes.sql`:

- **Query 1**: Display all data from table (e.g. `SELECT * FROM Bookings;`).
- **Query 2**: Insert data maintaining constraints.
- **Query 3**: Aggregate functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`).
- **Query 4**: Conditional query with operators (`=`, `!=`, `>`, `<`, `>=`, `<=`, `LIKE`).
- **Query 5**: Dynamic 2-table JOIN (`INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`).
- **Query 6**: Subquery across multiple tables.
- **Query 7**: Correlated subquery.
- **Query 8**: Update table data with constraint checks.
- **Section B Indexes**:
  - `idx_bookings_farmer_slot` on `Bookings(Farmer_ID, Slot_ID)`
  - `idx_slots_mandi_date` on `Slots(Mandi_ID, Slot_Date)`
  - `idx_farmers_village` on `Farmers(Village)`
  - `idx_transactions_payment_status` on `Transactions(Payment_Status)`
  - `idx_mandis_district` on `Mandis(District)`
- **Section C Views**:
  - `Farmer_Bookings_Detail_View`
  - `Surat_Mandi_Operations_View`
  - Procedure `Display_Surat_Operations_View()`
  - View trigger `Validate_Booking_Slot_Capacity`
- **Section D & E Frontend**:
  - Interactive web interface served at `http://localhost:5000/`.
- **Section F XML Format**:
  - Pass `?format=xml` to Queries 1, 3, and 4 to receive formatted XML.
