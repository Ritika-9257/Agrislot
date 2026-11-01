-- ==============================================================================
-- AgriSlot Migration 003: Hybrid Slot Booking System (Farmer Limit + Weight Capacity)
-- ==============================================================================

USE agrislot;

DROP PROCEDURE IF EXISTS MigrateHybridSlotColumns;

DELIMITER //

CREATE PROCEDURE MigrateHybridSlotColumns()
BEGIN
    -- 1. Add Max_Bookings (default 5 farmers per slot)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'Slots' AND column_name = 'Max_Bookings'
    ) THEN
        ALTER TABLE Slots ADD COLUMN Max_Bookings INT NOT NULL DEFAULT 5 AFTER End_Time;
    END IF;

    -- 2. Add Booked_Count (current active bookings counter)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'Slots' AND column_name = 'Booked_Count'
    ) THEN
        ALTER TABLE Slots ADD COLUMN Booked_Count INT NOT NULL DEFAULT 0 AFTER Max_Bookings;
    END IF;

    -- 3. Add Slot_Status ('Available', 'Full', 'Closed')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'Slots' AND column_name = 'Slot_Status'
    ) THEN
        ALTER TABLE Slots ADD COLUMN Slot_Status ENUM('Available', 'Full', 'Closed') NOT NULL DEFAULT 'Available' AFTER Booked_Capacity_Tons;
    END IF;

    -- 4. Reconcile existing stored counters from active non-cancelled bookings
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
      s.Max_Bookings = GREATEST(COALESCE(s.Max_Bookings, 5), COALESCE(b.Active_Count, 0), 5),
      s.Max_Capacity_Tons = GREATEST(s.Max_Capacity_Tons, COALESCE(b.Active_Weight, 0.00), 50.00);

    -- 5. Set initial Slot_Status
    UPDATE Slots
    SET Slot_Status = CASE
      WHEN Slot_Status = 'Closed' THEN 'Closed'
      WHEN Booked_Count >= Max_Bookings OR Booked_Capacity_Tons >= Max_Capacity_Tons THEN 'Full'
      ELSE 'Available'
    END;

    -- 6. Check constraint chk_booked_count
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'chk_booked_count'
    ) THEN
        ALTER TABLE Slots ADD CONSTRAINT chk_booked_count CHECK (Max_Bookings > 0 AND Booked_Count >= 0 AND Booked_Count <= Max_Bookings);
    END IF;

    -- 7. Add index idx_bookings_slot_status for high-performance counter reconciliation
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Bookings' AND INDEX_NAME = 'idx_bookings_slot_status'
    ) THEN
        CREATE INDEX idx_bookings_slot_status ON Bookings(Slot_ID, Booking_Status);
    END IF;

END //

DELIMITER ;

CALL MigrateHybridSlotColumns();
DROP PROCEDURE IF EXISTS MigrateHybridSlotColumns;

-- Procedure for ongoing/scheduled slot counter reconciliation
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
