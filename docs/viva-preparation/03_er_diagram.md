# 03. Entity-Relationship (ER) Diagram & Data Dictionary

## 1. Conceptual & Logical Data Model

The AgriSlot relational data model captures the complete operational lifecycle of an APMC Mandi, including farmer registration, slot scheduling, booking token generation, storage warehousing, trader financial transactions, and RBAC user logins.

---

## 2. Complete Mermaid ER Diagram

```mermaid
erDiagram
    Mandis ||--o{ Slots : "manages (1:N)"
    Mandis ||--o{ Warehouses : "contains (1:N)"
    Produce ||--o{ Bookings : "classified under (1:N)"
    Farmers ||--o{ Bookings : "creates (1:N)"
    Slots ||--o{ Bookings : "allocates capacity to (1:N)"
    Bookings ||--|| Transactions : "settles (1:1)"
    Traders ||--o{ Transactions : "bids and purchases (1:N)"
    Warehouses ||--o{ Transactions : "stores produce (1:N)"
    Farmers ||--o| User_Login : "linked to (1:1)"
    Farmers ||--o{ notifications : "receives (1:N)"
    User_Login ||--o{ notifications : "receives (1:N)"

    Mandis {
        int Mandi_ID PK "Auto Increment"
        varchar Mandi_Name "Mandi Yard Name"
        varchar Location "Physical Address"
        varchar District "Administrative District"
        decimal Total_Daily_Capacity_Tons "Yard Daily Cap (> 0)"
    }

    Produce {
        int Produce_ID PK "Auto Increment"
        varchar Produce_Name "Unique Crop Name"
        enum Category "Grains, Pulses, Fruits, Vegetables, Oilseeds"
        enum Storage_Type "Dry, Cold, Ambient"
    }

    Farmers {
        int Farmer_ID PK "Auto Increment"
        varchar Name "Official Farmer Name"
        varchar Phone "10-Digit Mobile (UNIQUE)"
        varchar Aadhar_No "12-Digit Masked Aadhar (UNIQUE)"
        varchar UPI_ID "Payment VPA"
        varchar Village "Origin Village"
    }

    Slots {
        int Slot_ID PK "Auto Increment"
        int Mandi_ID FK "References Mandis"
        date Slot_Date "Scheduled Date"
        time Start_Time "e.g. 09:00:00"
        time End_Time "e.g. 09:20:00"
        decimal Max_Capacity_Tons "Default 50.00 Tons"
        decimal Booked_Capacity_Tons "Current Reserved Cap"
    }

    Bookings {
        int Booking_ID PK "Auto Increment"
        int Farmer_ID FK "References Farmers"
        int Slot_ID FK "References Slots"
        int Produce_ID FK "References Produce"
        decimal Estimated_Weight_Tons "Delivery Payload (> 0)"
        enum Booking_Status "Confirmed, Checked-In, Completed, Cancelled"
        varchar Token_Number "Alphanumeric Pass (UNIQUE)"
        timestamp Created_At "Default CURRENT_TIMESTAMP"
    }

    Warehouses {
        int Warehouse_ID PK "Auto Increment"
        int Mandi_ID FK "References Mandis"
        enum Warehouse_Type "Dry Storage, Cold Storage, Silo"
        decimal Total_Capacity "Total Capacity in Tons"
        decimal Occupied_Capacity "Current Stock in Tons"
    }

    Traders {
        int Trader_ID PK "Auto Increment"
        varchar Name "Trader / Buyer Name"
        varchar License_No "APMC License Number (UNIQUE)"
        varchar Phone "Contact Mobile"
    }

    Transactions {
        int Txn_ID PK "Auto Increment"
        int Booking_ID FK "References Bookings (UNIQUE 1:1)"
        int Trader_ID FK "References Traders"
        int Warehouse_ID FK "References Warehouses"
        decimal Actual_Weight "Weighbridge Net Weight (> 0)"
        enum Quality_Grade "Grade A, Grade B, Grade C"
        decimal Price_Per_Ton "Auction Rate"
        decimal Total_Amount "Generated: Actual_Weight * Price"
        enum Payment_Status "Pending, Released, Failed"
        timestamp Txn_Date "Settlement Timestamp"
    }

    User_Login {
        int User_ID PK "Auto Increment"
        varchar Username "Unique Username"
        varchar Password_Hash "Bcrypt Hashed String"
        enum User_Role "Admin, Mandi_Officer, Trader, Farmer"
        enum Account_Status "Active, Suspended, Inactive"
        varchar Google_Sub "OAuth 2.0 Identifier (UNIQUE)"
        varchar Email "Verified Email (UNIQUE)"
        varchar Full_Name "Display Name"
        int Farmer_ID FK "References Farmers (1:1, Nullable)"
        timestamp Created_At "Creation Timestamp"
        timestamp Last_Login "Last Sign-In Timestamp"
    }

    application_audit_log {
        int Audit_ID PK "Auto Increment"
        varchar Table_Name "Target Table Name"
        varchar Operation_Type "INSERT, UPDATE, DELETE"
        varchar Record_ID "Affected PK Value"
        json Old_Data "Previous Row Snapshot"
        json New_Data "New Row Snapshot"
        varchar Changed_By "Actor Email / Username"
        timestamp Changed_At "Event Timestamp"
    }

    notifications {
        int Notification_ID PK "Auto Increment"
        int User_ID FK "References User_Login (Nullable)"
        int Farmer_ID FK "References Farmers (Nullable)"
        varchar Title "Alert Headline"
        text Message "Detailed Message Body"
        varchar Type "INFO, SUCCESS, WARNING"
        boolean Is_Read "Status Flag"
        timestamp Created_At "Timestamp"
    }
```

