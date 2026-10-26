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
