# 04. Relational Schema & 3NF Normalization

## 1. Normalization Walkthrough (1NF to 3NF)

The AgriSlot database is rigorously designed in **Third Normal Form (3NF)** to guarantee zero insertion, update, or deletion anomalies.

### First Normal Form (1NF)
- **Requirement:** Every column must hold atomic (indivisible) values, and there must be no repeating groups or multi-valued attributes.
- **AgriSlot Implementation:**
  - Produce categories and storage types are not comma-delimited strings inside `Mandis`; they reside in an enumerated `Produce` table.
  - Farmer contact details (phone, Aadhaar) are stored as individual scalar values, not nested structures.
  - Slot scheduling does not store arrays of times; each 20-minute window is a discrete row in `Slots`.

### Second Normal Form (2NF)
- **Requirement:** The table must be in 1NF, and every non-prime attribute must be **fully functionally dependent** on the whole candidate key (no partial dependencies).
- **AgriSlot Implementation:**
  - In a naive design, a booking table might use composite key `(Farmer_ID, Slot_ID)` and store `Farmer_Name`, `Mandi_Location`, and `Slot_Start_Time`. In such a table, `Farmer_Name` would depend only on `Farmer_ID` (partial dependency).
  - AgriSlot separates these entities into `Farmers`, `Mandis`, `Slots`, and `Bookings`. In `Bookings`, non-key attributes (`Estimated_Weight_Tons`, `Booking_Status`, `Token_Number`) depend entirely on the surrogate primary key `Booking_ID`.

### Third Normal Form (3NF)
- **Requirement:** The table must be in 2NF, and there must be **no transitive dependencies** (no non-prime attribute may depend on another non-prime attribute, i.e., $X \rightarrow Y$ where $Y \rightarrow Z$).
- **AgriSlot Implementation:**
  - In `Slots`, we store `Mandi_ID` as a foreign key, but we do **not** store `District` or `Total_Daily_Capacity_Tons`. If we stored `District` in `Slots`, we would have $Slot\_ID \rightarrow Mandi\_ID \rightarrow District$ (a transitive dependency).
  - To view district or mandi name alongside a slot, the system executes an `INNER JOIN` between `Slots` and `Mandis`.

---

## 2. Complete Relational Table Definitions (DDL)

