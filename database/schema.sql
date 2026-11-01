-- =======================================================
-- AgriSlot Database Schema
-- =======================================================

CREATE DATABASE IF NOT EXISTS agrislot;
USE agrislot;

-- Disable foreign key checks and drop stale tables/triggers if they exist
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Transactions;
DROP TABLE IF EXISTS Bookings;
DROP TABLE IF EXISTS Warehouses;
DROP TABLE IF EXISTS Slots;
DROP TABLE IF EXISTS Farmers;
DROP TABLE IF EXISTS Produce;
DROP TABLE IF EXISTS Traders;
DROP TABLE IF EXISTS Mandis;
DROP TABLE IF EXISTS User_Login;
DROP TABLE IF EXISTS application_audit_log;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. MANDIS
CREATE TABLE Mandis (
    Mandi_ID INT AUTO_INCREMENT PRIMARY KEY,
    Mandi_Name VARCHAR(100) NOT NULL,
    Location VARCHAR(100) NOT NULL,
    District VARCHAR(50) NOT NULL,
    Total_Daily_Capacity_Tons DECIMAL(10,2) NOT NULL,
    CHECK (Total_Daily_Capacity_Tons > 0)
);

-- 2. PRODUCE
CREATE TABLE Produce (
    Produce_ID INT AUTO_INCREMENT PRIMARY KEY,
    Produce_Name VARCHAR(50) NOT NULL UNIQUE,
    Category ENUM(
        'Grains', 'Pulses', 'Fruits',
        'Vegetables', 'Oilseeds'
    ) NOT NULL,
    Storage_Type ENUM(
        'Dry', 'Cold', 'Ambient'
    ) NOT NULL
);

-- 3. FARMERS
CREATE TABLE Farmers (
    Farmer_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) UNIQUE NOT NULL,
    Aadhar_No VARCHAR(12) UNIQUE NOT NULL,
    UPI_ID VARCHAR(50),
    Village VARCHAR(100)
);

-- 4. SLOTS
CREATE TABLE Slots (
    Slot_ID INT AUTO_INCREMENT PRIMARY KEY,
    Mandi_ID INT NOT NULL,
    Slot_Date DATE NOT NULL,
    Start_Time TIME NOT NULL,
    End_Time TIME NOT NULL,
    Max_Capacity_Tons DECIMAL(8,2) NOT NULL,
    Booked_Capacity_Tons DECIMAL(8,2) DEFAULT 0.00,

    CONSTRAINT fk_slots_mandi
        FOREIGN KEY (Mandi_ID)
        REFERENCES Mandis(Mandi_ID)
        ON DELETE CASCADE,

    CONSTRAINT chk_slot_capacity
        CHECK (
            Max_Capacity_Tons > 0
            AND Booked_Capacity_Tons >= 0
            AND Booked_Capacity_Tons <= Max_Capacity_Tons
        ),

    CONSTRAINT chk_slot_time
        CHECK (End_Time > Start_Time)
);

-- 5. BOOKINGS
CREATE TABLE Bookings (
    Booking_ID INT AUTO_INCREMENT PRIMARY KEY,
    Farmer_ID INT NOT NULL,
    Slot_ID INT NOT NULL,
    Produce_ID INT NOT NULL,
    Estimated_Weight_Tons DECIMAL(6,2) NOT NULL,
    Booking_Status ENUM(
        'Confirmed', 'Checked-In',
        'Completed', 'Cancelled'
    ) DEFAULT 'Confirmed',
    Token_Number VARCHAR(20) UNIQUE NOT NULL,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_estimated_weight
        CHECK (Estimated_Weight_Tons > 0),

    FOREIGN KEY (Farmer_ID)
        REFERENCES Farmers(Farmer_ID),

    FOREIGN KEY (Slot_ID)
        REFERENCES Slots(Slot_ID),

    FOREIGN KEY (Produce_ID)
        REFERENCES Produce(Produce_ID)
);

-- 6. WAREHOUSES
CREATE TABLE Warehouses (
    Warehouse_ID INT AUTO_INCREMENT PRIMARY KEY,
    Mandi_ID INT NOT NULL,
    Warehouse_Type ENUM(
        'Dry Storage', 'Cold Storage', 'Silo'
    ) NOT NULL,
    Total_Capacity DECIMAL(10,2) NOT NULL,
    Occupied_Capacity DECIMAL(10,2) DEFAULT 0.00,

    FOREIGN KEY (Mandi_ID)
        REFERENCES Mandis(Mandi_ID),

    CHECK (
        Total_Capacity > 0
        AND Occupied_Capacity >= 0
        AND Occupied_Capacity <= Total_Capacity
    )
);

-- 7. TRADERS
CREATE TABLE Traders (
    Trader_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    License_No VARCHAR(50) UNIQUE NOT NULL,
    Phone VARCHAR(15) NOT NULL
);

-- 8. TRANSACTIONS
CREATE TABLE Transactions (
    Txn_ID INT AUTO_INCREMENT PRIMARY KEY,
    Booking_ID INT UNIQUE NOT NULL,
    Trader_ID INT NOT NULL,
    Warehouse_ID INT NOT NULL,
    Actual_Weight DECIMAL(6,2) NOT NULL,
    Quality_Grade ENUM(
        'Grade A', 'Grade B', 'Grade C'
    ) NOT NULL,
    Price_Per_Ton DECIMAL(10,2) NOT NULL,

    Total_Amount DECIMAL(12,2)
        GENERATED ALWAYS AS (
            Actual_Weight * Price_Per_Ton
        ) STORED,

    Payment_Status ENUM(
        'Pending', 'Released', 'Failed'
    ) DEFAULT 'Pending',

    Txn_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (Actual_Weight > 0),
    CHECK (Price_Per_Ton >= 0),

    FOREIGN KEY (Booking_ID)
        REFERENCES Bookings(Booking_ID),

    FOREIGN KEY (Trader_ID)
        REFERENCES Traders(Trader_ID),

    FOREIGN KEY (Warehouse_ID)
        REFERENCES Warehouses(Warehouse_ID)
);

-- 9. USER_LOGIN (For Admin, Mandi Officer, Trader, and Farmer Authentication)
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
    CONSTRAINT fk_user_farmer
        FOREIGN KEY (Farmer_ID)
        REFERENCES Farmers(Farmer_ID)
        ON DELETE SET NULL
);

-- 10. APPLICATION_AUDIT_LOG
CREATE TABLE application_audit_log (
    Audit_ID INT AUTO_INCREMENT PRIMARY KEY,
    Table_Name VARCHAR(50) NOT NULL,
    Operation_Type VARCHAR(20) NOT NULL,
    Record_ID VARCHAR(50) NOT NULL,
    Old_Data JSON NULL,
    New_Data JSON NULL,
    Changed_By VARCHAR(100) NULL,
    Changed_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. NOTIFICATIONS (In-App Alerts for Bookings, Payments, and Clearance)
CREATE TABLE IF NOT EXISTS notifications (
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
);
