-- ==============================================================================
-- Migration: 001_add_google_auth.sql
-- Description: Add Google OAuth columns and foreign key to User_Login table
-- ==============================================================================

USE agrislot;

DELIMITER //

CREATE PROCEDURE MigrateGoogleAuthColumns()
BEGIN
    -- 1. Enlarge Username column
    ALTER TABLE User_Login MODIFY COLUMN Username VARCHAR(100) NOT NULL;

    -- 2. Add Google_Sub (Unique identifier from Google token 'sub')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'User_Login' AND column_name = 'Google_Sub'
    ) THEN
        ALTER TABLE User_Login ADD COLUMN Google_Sub VARCHAR(100) UNIQUE NULL AFTER Account_Status;
    END IF;

    -- 3. Add Email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'User_Login' AND column_name = 'Email'
    ) THEN
        ALTER TABLE User_Login ADD COLUMN Email VARCHAR(150) UNIQUE NULL AFTER Google_Sub;
    END IF;

    -- 4. Add Full_Name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'User_Login' AND column_name = 'Full_Name'
    ) THEN
        ALTER TABLE User_Login ADD COLUMN Full_Name VARCHAR(150) NULL AFTER Email;
    END IF;

    -- 5. Add Avatar_Url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'User_Login' AND column_name = 'Avatar_Url'
    ) THEN
        ALTER TABLE User_Login ADD COLUMN Avatar_Url VARCHAR(500) NULL AFTER Full_Name;
    END IF;

    -- 6. Add Farmer_ID foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'User_Login' AND column_name = 'Farmer_ID'
    ) THEN
        ALTER TABLE User_Login ADD COLUMN Farmer_ID INT NULL AFTER Avatar_Url;
        ALTER TABLE User_Login ADD CONSTRAINT fk_user_farmer FOREIGN KEY (Farmer_ID) REFERENCES Farmers(Farmer_ID) ON DELETE SET NULL;
    END IF;

END //

DELIMITER ;

CALL MigrateGoogleAuthColumns();
DROP PROCEDURE IF EXISTS MigrateGoogleAuthColumns;
