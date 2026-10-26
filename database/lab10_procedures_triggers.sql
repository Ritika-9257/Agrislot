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
