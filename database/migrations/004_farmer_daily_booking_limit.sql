-- ==============================================================================
-- AgriSlot Migration 004: One Booking Per Farmer Per Day & Hybrid Availability Fix
-- ==============================================================================

USE agrislot;

-- 1. Create Farmer_Daily_Reservations table to enforce database-level uniqueness
-- One registered farmer can have only ONE active reservation per calendar date across all mandis
CREATE TABLE IF NOT EXISTS Farmer_Daily_Reservations (
  Reservation_ID INT AUTO_INCREMENT PRIMARY KEY,
  Farmer_ID INT NOT NULL,
  Reservation_Date DATE NOT NULL,
  Booking_ID INT NOT NULL,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_farmer_daily_reservation (Farmer_ID, Reservation_Date),
  INDEX idx_res_booking_id (Booking_ID),
  INDEX idx_res_date (Reservation_Date),
  CONSTRAINT fk_res_farmer FOREIGN KEY (Farmer_ID) REFERENCES Farmers(Farmer_ID) ON DELETE CASCADE,
  CONSTRAINT fk_res_booking FOREIGN KEY (Booking_ID) REFERENCES Bookings(Booking_ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Populate Farmer_Daily_Reservations from existing active bookings
-- Uses INSERT IGNORE so if historical test data had duplicate bookings, one is safely retained without errors
INSERT IGNORE INTO Farmer_Daily_Reservations (Farmer_ID, Reservation_Date, Booking_ID, Created_At)
SELECT b.Farmer_ID, s.Slot_Date, b.Booking_ID, b.Created_At
FROM Bookings b
JOIN Slots s ON b.Slot_ID = s.Slot_ID
WHERE b.Booking_Status != 'Cancelled'
ORDER BY b.Booking_ID ASC;

-- 3. Reconcile existing stored slot counters directly from MySQL active booking records
-- Resolves the issue where Slot S04 and Slot S10 were marked 'Full' despite remaining capacity
UPDATE Slots s
LEFT JOIN (
  SELECT 
    Slot_ID,
    COUNT(*) AS Active_Count,
    COALESCE(SUM(Estimated_Weight_Tons), 0.00) AS Active_Weight
  FROM Bookings
  WHERE Booking_Status != 'Cancelled'
  GROUP BY Slot_ID
) b ON s.Slot_ID = b.Slot_ID
SET 
  s.Booked_Count = COALESCE(b.Active_Count, 0),
  s.Booked_Capacity_Tons = COALESCE(b.Active_Weight, 0.00),
  s.Slot_Status = CASE
    WHEN s.Slot_Status = 'Closed' THEN 'Closed'
    WHEN COALESCE(b.Active_Count, 0) >= s.Max_Bookings OR COALESCE(b.Active_Weight, 0.00) >= s.Max_Capacity_Tons THEN 'Full'
    ELSE 'Available'
  END;

-- 4. Update Reconcile_Slot_Counters stored procedure with correct evaluation order
DROP PROCEDURE IF EXISTS Reconcile_Slot_Counters;

DELIMITER //

CREATE PROCEDURE Reconcile_Slot_Counters(IN p_slot_id INT)
BEGIN
  IF p_slot_id IS NOT NULL AND p_slot_id > 0 THEN
    UPDATE Slots s
    LEFT JOIN (
      SELECT 
        Slot_ID,
        COUNT(*) AS Active_Count,
        COALESCE(SUM(Estimated_Weight_Tons), 0.00) AS Active_Weight
      FROM Bookings
      WHERE Slot_ID = p_slot_id AND Booking_Status != 'Cancelled'
      GROUP BY Slot_ID
    ) b ON s.Slot_ID = b.Slot_ID
    SET 
      s.Booked_Count = COALESCE(b.Active_Count, 0),
      s.Booked_Capacity_Tons = COALESCE(b.Active_Weight, 0.00),
      s.Slot_Status = CASE
        WHEN s.Slot_Status = 'Closed' THEN 'Closed'
        WHEN COALESCE(b.Active_Count, 0) >= s.Max_Bookings OR COALESCE(b.Active_Weight, 0.00) >= s.Max_Capacity_Tons THEN 'Full'
        ELSE 'Available'
      END
    WHERE s.Slot_ID = p_slot_id;
  ELSE
    UPDATE Slots s
    LEFT JOIN (
      SELECT 
        Slot_ID,
        COUNT(*) AS Active_Count,
        COALESCE(SUM(Estimated_Weight_Tons), 0.00) AS Active_Weight
      FROM Bookings
      WHERE Booking_Status != 'Cancelled'
      GROUP BY Slot_ID
    ) b ON s.Slot_ID = b.Slot_ID
    SET 
      s.Booked_Count = COALESCE(b.Active_Count, 0),
      s.Booked_Capacity_Tons = COALESCE(b.Active_Weight, 0.00),
      s.Slot_Status = CASE
        WHEN s.Slot_Status = 'Closed' THEN 'Closed'
        WHEN COALESCE(b.Active_Count, 0) >= s.Max_Bookings OR COALESCE(b.Active_Weight, 0.00) >= s.Max_Capacity_Tons THEN 'Full'
        ELSE 'Available'
      END;
  END IF;
END //

DELIMITER ;
