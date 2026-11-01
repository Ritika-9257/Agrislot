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

-- 9. USER_LOGIN (For Admin and Staff Authentication)
CREATE TABLE User_Login (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password_Hash VARCHAR(255) NOT NULL,
    User_Role ENUM('Admin', 'Mandi_Officer', 'Trader', 'Farmer') NOT NULL DEFAULT 'Admin',
    Account_Status ENUM('Active', 'Suspended', 'Inactive') NOT NULL DEFAULT 'Active',
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_Login TIMESTAMP NULL
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
-- Seed Data for AgriSlot

USE agrislot;

-- 1. MANDIS (25 RECORDS)
INSERT INTO Mandis
(Mandi_Name, Location, District, Total_Daily_Capacity_Tons)
VALUES
('APMC Surat', 'Puna Kumbhariya', 'Surat', 500),
('APMC Ahmedabad', 'Jamalpur', 'Ahmedabad', 800),
('APMC Vadodara', 'Sayajipura', 'Vadodara', 400),
('APMC Rajkot', 'Bedi Market Yard', 'Rajkot', 600),
('APMC Anand', 'Anand Market Road', 'Anand', 300),
('APMC Bharuch', 'Zadeshwar', 'Bharuch', 350),
('APMC Valsad', 'Dharampur Road', 'Valsad', 250),
('APMC Navsari', 'Eru Char Rasta', 'Navsari', 300),
('APMC Mehsana', 'Unjha Road', 'Mehsana', 450),
('APMC Junagadh', 'Joshipura', 'Junagadh', 400),
('APMC Bhavnagar', 'Chitra', 'Bhavnagar', 350),
('APMC Jamnagar', 'Hapa', 'Jamnagar', 500),
('APMC Amreli', 'Lathi Road', 'Amreli', 250),
('APMC Palanpur', 'Deesa Road', 'Banaskantha', 450),
('APMC Godhra', 'Lunawada Road', 'Panchmahal', 300),
('APMC Nadiad', 'Pij Road', 'Kheda', 350),
('APMC Morbi', 'Ravapar Road', 'Morbi', 400),
('APMC Porbandar', 'Ranavav Road', 'Porbandar', 200),
('APMC Patan', 'Siddhpur Road', 'Patan', 300),
('APMC Surendranagar', 'Wadhwan Road', 'Surendranagar', 350),
('APMC Gandhinagar', 'Sector 25', 'Gandhinagar', 400),
('APMC Botad', 'Gadhada Road', 'Botad', 200),
('APMC Dahod', 'Station Road', 'Dahod', 250),
('APMC Dwarka', 'Khambhalia Road', 'Devbhumi Dwarka', 200),
('APMC Vyara', 'Songadh Road', 'Tapi', 250)
ON DUPLICATE KEY UPDATE Mandi_Name = VALUES(Mandi_Name);

-- 2. PRODUCE (25 RECORDS)
INSERT INTO Produce
(Produce_Name, Category, Storage_Type)
VALUES
('Wheat', 'Grains', 'Dry'),
('Rice', 'Grains', 'Dry'),
('Maize', 'Grains', 'Dry'),
('Barley', 'Grains', 'Dry'),
('Bajra', 'Grains', 'Dry'),
('Jowar', 'Grains', 'Dry'),
('Chickpeas', 'Pulses', 'Dry'),
('Pigeon Peas', 'Pulses', 'Dry'),
('Green Gram', 'Pulses', 'Dry'),
('Black Gram', 'Pulses', 'Dry'),
('Lentils', 'Pulses', 'Dry'),
('Tomato', 'Vegetables', 'Cold'),
('Potato', 'Vegetables', 'Ambient'),
('Onion', 'Vegetables', 'Ambient'),
('Cauliflower', 'Vegetables', 'Cold'),
('Cabbage', 'Vegetables', 'Cold'),
('Mango', 'Fruits', 'Cold'),
('Banana', 'Fruits', 'Ambient'),
('Apple', 'Fruits', 'Cold'),
('Papaya', 'Fruits', 'Ambient'),
('Groundnut', 'Oilseeds', 'Dry'),
('Mustard Seed', 'Oilseeds', 'Dry'),
('Sesame', 'Oilseeds', 'Dry'),
('Soybean', 'Oilseeds', 'Dry'),
('Sunflower Seed', 'Oilseeds', 'Dry')
ON DUPLICATE KEY UPDATE Produce_Name = VALUES(Produce_Name);

-- 3. FARMERS (25 RECORDS)
INSERT INTO Farmers
(Name, Phone, Aadhar_No, UPI_ID, Village)
VALUES
('Ramesh Patel', '9000000001', '900000000001', 'ramesh1@upi', 'Olpad'),
('Suresh Chaudhary', '9000000002', '900000000002', 'suresh2@upi', 'Bardoli'),
('Mahesh Parmar', '9000000003', '900000000003', 'mahesh3@upi', 'Kamrej'),
('Kiran Desai', '9000000004', '900000000004', 'kiran4@upi', 'Palsana'),
('Arjun Patel', '9000000005', '900000000005', 'arjun5@upi', 'Navsari'),
('Vijay Shah', '9000000006', '900000000006', 'vijay6@upi', 'Anand'),
('Paresh Joshi', '9000000007', '900000000007', 'paresh7@upi', 'Nadiad'),
('Nilesh Rathod', '9000000008', '900000000008', 'nilesh8@upi', 'Bharuch'),
('Deepak Solanki', '9000000009', '900000000009', 'deepak9@upi', 'Valsad'),
('Amit Thakor', '9000000010', '900000000010', 'amit10@upi', 'Mehsana'),
('Bhavesh Parmar', '9000000011', '900000000011', 'bhavesh11@upi', 'Unjha'),
('Manoj Patel', '9000000012', '900000000012', 'manoj12@upi', 'Rajkot'),
('Prakash Gohil', '9000000013', '900000000013', 'prakash13@upi', 'Bhavnagar'),
('Rajesh Makwana', '9000000014', '900000000014', 'rajesh14@upi', 'Amreli'),
('Chirag Trivedi', '9000000015', '900000000015', 'chirag15@upi', 'Godhra'),
('Hetal Patel', '9000000016', '900000000016', 'hetal16@upi', 'Kheda'),
('Dinesh Yadav', '9000000017', '900000000017', 'dinesh17@upi', 'Morbi'),
('Kalpesh Parmar', '9000000018', '900000000018', 'kalpesh18@upi', 'Patan'),
('Mukesh Patel', '9000000019', '900000000019', 'mukesh19@upi', 'Vyara'),
('Ravi Chauhan', '9000000020', '900000000020', 'ravi20@upi', 'Dahod'),
('Anil Baria', '9000000021', '900000000021', 'anil21@upi', 'Botad'),
('Pankaj Shah', '9000000022', '900000000022', 'pankaj22@upi', 'Surendranagar'),
('Gautam Patel', '9000000023', '900000000023', 'gautam23@upi', 'Dwarka'),
('Jignesh Desai', '9000000024', '900000000024', 'jignesh24@upi', 'Junagadh'),
('Harish Rana', '9000000025', '900000000025', 'harish25@upi', 'Gandhinagar')
ON DUPLICATE KEY UPDATE Name = VALUES(Name);

-- 4. SLOTS (25 RECORDS)
INSERT INTO Slots
(Mandi_ID, Slot_Date, Start_Time, End_Time,
 Max_Capacity_Tons, Booked_Capacity_Tons)
VALUES
(1, '2026-10-12', '08:00:00', '10:00:00', 50, 15),
(2, '2026-10-12', '08:00:00', '10:00:00', 80, 25),
(3, '2026-10-12', '09:00:00', '11:00:00', 40, 10),
(4, '2026-10-12', '10:00:00', '12:00:00', 70, 30),
(5, '2026-10-12', '08:00:00', '10:00:00', 35, 12),
(6, '2026-10-13', '08:00:00', '10:00:00', 45, 18),
(7, '2026-10-13', '09:00:00', '11:00:00', 30, 10),
(8, '2026-10-13', '10:00:00', '12:00:00', 40, 20),
(9, '2026-10-13', '08:00:00', '10:00:00', 60, 22),
(10, '2026-10-13', '11:00:00', '13:00:00', 50, 15),
(11, '2026-10-14', '08:00:00', '10:00:00', 45, 16),
(12, '2026-10-14', '09:00:00', '11:00:00', 55, 20),
(13, '2026-10-14', '10:00:00', '12:00:00', 30, 12),
(14, '2026-10-14', '08:00:00', '10:00:00', 65, 25),
(15, '2026-10-14', '11:00:00', '13:00:00', 35, 14),
(16, '2026-10-15', '08:00:00', '10:00:00', 40, 18),
(17, '2026-10-15', '09:00:00', '11:00:00', 50, 20),
(18, '2026-10-15', '10:00:00', '12:00:00', 25, 8),
(19, '2026-10-15', '08:00:00', '10:00:00', 35, 10),
(20, '2026-10-15', '11:00:00', '13:00:00', 45, 20),
(21, '2026-10-16', '08:00:00', '10:00:00', 50, 25),
(22, '2026-10-16', '09:00:00', '11:00:00', 30, 10),
(23, '2026-10-16', '10:00:00', '12:00:00', 40, 15),
(24, '2026-10-16', '08:00:00', '10:00:00', 25, 8),
(25, '2026-10-16', '11:00:00', '13:00:00', 35, 12);

-- 5. BOOKINGS (25 RECORDS)
INSERT INTO Bookings
(Farmer_ID, Slot_ID, Produce_ID, Estimated_Weight_Tons,
 Booking_Status, Token_Number)
VALUES
(1, 1, 1, 10, 'Confirmed', 'AG-T001'),
(2, 2, 2, 15, 'Checked-In', 'AG-T002'),
(3, 3, 3, 8, 'Completed', 'AG-T003'),
(4, 4, 4, 12, 'Confirmed', 'AG-T004'),
(5, 5, 5, 6, 'Completed', 'AG-T005'),
(6, 6, 6, 10, 'Confirmed', 'AG-T006'),
(7, 7, 7, 7, 'Checked-In', 'AG-T007'),
(8, 8, 8, 9, 'Completed', 'AG-T008'),
(9, 9, 9, 11, 'Confirmed', 'AG-T009'),
(10, 10, 10, 8, 'Cancelled', 'AG-T010'),
(11, 11, 11, 13, 'Confirmed', 'AG-T011'),
(12, 12, 12, 5, 'Completed', 'AG-T012'),
(13, 13, 13, 14, 'Checked-In', 'AG-T013'),
(14, 14, 14, 16, 'Confirmed', 'AG-T014'),
(15, 15, 15, 6, 'Completed', 'AG-T015'),
(16, 16, 16, 9, 'Confirmed', 'AG-T016'),
(17, 17, 17, 12, 'Checked-In', 'AG-T017'),
(18, 18, 18, 7, 'Completed', 'AG-T018'),
(19, 19, 19, 10, 'Confirmed', 'AG-T019'),
(20, 20, 20, 8, 'Cancelled', 'AG-T020'),
(21, 21, 21, 15, 'Completed', 'AG-T021'),
(22, 22, 22, 6, 'Confirmed', 'AG-T022'),
(23, 23, 23, 9, 'Checked-In', 'AG-T023'),
(24, 24, 24, 11, 'Completed', 'AG-T024'),
(25, 25, 25, 7, 'Confirmed', 'AG-T025')
ON DUPLICATE KEY UPDATE Token_Number = VALUES(Token_Number);

-- 6. WAREHOUSES (25 RECORDS)
INSERT INTO Warehouses
(Mandi_ID, Warehouse_Type, Total_Capacity, Occupied_Capacity)
VALUES
(1, 'Dry Storage', 200, 80),
(2, 'Silo', 300, 120),
(3, 'Cold Storage', 150, 60),
(4, 'Dry Storage', 180, 75),
(5, 'Silo', 100, 25),
(6, 'Cold Storage', 120, 45),
(7, 'Dry Storage', 160, 50),
(8, 'Silo', 200, 90),
(9, 'Dry Storage', 250, 100),
(10, 'Cold Storage', 130, 40),
(11, 'Silo', 220, 110),
(12, 'Dry Storage', 180, 65),
(13, 'Cold Storage', 100, 30),
(14, 'Silo', 280, 140),
(15, 'Dry Storage', 150, 55),
(16, 'Cold Storage', 125, 45),
(17, 'Silo', 240, 100),
(18, 'Dry Storage', 110, 35),
(19, 'Cold Storage', 130, 50),
(20, 'Silo', 190, 80),
(21, 'Dry Storage', 210, 90),
(22, 'Cold Storage', 100, 25),
(23, 'Silo', 170, 60),
(24, 'Dry Storage', 140, 45),
(25, 'Cold Storage', 115, 35);

-- 7. TRADERS (25 RECORDS)
INSERT INTO Traders
(Name, License_No, Phone)
VALUES
('Shree Traders', 'AGR-LIC-1001', '9100000001'),
('Patel Agro', 'AGR-LIC-1002', '9100000002'),
('Green Harvest Ltd', 'AGR-LIC-1003', '9100000003'),
('Krishna Commodities', 'AGR-LIC-1004', '9100000004'),
('Anand Grain Traders', 'AGR-LIC-1005', '9100000005'),
('Gujarat Agro Trade', 'AGR-LIC-1006', '9100000006'),
('Fresh Crop Traders', 'AGR-LIC-1007', '9100000007'),
('Shakti Enterprises', 'AGR-LIC-1008', '9100000008'),
('Farm Gate Traders', 'AGR-LIC-1009', '9100000009'),
('Royal Grain Market', 'AGR-LIC-1010', '9100000010'),
('Sunrise Agro', 'AGR-LIC-1011', '9100000011'),
('Om Sai Traders', 'AGR-LIC-1012', '9100000012'),
('Agri Commodity House', 'AGR-LIC-1013', '9100000013'),
('National Crop Buyers', 'AGR-LIC-1014', '9100000014'),
('Sardar Agro Agency', 'AGR-LIC-1015', '9100000015'),
('Unity Farm Products', 'AGR-LIC-1016', '9100000016'),
('Prime Harvest Traders', 'AGR-LIC-1017', '9100000017'),
('Western Agro Supply', 'AGR-LIC-1018', '9100000018'),
('New India Traders', 'AGR-LIC-1019', '9100000019'),
('Krishi Market House', 'AGR-LIC-1020', '9100000020'),
('Shivam Grain Traders', 'AGR-LIC-1021', '9100000021'),
('Reliable Agro Link', 'AGR-LIC-1022', '9100000022'),
('National Food Traders', 'AGR-LIC-1023', '9100000023'),
('Unity Crop Buyers', 'AGR-LIC-1024', '9100000024'),
('Prosper Agro Traders', 'AGR-LIC-1025', '9100000025')
ON DUPLICATE KEY UPDATE License_No = VALUES(License_No);

-- 8. TRANSACTIONS (25 RECORDS)
INSERT INTO Transactions
(Booking_ID, Trader_ID, Warehouse_ID, Actual_Weight,
 Quality_Grade, Price_Per_Ton, Payment_Status)
VALUES
(1, 1, 1, 9.8, 'Grade A', 25000, 'Released'),
(2, 2, 2, 14.5, 'Grade B', 22000, 'Pending'),
(3, 3, 3, 7.8, 'Grade A', 30000, 'Released'),
(4, 4, 4, 11.5, 'Grade B', 18000, 'Pending'),
(5, 5, 5, 5.9, 'Grade A', 20000, 'Released'),
(6, 6, 6, 9.7, 'Grade B', 24000, 'Pending'),
(7, 7, 7, 6.8, 'Grade A', 32000, 'Released'),
(8, 8, 8, 8.7, 'Grade C', 15000, 'Failed'),
(9, 9, 9, 10.8, 'Grade A', 28000, 'Released'),
(10, 10, 10, 7.5, 'Grade B', 19000, 'Pending'),
(11, 11, 11, 12.6, 'Grade A', 26000, 'Released'),
(12, 12, 12, 4.8, 'Grade B', 17000, 'Pending'),
(13, 13, 13, 13.5, 'Grade C', 14000, 'Failed'),
(14, 14, 14, 15.5, 'Grade A', 35000, 'Released'),
(15, 15, 15, 5.8, 'Grade B', 21000, 'Pending'),
(16, 16, 16, 8.7, 'Grade A', 23000, 'Released'),
(17, 17, 17, 11.8, 'Grade B', 27000, 'Pending'),
(18, 18, 18, 6.7, 'Grade A', 16000, 'Released'),
(19, 19, 19, 9.8, 'Grade C', 12000, 'Failed'),
(20, 20, 20, 7.5, 'Grade B', 19000, 'Pending'),
(21, 21, 21, 14.7, 'Grade A', 40000, 'Released'),
(22, 22, 22, 5.8, 'Grade B', 18000, 'Pending'),
(23, 23, 23, 8.8, 'Grade A', 22000, 'Released'),
(24, 24, 24, 10.7, 'Grade B', 25000, 'Pending'),
(25, 25, 25, 6.8, 'Grade A', 30000, 'Released')
ON DUPLICATE KEY UPDATE Actual_Weight = VALUES(Actual_Weight);

-- 9. DEFAULT USERS (admin / admin123, officer / officer123, farmer / farmer123)
-- Password hashes generated with bcrypt 10 rounds:
INSERT INTO User_Login (Username, Password_Hash, User_Role, Account_Status)
VALUES 
('admin', '$2a$10$AOon9VKAk6jpNK565cxwv.bUMfcumCdP5HYKdPMg9VhmFvxbIuGii', 'Admin', 'Active'),
('officer', '$2a$10$A96Vwg4xrirPXMosjCFI3OgopW9fjDZKzHx8RoAsd6XUfLCWdENuG', 'Mandi_Officer', 'Active'),
('farmer', '$2a$10$JcuhIdBWuyALP7WW1fsxUeF823ppAd6qqxbmfNslm5OPSndq9E.ty', 'Farmer', 'Active')
ON DUPLICATE KEY UPDATE Password_Hash = VALUES(Password_Hash), User_Role = VALUES(User_Role);
-- =====================================================================
-- AGRISLOT STORED PROCEDURES, CURSORS, FUNCTIONS, AND TRIGGERS
-- Database: agrislot
-- =====================================================================

USE agrislot;

-- ---------------------------------------------------------------------
-- 1. STORED PROCEDURES FOR BACKEND DATA MANIPULATION (CRUD on Farmers)
-- ---------------------------------------------------------------------

-- A. Insertion Procedure
DROP PROCEDURE IF EXISTS Insert_Farmer;
DELIMITER $$
CREATE PROCEDURE Insert_Farmer(
    IN p_Name VARCHAR(100),
    IN p_Phone VARCHAR(20),
    IN p_Aadhar_No VARCHAR(20),
    IN p_UPI_ID VARCHAR(100),
    IN p_Village VARCHAR(100)
)
BEGIN
    INSERT INTO Farmers
        (Name, Phone, Aadhar_No, UPI_ID, Village)
    VALUES
        (p_Name, p_Phone, p_Aadhar_No, p_UPI_ID, p_Village);

    SELECT LAST_INSERT_ID() AS Farmer_ID, 'Farmer inserted successfully' AS Message;
END$$
DELIMITER ;

-- B. Update Procedure
DROP PROCEDURE IF EXISTS Update_Farmer;
DELIMITER $$
CREATE PROCEDURE Update_Farmer(
    IN p_Farmer_ID INT,
    IN p_Name VARCHAR(100),
    IN p_Phone VARCHAR(20),
    IN p_Aadhar_No VARCHAR(20),
    IN p_UPI_ID VARCHAR(100),
    IN p_Village VARCHAR(100)
)
BEGIN
    UPDATE Farmers
    SET Name = p_Name,
        Phone = p_Phone,
        Aadhar_No = p_Aadhar_No,
        UPI_ID = p_UPI_ID,
        Village = p_Village
    WHERE Farmer_ID = p_Farmer_ID;

    IF ROW_COUNT() = 0 THEN
        SELECT 0 AS Success, 'No farmer updated; check the ID or supplied values.' AS Message;
    ELSE
        SELECT 1 AS Success, 'Farmer updated successfully' AS Message;
    END IF;
END$$
DELIMITER ;

-- C. Deletion Procedure
DROP PROCEDURE IF EXISTS Delete_Farmer;
DELIMITER $$
CREATE PROCEDURE Delete_Farmer(
    IN p_Farmer_ID INT
)
BEGIN
    DELETE FROM Farmers
    WHERE Farmer_ID = p_Farmer_ID;

    IF ROW_COUNT() = 0 THEN
        SELECT 0 AS Success, 'No farmer found with this ID.' AS Message;
    ELSE
        SELECT 1 AS Success, 'Farmer deleted successfully' AS Message;
    END IF;
END$$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 2. CREATE USER ACCOUNTS AND ROLES (Naive, Application Developer, DBA)
-- ---------------------------------------------------------------------
CREATE ROLE IF NOT EXISTS 'naive_role';
CREATE ROLE IF NOT EXISTS 'app_developer_role';
CREATE ROLE IF NOT EXISTS 'dba_role';

-- Naive user: read-only access to Farmers
GRANT SELECT ON agrislot.Farmers TO 'naive_role';

-- Application developer: read and modify access
GRANT SELECT, INSERT, UPDATE, DELETE ON agrislot.Farmers TO 'app_developer_role';
GRANT SELECT, INSERT, UPDATE, DELETE ON agrislot.Slots TO 'app_developer_role';
GRANT SELECT, INSERT, UPDATE, DELETE ON agrislot.Bookings TO 'app_developer_role';

-- DBA: database-wide administrative privileges
GRANT ALL PRIVILEGES ON agrislot.* TO 'dba_role';

-- Demo users
CREATE USER IF NOT EXISTS 'naive_user'@'localhost' IDENTIFIED BY 'NaiveDemo_123!';
CREATE USER IF NOT EXISTS 'app_dev'@'localhost' IDENTIFIED BY 'AppDemo_123!';
CREATE USER IF NOT EXISTS 'agrislot_dba'@'localhost' IDENTIFIED BY 'DbaDemo_123!';

GRANT 'naive_role' TO 'naive_user'@'localhost';
GRANT 'app_developer_role' TO 'app_dev'@'localhost';
GRANT 'dba_role' TO 'agrislot_dba'@'localhost';

SET DEFAULT ROLE 'naive_role' TO 'naive_user'@'localhost';
SET DEFAULT ROLE 'app_developer_role' TO 'app_dev'@'localhost';
SET DEFAULT ROLE 'dba_role' TO 'agrislot_dba'@'localhost';

-- ---------------------------------------------------------------------
-- 3. MANAGE USER LOGIN DATA (CRUD & Verification for User_Login)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS User_Login (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password_Hash VARCHAR(255) NOT NULL,
    User_Role ENUM('Admin', 'Mandi_Officer', 'Trader', 'Farmer') NOT NULL DEFAULT 'Admin',
    Account_Status ENUM('Active', 'Suspended', 'Inactive') NOT NULL DEFAULT 'Active',
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_Login TIMESTAMP NULL
);

DROP PROCEDURE IF EXISTS Insert_Login;
DELIMITER $$
CREATE PROCEDURE Insert_Login(
    IN p_Username VARCHAR(50),
    IN p_Password_Hash VARCHAR(255),
    IN p_User_Role VARCHAR(30)
)
BEGIN
    INSERT INTO User_Login
        (Username, Password_Hash, User_Role)
    VALUES
        (p_Username, p_Password_Hash, p_User_Role);
        
    SELECT LAST_INSERT_ID() AS User_ID, 'User login created successfully' AS Message;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS Update_Login;
DELIMITER $$
CREATE PROCEDURE Update_Login(
    IN p_User_ID INT,
    IN p_Username VARCHAR(50),
    IN p_User_Role VARCHAR(30),
    IN p_Account_Status VARCHAR(10)
)
BEGIN
    UPDATE User_Login
    SET Username = p_Username,
        User_Role = p_User_Role,
        Account_Status = p_Account_Status
    WHERE User_ID = p_User_ID;

    SELECT ROW_COUNT() AS Affected_Rows, 'Login updated successfully' AS Message;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS Delete_Login;
DELIMITER $$
CREATE PROCEDURE Delete_Login(
    IN p_User_ID INT
)
BEGIN
    DELETE FROM User_Login
    WHERE User_ID = p_User_ID;

    SELECT ROW_COUNT() AS Affected_Rows, 'Login deleted successfully' AS Message;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS Check_Login;
DELIMITER $$
CREATE PROCEDURE Check_Login(
    IN p_Username VARCHAR(50)
)
BEGIN
    SELECT User_ID, Username, Password_Hash, User_Role, Account_Status
    FROM User_Login
    WHERE Username = p_Username
      AND Account_Status = 'Active';
END$$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 4. EXPLICIT CURSOR PROCEDURES
-- ---------------------------------------------------------------------

-- A. Without limit
DROP PROCEDURE IF EXISTS Display_All_Farmers;
DELIMITER $$
CREATE PROCEDURE Display_All_Farmers()
BEGIN
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_ID INT;
    DECLARE v_Name VARCHAR(100);
    DECLARE v_Village VARCHAR(100);

    DECLARE farmer_cursor CURSOR FOR
        SELECT Farmer_ID, Name, Village
        FROM Farmers
        ORDER BY Farmer_ID;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_done = 1;

    DROP TEMPORARY TABLE IF EXISTS Temp_Farmers_List;
    CREATE TEMPORARY TABLE Temp_Farmers_List (
        Farmer_ID INT,
        Farmer_Name VARCHAR(100),
        Village VARCHAR(100)
    );

    OPEN farmer_cursor;
    read_loop: LOOP
        FETCH farmer_cursor INTO v_ID, v_Name, v_Village;
        IF v_done = 1 THEN
            LEAVE read_loop;
        END IF;

        INSERT INTO Temp_Farmers_List VALUES (v_ID, v_Name, v_Village);
    END LOOP;
    CLOSE farmer_cursor;

    SELECT * FROM Temp_Farmers_List;
    DROP TEMPORARY TABLE IF EXISTS Temp_Farmers_List;
END$$
DELIMITER ;

-- B. With usage of limit
DROP PROCEDURE IF EXISTS Display_First_Five_Farmers;
DELIMITER $$
CREATE PROCEDURE Display_First_Five_Farmers()
BEGIN
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_ID INT;
    DECLARE v_Name VARCHAR(100);

    DECLARE farmer_cursor CURSOR FOR
        SELECT Farmer_ID, Name
        FROM Farmers
        ORDER BY Farmer_ID
        LIMIT 5;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_done = 1;

    DROP TEMPORARY TABLE IF EXISTS Temp_Five_Farmers;
    CREATE TEMPORARY TABLE Temp_Five_Farmers (
        Farmer_ID INT,
        Farmer_Name VARCHAR(100)
    );

    OPEN farmer_cursor;
    read_loop: LOOP
        FETCH farmer_cursor INTO v_ID, v_Name;
        IF v_done = 1 THEN
            LEAVE read_loop;
        END IF;

        INSERT INTO Temp_Five_Farmers VALUES (v_ID, v_Name);
    END LOOP;
    CLOSE farmer_cursor;

    SELECT * FROM Temp_Five_Farmers;
    DROP TEMPORARY TABLE IF EXISTS Temp_Five_Farmers;
END$$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 5. PAGINATED SEARCH PROCEDURES
-- ---------------------------------------------------------------------

-- A. Without filtering conditions
DROP PROCEDURE IF EXISTS Search_Farmers_Paginated;
DELIMITER $$
CREATE PROCEDURE Search_Farmers_Paginated(
    IN p_Page INT,
    IN p_Page_Size INT
)
BEGIN
    DECLARE v_Offset INT;

    IF p_Page < 1 OR p_Page_Size < 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Page and page size must be positive';
    END IF;

    SET v_Offset = (p_Page - 1) * p_Page_Size;

    SELECT Farmer_ID, Name, Phone, Village
    FROM Farmers
    ORDER BY Farmer_ID
    LIMIT p_Page_Size OFFSET v_Offset;
END$$
DELIMITER ;

-- B. With filtering conditions
DROP PROCEDURE IF EXISTS Search_Farmers_Filtered;
DELIMITER $$
CREATE PROCEDURE Search_Farmers_Filtered(
    IN p_Village VARCHAR(100),
    IN p_Page INT,
    IN p_Page_Size INT
)
BEGIN
    DECLARE v_Offset INT;

    IF p_Page < 1 OR p_Page_Size < 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Page and page size must be positive';
    END IF;

    SET v_Offset = (p_Page - 1) * p_Page_Size;

    SELECT Farmer_ID, Name, Phone, Village
    FROM Farmers
    WHERE p_Village IS NULL
       OR p_Village = ''
       OR Village = p_Village
    ORDER BY Farmer_ID
    LIMIT p_Page_Size OFFSET v_Offset;
END$$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 6. FUNCTIONS / PROCEDURES TO RETURN SUM OF NUMERIC COLUMN
-- ---------------------------------------------------------------------

-- A. Without grouping
DROP FUNCTION IF EXISTS Total_Booking_Weight;
DELIMITER $$
CREATE FUNCTION Total_Booking_Weight()
RETURNS DECIMAL(12,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_Total DECIMAL(12,2);

    SELECT COALESCE(SUM(Estimated_Weight_Tons), 0)
    INTO v_Total
    FROM Bookings;

    RETURN v_Total;
END$$
DELIMITER ;

-- B. With grouping
DROP PROCEDURE IF EXISTS Total_Weight_By_Farmer;
DELIMITER $$
CREATE PROCEDURE Total_Weight_By_Farmer()
BEGIN
    SELECT b.Farmer_ID,
           f.Name AS Farmer_Name,
           SUM(b.Estimated_Weight_Tons) AS Total_Weight_Tons,
           COUNT(b.Booking_ID) AS Total_Bookings
    FROM Bookings b
    JOIN Farmers f ON b.Farmer_ID = f.Farmer_ID
    GROUP BY b.Farmer_ID, f.Name
    ORDER BY Total_Weight_Tons DESC;
END$$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 7. BEFORE TRIGGERS: DATA INTEGRITY CONSTRAINTS
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS Before_Farmer_Insert;
DELIMITER $$
CREATE TRIGGER Before_Farmer_Insert
BEFORE INSERT ON Farmers
FOR EACH ROW
BEGIN
    IF NEW.Name IS NULL OR TRIM(NEW.Name) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Farmer name cannot be empty';
    END IF;

    IF NEW.Phone IS NULL
       OR NEW.Phone NOT REGEXP '^[0-9]{10}$' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Phone number must contain exactly 10 digits';
    END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS Before_Farmer_Update;
DELIMITER $$
CREATE TRIGGER Before_Farmer_Update
BEFORE UPDATE ON Farmers
FOR EACH ROW
BEGIN
    IF NEW.Name IS NULL OR TRIM(NEW.Name) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Farmer name cannot be empty';
    END IF;

    IF NEW.Phone IS NULL
       OR NEW.Phone NOT REGEXP '^[0-9]{10}$' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Phone number must contain exactly 10 digits';
    END IF;
END$$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 8. TRIGGERS: CONVERT CHAR/VARCHAR DATA TO UPPERCASE
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS Uppercase_Farmer_Insert;
DELIMITER $$
CREATE TRIGGER Uppercase_Farmer_Insert
BEFORE INSERT ON Farmers
FOR EACH ROW
BEGIN
    SET NEW.Name = UPPER(TRIM(NEW.Name));
    IF NEW.Village IS NOT NULL THEN
        SET NEW.Village = UPPER(TRIM(NEW.Village));
    END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS Uppercase_Farmer_Update;
DELIMITER $$
CREATE TRIGGER Uppercase_Farmer_Update
BEFORE UPDATE ON Farmers
FOR EACH ROW
BEGIN
    SET NEW.Name = UPPER(TRIM(NEW.Name));
    IF NEW.Village IS NOT NULL THEN
        SET NEW.Village = UPPER(TRIM(NEW.Village));
    END IF;
END$$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 9. AFTER TRIGGERS: AUDIT LOGGING INTO application_audit_log
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS application_audit_log (
    Audit_ID INT AUTO_INCREMENT PRIMARY KEY,
    Table_Name VARCHAR(50) NOT NULL,
    Operation_Type VARCHAR(20) NOT NULL,
    Record_ID VARCHAR(50) NOT NULL,
    Old_Data JSON NULL,
    New_Data JSON NULL,
    Changed_By VARCHAR(100) NULL,
    Changed_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS Audit_Farmer_Insert;
DELIMITER $$
CREATE TRIGGER Audit_Farmer_Insert
AFTER INSERT ON Farmers
FOR EACH ROW
BEGIN
    INSERT INTO application_audit_log
        (Table_Name, Operation_Type, Record_ID,
         Old_Data, New_Data, Changed_By)
    VALUES
        ('Farmers', 'INSERT', CAST(NEW.Farmer_ID AS CHAR),
         NULL,
         JSON_OBJECT(
             'Name', NEW.Name,
             'Phone', NEW.Phone,
             'Aadhar_No', NEW.Aadhar_No,
             'UPI_ID', NEW.UPI_ID,
             'Village', NEW.Village
         ),
         CURRENT_USER());
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS Audit_Farmer_Update;
DELIMITER $$
CREATE TRIGGER Audit_Farmer_Update
AFTER UPDATE ON Farmers
FOR EACH ROW
BEGIN
    INSERT INTO application_audit_log
        (Table_Name, Operation_Type, Record_ID,
         Old_Data, New_Data, Changed_By)
    VALUES
        ('Farmers', 'UPDATE', CAST(NEW.Farmer_ID AS CHAR),
         JSON_OBJECT(
             'Name', OLD.Name,
             'Phone', OLD.Phone,
             'Aadhar_No', OLD.Aadhar_No,
             'UPI_ID', OLD.UPI_ID,
             'Village', OLD.Village
         ),
         JSON_OBJECT(
             'Name', NEW.Name,
             'Phone', NEW.Phone,
             'Aadhar_No', NEW.Aadhar_No,
             'UPI_ID', NEW.UPI_ID,
             'Village', NEW.Village
         ),
         CURRENT_USER());
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS Audit_Farmer_Delete;
DELIMITER $$
CREATE TRIGGER Audit_Farmer_Delete
AFTER DELETE ON Farmers
FOR EACH ROW
BEGIN
    INSERT INTO application_audit_log
        (Table_Name, Operation_Type, Record_ID,
         Old_Data, New_Data, Changed_By)
    VALUES
        ('Farmers', 'DELETE', CAST(OLD.Farmer_ID AS CHAR),
         JSON_OBJECT(
             'Name', OLD.Name,
             'Phone', OLD.Phone,
             'Aadhar_No', OLD.Aadhar_No,
             'UPI_ID', OLD.UPI_ID,
             'Village', OLD.Village
         ),
         NULL,
         CURRENT_USER());
END$$
DELIMITER ;

-- ---------------------------------------------------------------------
-- 10. TIME-RESTRICTION TRIGGERS: RESTRICT MODIFICATIONS MONDAY 2-4 PM
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS Restrict_Farmer_Insert;
DELIMITER $$
CREATE TRIGGER Restrict_Farmer_Insert
BEFORE INSERT ON Farmers
FOR EACH ROW
BEGIN
    IF DAYOFWEEK(NOW()) = 2
       AND TIME(NOW()) >= '14:00:00'
       AND TIME(NOW()) < '16:00:00' THEN

        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'Modifications are prohibited on Monday between 2 PM and 4 PM';
    END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS Restrict_Farmer_Update;
DELIMITER $$
CREATE TRIGGER Restrict_Farmer_Update
BEFORE UPDATE ON Farmers
FOR EACH ROW
BEGIN
    IF DAYOFWEEK(NOW()) = 2
       AND TIME(NOW()) >= '14:00:00'
       AND TIME(NOW()) < '16:00:00' THEN

        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'Modifications are prohibited on Monday between 2 PM and 4 PM';
    END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS Restrict_Farmer_Delete;
DELIMITER $$
CREATE TRIGGER Restrict_Farmer_Delete
BEFORE DELETE ON Farmers
FOR EACH ROW
BEGIN
    IF DAYOFWEEK(NOW()) = 2
       AND TIME(NOW()) >= '14:00:00'
       AND TIME(NOW()) < '16:00:00' THEN

        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'Modifications are prohibited on Monday between 2 PM and 4 PM';
    END IF;
END$$
DELIMITER ;
-- =====================================================================
-- AGRISLOT ADVANCED SQL, BENCHMARKING, INDEXING, AND VIEWS
-- Database: agrislot
-- =====================================================================

USE agrislot;

-- ---------------------------------------------------------------------
-- SECTION A: SQL BENCHMARK STATEMENTS
-- Note down execution time for each query before and after indexing.
-- ---------------------------------------------------------------------

-- Query 1: Display all data from one of the main tables
-- (Also supports XML export in Frontend)
SELECT * FROM Bookings;

-- Query 2: Insert data into various tables maintaining integrity constraints
INSERT INTO Farmers (Name, Phone, Aadhar_No, UPI_ID, Village)
VALUES ('Vikram Singhania', '9898001122', '989800112233', 'vikram@upi', 'Surat')
ON DUPLICATE KEY UPDATE Name = VALUES(Name);

-- Query 3: Display ONE AGGREGATE FUNCTION RESULT from one of the main tables
-- (e.g., SUM, AVG, COUNT, MIN, MAX - supports XML export in Frontend)
SELECT 
    COUNT(*) AS Total_Bookings,
    SUM(Estimated_Weight_Tons) AS Total_Estimated_Tons,
    AVG(Estimated_Weight_Tons) AS Avg_Estimated_Tons,
    MIN(Estimated_Weight_Tons) AS Min_Weight_Tons,
    MAX(Estimated_Weight_Tons) AS Max_Weight_Tons
FROM Bookings;

-- Query 4: Display data from one of the main tables using condition
-- (Supports XML export in Frontend)
SELECT * 
FROM Slots 
WHERE Slot_Date >= '2026-10-12' 
  AND Max_Capacity_Tons > 40;

-- Query 5: Display JOIN OPERATIONS on any two tables (INNER, LEFT, RIGHT)
SELECT 
    b.Booking_ID,
    b.Token_Number,
    b.Estimated_Weight_Tons,
    b.Booking_Status,
    f.Name AS Farmer_Name,
    f.Phone AS Farmer_Phone,
    f.Village
FROM Bookings b
INNER JOIN Farmers f ON b.Farmer_ID = f.Farmer_ID;

-- Query 6: Display records using SUBQUERY from more than one different table
-- Find farmers who have confirmed bookings for slots in Mandis located in 'Surat'
SELECT Farmer_ID, Name, Phone, Village
FROM Farmers
WHERE Farmer_ID IN (
    SELECT b.Farmer_ID
    FROM Bookings b
    WHERE b.Slot_ID IN (
        SELECT s.Slot_ID
        FROM Slots s
        JOIN Mandis m ON s.Mandi_ID = m.Mandi_ID
        WHERE m.District = 'Surat'
    )
);

-- Query 7: Display records using CORRELATED SUBQUERY from more than one different table
-- Find bookings where the estimated weight is strictly higher than the average estimated weight for that same slot
SELECT b.Booking_ID, b.Farmer_ID, b.Slot_ID, b.Estimated_Weight_Tons, b.Booking_Status
FROM Bookings b
WHERE b.Estimated_Weight_Tons > (
    SELECT AVG(b2.Estimated_Weight_Tons)
    FROM Bookings b2
    WHERE b2.Slot_ID = b.Slot_ID
);

-- Query 8: Update any one table data
UPDATE Warehouses
SET Occupied_Capacity = Occupied_Capacity + 5.00
WHERE Warehouse_ID = 1 AND (Occupied_Capacity + 5.00) <= Total_Capacity;

-- ---------------------------------------------------------------------
-- SECTION B: INDEX CREATION AND EXECUTION TIME OPTIMIZATION
-- ---------------------------------------------------------------------

-- Index 1: Composite index on Bookings for fast farmer & slot queries
CREATE INDEX idx_bookings_farmer_slot ON Bookings (Farmer_ID, Slot_ID);

-- Index 2: Composite index on Slots for Mandi and Date filtering
CREATE INDEX idx_slots_mandi_date ON Slots (Mandi_ID, Slot_Date);

-- Index 3: Index on Farmers Village for location-based filtering
CREATE INDEX idx_farmers_village ON Farmers (Village);

-- Index 4: Index on Transactions payment status
CREATE INDEX idx_transactions_payment_status ON Transactions (Payment_Status);

-- Index 5: Index on Mandis District
CREATE INDEX idx_mandis_district ON Mandis (District);

-- ---------------------------------------------------------------------
-- SECTION C: CREATE VIEWS FROM TWO TABLES
-- ---------------------------------------------------------------------

-- View 1: Active Bookings with Farmer and Mandi Slot Information
DROP VIEW IF EXISTS Farmer_Bookings_Detail_View;
CREATE VIEW Farmer_Bookings_Detail_View AS
SELECT 
    b.Booking_ID,
    b.Token_Number,
    b.Booking_Status,
    b.Estimated_Weight_Tons,
    b.Created_At,
    f.Farmer_ID,
    f.Name AS Farmer_Name,
    f.Phone AS Farmer_Phone,
    f.Village AS Farmer_Village,
    s.Slot_ID,
    s.Slot_Date,
    s.Start_Time,
    s.End_Time,
    m.Mandi_ID,
    m.Mandi_Name,
    m.District AS Mandi_District,
    p.Produce_Name
FROM Bookings b
JOIN Farmers f ON b.Farmer_ID = f.Farmer_ID
JOIN Slots s ON b.Slot_ID = s.Slot_ID
JOIN Mandis m ON s.Mandi_ID = m.Mandi_ID
JOIN Produce p ON b.Produce_ID = p.Produce_ID;

-- View 2: City/District Specific View (Surat Mandi Operations View)
DROP VIEW IF EXISTS Surat_Mandi_Operations_View;
CREATE VIEW Surat_Mandi_Operations_View AS
SELECT 
    m.Mandi_ID,
    m.Mandi_Name,
    m.District,
    s.Slot_ID,
    s.Slot_Date,
    s.Start_Time,
    s.End_Time,
    s.Max_Capacity_Tons,
    s.Booked_Capacity_Tons,
    (s.Max_Capacity_Tons - s.Booked_Capacity_Tons) AS Remaining_Capacity_Tons
FROM Mandis m
JOIN Slots s ON m.Mandi_ID = s.Mandi_ID
WHERE m.District = 'Surat';

-- C.1: Stored Procedure to Display Data from View
DROP PROCEDURE IF EXISTS Display_Surat_Operations_View;
DELIMITER $$
CREATE PROCEDURE Display_Surat_Operations_View()
BEGIN
    SELECT * FROM Surat_Mandi_Operations_View;
END$$
DELIMITER ;

-- C.2: Trigger Validation on Base Table affecting View
-- When a booking is inserted or modified, validate that capacity is respected
DROP TRIGGER IF EXISTS Validate_Booking_Slot_Capacity;
DELIMITER $$
CREATE TRIGGER Validate_Booking_Slot_Capacity
BEFORE INSERT ON Bookings
FOR EACH ROW
BEGIN
    DECLARE v_Remaining DECIMAL(8,2);
    
    SELECT (Max_Capacity_Tons - Booked_Capacity_Tons)
    INTO v_Remaining
    FROM Slots
    WHERE Slot_ID = NEW.Slot_ID;
    
    IF v_Remaining IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Specified Slot ID does not exist';
    ELSEIF NEW.Estimated_Weight_Tons > v_Remaining THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Estimated weight exceeds remaining slot capacity';
    END IF;
END$$
DELIMITER ;