---

## 3. Entity & Attribute Dictionary

### 1. `Mandis` (Agricultural Market Yards)
- **Primary Key:** `Mandi_ID` (INT, AUTO_INCREMENT)
- **Business Description:** Stores geographical and structural information for state-regulated APMC market yards.
- **Constraints:** `Total_Daily_Capacity_Tons > 0`.
- **Cardinality:** `1 : N` with `Slots`, `1 : N` with `Warehouses`.

### 2. `Produce` (Commodity Catalog)
- **Primary Key:** `Produce_ID` (INT, AUTO_INCREMENT)
- **Business Description:** Standardized catalog of agricultural crops eligible for mandi trading.
- **Attributes:** `Produce_Name` (VARCHAR UNIQUE), `Category` (ENUM: Grains, Pulses, Fruits, Vegetables, Oilseeds), `Storage_Type` (ENUM: Dry, Cold, Ambient).
- **Cardinality:** `1 : N` with `Bookings`.

### 3. `Farmers` (Agricultural Producers)
- **Primary Key:** `Farmer_ID` (INT, AUTO_INCREMENT)
- **Business Description:** Master identity directory of verified farmers.
- **Attributes:** `Name`, `Phone` (UNIQUE, 10 digits), `Aadhar_No` (UNIQUE, 12 digits masked), `UPI_ID`, `Village`.
- **Cardinality:** `1 : N` with `Bookings`, `1 : 1` with `User_Login`.

### 4. `Slots` (20-Minute Scheduling Windows)
- **Primary Key:** `Slot_ID` (INT, AUTO_INCREMENT)
- **Foreign Key:** `Mandi_ID` REFERENCES `Mandis(Mandi_ID)` ON DELETE CASCADE.
- **Business Description:** Discrete 20-minute operational time blocks.
- **Constraints:**
  - `CHECK (Max_Capacity_Tons > 0)`
  - `CHECK (Booked_Capacity_Tons >= 0 AND Booked_Capacity_Tons <= Max_Capacity_Tons)`
  - `CHECK (End_Time > Start_Time)`
- **Cardinality:** `1 : N` with `Bookings`.

### 5. `Bookings` (Delivery Reservations & Gate Passes)
- **Primary Key:** `Booking_ID` (INT, AUTO_INCREMENT)
- **Foreign Keys:**
  - `Farmer_ID` REFERENCES `Farmers(Farmer_ID)`
  - `Slot_ID` REFERENCES `Slots(Slot_ID)`
  - `Produce_ID` REFERENCES `Produce(Produce_ID)`
- **Attributes:** `Estimated_Weight_Tons` (CHECK > 0), `Booking_Status` (`Confirmed`, `Checked-In`, `Completed`, `Cancelled`), `Token_Number` (UNIQUE pass code, e.g. `AG-T001`).
- **Cardinality:** `1 : 1` with `Transactions`.

### 6. `Warehouses` (Mandi Storage Units)
- **Primary Key:** `Warehouse_ID` (INT, AUTO_INCREMENT)
- **Foreign Key:** `Mandi_ID` REFERENCES `Mandis(Mandi_ID)`.
- **Constraints:** `CHECK (Total_Capacity > 0 AND Occupied_Capacity <= Total_Capacity)`.
- **Cardinality:** `1 : N` with `Transactions`.

### 7. `Traders` (Commission Agents & Buyers)
- **Primary Key:** `Trader_ID` (INT, AUTO_INCREMENT)
- **Attributes:** `Name`, `License_No` (UNIQUE), `Phone`.
- **Cardinality:** `1 : N` with `Transactions`.

### 8. `Transactions` (Financial Settlements)
- **Primary Key:** `Txn_ID` (INT, AUTO_INCREMENT)
- **Foreign Keys:**
  - `Booking_ID` REFERENCES `Bookings(Booking_ID)` (UNIQUE — exactly one transaction per booking)
  - `Trader_ID` REFERENCES `Traders(Trader_ID)`
  - `Warehouse_ID` REFERENCES `Warehouses(Warehouse_ID)`
- **Generated Column:** `Total_Amount DECIMAL(12,2) GENERATED ALWAYS AS (Actual_Weight * Price_Per_Ton) STORED`.
- **Attributes:** `Actual_Weight`, `Quality_Grade`, `Price_Per_Ton`, `Payment_Status` (`Pending`, `Released`, `Failed`).

### 9. `User_Login` (Authentication & RBAC)
- **Primary Key:** `User_ID` (INT, AUTO_INCREMENT)
- **Foreign Key:** `Farmer_ID` REFERENCES `Farmers(Farmer_ID)` ON DELETE SET NULL.
- **Attributes:** `Username` (UNIQUE), `Password_Hash`, `User_Role` (`Admin`, `Mandi_Officer`, `Trader`, `Farmer`), `Account_Status`, `Google_Sub`, `Email` (UNIQUE).

### 10. `application_audit_log` (System Audit Trail)
- **Primary Key:** `Audit_ID` (INT, AUTO_INCREMENT)
- **Attributes:** `Table_Name`, `Operation_Type`, `Record_ID`, `Old_Data` (JSON), `New_Data` (JSON), `Changed_By`, `Changed_At`.

### 11. `notifications` (In-App Notifications)
- **Primary Key:** `Notification_ID` (INT, AUTO_INCREMENT)
- **Foreign Keys:** `User_ID`, `Farmer_ID`.
- **Attributes:** `Title`, `Message`, `Type`, `Is_Read`, `Created_At`.
