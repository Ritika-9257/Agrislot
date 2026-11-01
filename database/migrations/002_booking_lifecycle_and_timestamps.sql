-- ==============================================================================
-- AgriSlot Migration 002: Completed Booking Lifecycle, Timestamps & Officer Tracking
-- ==============================================================================

USE agrislot;

-- 1. Expand Booking_Status ENUM to support full lifecycle
ALTER TABLE Bookings 
  MODIFY COLUMN Booking_Status ENUM(
    'Confirmed', 
    'Checked-In', 
    'In Process', 
    'Completed', 
    'Cancelled', 
    'No-Show'
  ) DEFAULT 'Confirmed';

-- 2. Add Lifecycle Tracking Columns (Check-in time, Completion time, Officer ID)
ALTER TABLE Bookings 
  ADD COLUMN IF NOT EXISTS Check_In_Time TIMESTAMP NULL AFTER Created_At,
  ADD COLUMN IF NOT EXISTS Completion_Time TIMESTAMP NULL AFTER Check_In_Time,
  ADD COLUMN IF NOT EXISTS Officer_ID INT NULL AFTER Completion_Time;

-- 3. Add Foreign Key for Officer Tracking if not present
SET @fk_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_NAME = 'fk_bookings_officer' 
    AND TABLE_SCHEMA = DATABASE()
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE Bookings ADD CONSTRAINT fk_bookings_officer FOREIGN KEY (Officer_ID) REFERENCES User_Login(User_ID) ON DELETE SET NULL;',
  'SELECT "fk_bookings_officer already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Backfill existing historical records
UPDATE Bookings 
SET Check_In_Time = Created_At 
WHERE Booking_Status IN ('Checked-In', 'In Process', 'Completed') 
  AND Check_In_Time IS NULL;

UPDATE Bookings 
SET Completion_Time = DATE_ADD(Created_At, INTERVAL 30 MINUTE) 
WHERE Booking_Status = 'Completed' 
  AND Completion_Time IS NULL;