```sql
-- 1. MANDIS TABLE
CREATE TABLE Mandis (
    Mandi_ID INT AUTO_INCREMENT PRIMARY KEY,
    Mandi_Name VARCHAR(100) NOT NULL,
    Location VARCHAR(100) NOT NULL,
    District VARCHAR(50) NOT NULL,
    Total_Daily_Capacity_Tons DECIMAL(10,2) NOT NULL,
    CHECK (Total_Daily_Capacity_Tons > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. PRODUCE TABLE
CREATE TABLE Produce (
    Produce_ID INT AUTO_INCREMENT PRIMARY KEY,
    Produce_Name VARCHAR(50) NOT NULL UNIQUE,
    Category ENUM('Grains', 'Pulses', 'Fruits', 'Vegetables', 'Oilseeds') NOT NULL,
    Storage_Type ENUM('Dry', 'Cold', 'Ambient') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. FARMERS TABLE
CREATE TABLE Farmers (
    Farmer_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) UNIQUE NOT NULL,
    Aadhar_No VARCHAR(12) UNIQUE NOT NULL,
    UPI_ID VARCHAR(50),
    Village VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. SLOTS TABLE (20-Minute Scheduling Windows)
CREATE TABLE Slots (
    Slot_ID INT AUTO_INCREMENT PRIMARY KEY,
    Mandi_ID INT NOT NULL,
    Slot_Date DATE NOT NULL,
    Start_Time TIME NOT NULL,
    End_Time TIME NOT NULL,
    Max_Capacity_Tons DECIMAL(8,2) NOT NULL,
    Booked_Capacity_Tons DECIMAL(8,2) DEFAULT 0.00,
    CONSTRAINT fk_slots_mandi FOREIGN KEY (Mandi_ID) REFERENCES Mandis(Mandi_ID) ON DELETE CASCADE,
    CONSTRAINT chk_slot_capacity CHECK (
        Max_Capacity_Tons > 0 
        AND Booked_Capacity_Tons >= 0 
        AND Booked_Capacity_Tons <= Max_Capacity_Tons
    ),
    CONSTRAINT chk_slot_time CHECK (End_Time > Start_Time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. BOOKINGS TABLE (Tokens & Reservations)
CREATE TABLE Bookings (
    Booking_ID INT AUTO_INCREMENT PRIMARY KEY,
    Farmer_ID INT NOT NULL,
    Slot_ID INT NOT NULL,
    Produce_ID INT NOT NULL,
    Estimated_Weight_Tons DECIMAL(6,2) NOT NULL,
    Booking_Status ENUM('Confirmed', 'Checked-In', 'Completed', 'Cancelled') DEFAULT 'Confirmed',
    Token_Number VARCHAR(20) UNIQUE NOT NULL,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_estimated_weight CHECK (Estimated_Weight_Tons > 0),
    FOREIGN KEY (Farmer_ID) REFERENCES Farmers(Farmer_ID),
    FOREIGN KEY (Slot_ID) REFERENCES Slots(Slot_ID),
    FOREIGN KEY (Produce_ID) REFERENCES Produce(Produce_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. WAREHOUSES TABLE
CREATE TABLE Warehouses (
    Warehouse_ID INT AUTO_INCREMENT PRIMARY KEY,
    Mandi_ID INT NOT NULL,
    Warehouse_Type ENUM('Dry Storage', 'Cold Storage', 'Silo') NOT NULL,
    Total_Capacity DECIMAL(10,2) NOT NULL,
    Occupied_Capacity DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (Mandi_ID) REFERENCES Mandis(Mandi_ID),
    CHECK (Total_Capacity > 0 AND Occupied_Capacity >= 0 AND Occupied_Capacity <= Total_Capacity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. TRADERS TABLE
CREATE TABLE Traders (
    Trader_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    License_No VARCHAR(50) UNIQUE NOT NULL,
    Phone VARCHAR(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. TRANSACTIONS TABLE (1:1 Settlement with Booking)
CREATE TABLE Transactions (
    Txn_ID INT AUTO_INCREMENT PRIMARY KEY,
    Booking_ID INT UNIQUE NOT NULL,
    Trader_ID INT NOT NULL,
    Warehouse_ID INT NOT NULL,
    Actual_Weight DECIMAL(6,2) NOT NULL,
    Quality_Grade ENUM('Grade A', 'Grade B', 'Grade C') NOT NULL,
    Price_Per_Ton DECIMAL(10,2) NOT NULL,
    Total_Amount DECIMAL(12,2) GENERATED ALWAYS AS (Actual_Weight * Price_Per_Ton) STORED,
    Payment_Status ENUM('Pending', 'Released', 'Failed') DEFAULT 'Pending',
    Txn_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (Actual_Weight > 0),
    CHECK (Price_Per_Ton >= 0),
    FOREIGN KEY (Booking_ID) REFERENCES Bookings(Booking_ID),
    FOREIGN KEY (Trader_ID) REFERENCES Traders(Trader_ID),
    FOREIGN KEY (Warehouse_ID) REFERENCES Warehouses(Warehouse_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. USER_LOGIN TABLE (RBAC & 1:1 Farmer Profile Link)
CREATE TABLE User_Login (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(100) NOT NULL UNIQUE,
    Password_Hash VARCHAR(255) NOT NULL,
    User_Role ENUM('Admin', 'Mandi_Officer', 'Trader', 'Farmer') NOT NULL DEFAULT 'Farmer',
    Account_Status ENUM('Active', 'Suspended', 'Inactive') NOT NULL DEFAULT 'Active',
    Google_Sub VARCHAR(100) UNIQUE NULL,
    Email VARCHAR(150) UNIQUE NULL,
    Full_Name VARCHAR(150) NULL,
    Avatar_Url VARCHAR(500) NULL,
    Farmer_ID INT NULL,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_Login TIMESTAMP NULL,
    INDEX idx_user_google_sub (Google_Sub),
    INDEX idx_user_email (Email),
    CONSTRAINT fk_user_farmer FOREIGN KEY (Farmer_ID) REFERENCES Farmers(Farmer_ID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. APPLICATION_AUDIT_LOG TABLE
CREATE TABLE application_audit_log (
    Audit_ID INT AUTO_INCREMENT PRIMARY KEY,
    Table_Name VARCHAR(50) NOT NULL,
    Operation_Type VARCHAR(20) NOT NULL,
    Record_ID VARCHAR(50) NOT NULL,
    Old_Data JSON NULL,
    New_Data JSON NULL,
    Changed_By VARCHAR(100) NULL,
    Changed_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    Notification_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NULL,
    Farmer_ID INT NULL,
    Title VARCHAR(150) NOT NULL,
    Message TEXT NOT NULL,
    Type VARCHAR(50) DEFAULT 'INFO',
    Related_Entity_Type VARCHAR(50) NULL,
    Related_Entity_ID VARCHAR(50) NULL,
    Is_Read BOOLEAN DEFAULT FALSE,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notif_farmer (Farmer_ID),
    INDEX idx_notif_user (User_ID),
    INDEX idx_notif_read (Is_Read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 3. Referential Integrity & Foreign Key Policies

1. **`ON DELETE CASCADE` (`fk_slots_mandi`):** If a Mandi yard is removed from the system, all associated time slots are automatically removed, preventing orphaned slot records.
2. **`ON DELETE SET NULL` (`fk_user_farmer`):** If a farmer's directory entry is removed or merged, their associated `User_Login` account retains its administrative identity, but the `Farmer_ID` reference gracefully sets to `NULL`.
3. **`RESTRICT / NO ACTION` (Default on Bookings):** A Farmer cannot be deleted if active bookings exist in `Bookings`. This prevents data loss and maintains historical audit integrity.

---

## 4. Virtual Generated Columns

In the `Transactions` table:
```sql
Total_Amount DECIMAL(12,2) GENERATED ALWAYS AS (Actual_Weight * Price_Per_Ton) STORED
```
- **Why Generated?** Prevents data synchronization discrepancies where total amount might conflict with the product of actual weight and unit rate.
- **Why STORED?** A `STORED` generated column is physically written to disk on row insertion/update. This allows the database to build B-Tree indexes on `Total_Amount` and execute fast financial aggregate queries (`SUM(Total_Amount)`) without recalculating the value on every read.
