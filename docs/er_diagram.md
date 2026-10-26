# AgriSlot - Entity-Relationship (ER) Diagram & Schema Specification

This document provides the complete Entity-Relationship specification and Relational Schema architecture for the **AgriSlot APMC Mandi Logistics Management System**.

---

## 1. Visual Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    MANDIS ||--o{ SLOTS : operates
    MANDIS ||--o{ BOOKINGS : manages
    PRODUCE ||--o{ BOOKINGS : categorized_by
    FARMERS ||--o{ BOOKINGS : reserves
    SLOTS ||--o{ BOOKINGS : allocates
    BOOKINGS ||--o{ TRANSACTIONS : settles
    TRADERS ||--o{ TRANSACTIONS : purchases
    WAREHOUSES ||--o{ TRANSACTIONS : stores

    MANDIS {
        int Mandi_ID PK
        varchar Name
        varchar Location
        varchar District
        varchar State
        decimal Capacity_Per_Day
    }

    PRODUCE {
        int Produce_ID PK
        varchar Name
        varchar Category
        varchar Season
        decimal Standard_MSP
    }

    FARMERS {
        int Farmer_ID PK
        varchar Name
        varchar Phone UK
        varchar Aadhar_No UK
        varchar UPI_ID
        varchar Village
        varchar District
        varchar State
    }

    SLOTS {
        int Slot_ID PK
        int Mandi_ID FK
        date Slot_Date
        time Start_Time
        time End_Time
        decimal Max_Capacity_Tons
        decimal Booked_Capacity_Tons
    }

    BOOKINGS {
        int Booking_ID PK
        int Farmer_ID FK
        int Slot_ID FK
        int Produce_ID FK
        decimal Estimated_Weight_Tons
        enum Booking_Status
        varchar Token_Number UK
        datetime Created_At
    }

    WAREHOUSES {
        int Warehouse_ID PK
        varchar Warehouse_Name
        varchar Location
        varchar Type
        decimal Capacity_Tons
    }

    TRADERS {
        int Trader_ID PK
        varchar Name
        varchar License_No UK
        varchar Phone
        varchar Firm_Name
    }

    TRANSACTIONS {
        int Transaction_ID PK
        int Booking_ID FK
        int Trader_ID FK
        int Warehouse_ID FK
        decimal Actual_Weight_Tons
        varchar Quality_Grade
        decimal Price_Per_Ton
        decimal Total_Amount "Generated Column"
        enum Payment_Status
        datetime Transaction_Date
    }

    USER_LOGIN {
        int User_ID PK
        varchar Username UK
        varchar Password_Hash
        enum Role
    }

    APPLICATION_AUDIT_LOG {
        int Log_ID PK
        varchar Event_Type
        int Record_ID
        json Payload
        varchar User_IP
        datetime Created_At
    }
```

---

## 2. Relational Cardinality & Referential Integrity

| Relationship | Cardinality | Parent Table | Child Table | Foreign Key Column | Delete Rule | Update Rule |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **Mandi to Slots** | `1 : N` | `Mandis` | `Slots` | `Slots.Mandi_ID` | `RESTRICT` | `CASCADE` |
| **Farmer to Bookings** | `1 : N` | `Farmers` | `Bookings` | `Bookings.Farmer_ID` | `RESTRICT` | `CASCADE` |
| **Slot to Bookings** | `1 : N` | `Slots` | `Bookings` | `Bookings.Slot_ID` | `RESTRICT` | `CASCADE` |
| **Produce to Bookings** | `1 : N` | `Produce` | `Bookings` | `Bookings.Produce_ID` | `RESTRICT` | `CASCADE` |
| **Booking to Transaction**| `1 : 1` | `Bookings` | `Transactions`| `Transactions.Booking_ID` | `CASCADE` | `CASCADE` |
| **Trader to Transactions**| `1 : N` | `Traders` | `Transactions`| `Transactions.Trader_ID` | `RESTRICT` | `CASCADE` |
| **Warehouse to Transactions**| `1 : N` | `Warehouses`| `Transactions`| `Transactions.Warehouse_ID` | `RESTRICT` | `CASCADE` |

---

## 3. Key Constraints & Data Integrity

1. **Pessimistic Concurrency Invariant:**
   $$\sum \text{Bookings.Estimated\_Weight\_Tons} \le \text{Slots.Max\_Capacity\_Tons}$$
   Enforced via `SELECT ... FOR UPDATE` in transaction boundary and verified by AFTER trigger.

2. **Generated Financial Column:**
   $$\text{Transactions.Total\_Amount} = \text{Actual\_Weight\_Tons} \times \text{Price\_Per\_Ton}$$
   Computed natively by MySQL InnoDB engine to prevent arithmetic desynchronization.

3. **Collision-Proof Tokens:**
   - Format: `AG-T` followed by zero-padded sequential integers (e.g., `AG-T001`).
   - Defined as `UNIQUE KEY uk_token (Token_Number)`.

4. **Composite Performance Indexes:**
   - `idx_slots_mandi_date_time (Mandi_ID, Slot_Date, Start_Time)`
   - `idx_bookings_slot_status (Slot_ID, Booking_Status)`
   - `idx_bookings_token (Token_Number)`
