const db = require('../config/database');

const SlotRepository = {
  async ensureSlotsForDate(mandiId = 1, date) {
    if (!mandiId || !date) return;
    try {
      const [existing] = await db.query(
        'SELECT COUNT(*) AS cnt FROM Slots WHERE Mandi_ID = ? AND Slot_Date = ?',
        [mandiId, date]
      );
      if (existing && existing[0]?.cnt > 0) return;

      const slotIntervals = [
        { start: '09:00:00', end: '09:20:00', cap: 50 },
        { start: '09:20:00', end: '09:40:00', cap: 50 },
        { start: '09:40:00', end: '10:00:00', cap: 50 },
        { start: '10:00:00', end: '10:20:00', cap: 50 },
        { start: '10:20:00', end: '10:40:00', cap: 50 },
        { start: '10:40:00', end: '11:00:00', cap: 50 },
        { start: '11:00:00', end: '11:20:00', cap: 50 },
        { start: '11:20:00', end: '11:40:00', cap: 50 },
        { start: '11:40:00', end: '12:00:00', cap: 50 },
        { start: '12:00:00', end: '12:20:00', cap: 50 },
        { start: '12:20:00', end: '12:40:00', cap: 50 },
        { start: '12:40:00', end: '13:00:00', cap: 50 },
        // 13:00 - 14:00 Mandi Lunch Break is intentionally skipped
        { start: '14:00:00', end: '14:20:00', cap: 50 },
        { start: '14:20:00', end: '14:40:00', cap: 50 },
        { start: '14:40:00', end: '15:00:00', cap: 50 },
        { start: '15:00:00', end: '15:20:00', cap: 50 },
        { start: '15:20:00', end: '15:40:00', cap: 50 },
        { start: '15:40:00', end: '16:00:00', cap: 50 },
        { start: '16:00:00', end: '16:20:00', cap: 50 },
        { start: '16:20:00', end: '16:40:00', cap: 50 },
        { start: '16:40:00', end: '17:00:00', cap: 50 }
      ];

      for (const item of slotIntervals) {
        await db.query(
          `INSERT IGNORE INTO Slots (
            Mandi_ID, Slot_Date, Start_Time, End_Time, 
            Max_Bookings, Booked_Count, 
            Max_Capacity_Tons, Booked_Capacity_Tons, Slot_Status
          ) VALUES (?, ?, ?, ?, 5, 0, ?, 0.00, 'Available')`,
          [mandiId, date, item.start, item.end, item.cap]
        );
      }
    } catch {
      // Non-fatal if database is offline or in read-only mode during testing
    }
  },

  async findAll({ mandiId, date, availableOnly = false, page = 1, limit = 50 } = {}) {
    if (date && mandiId) {
      await this.ensureSlotsForDate(mandiId, date);
    }
    let sql = `
      SELECT 
        s.Slot_ID,
        s.Mandi_ID,
        m.Mandi_Name,
        m.District,
        s.Slot_Date,
        s.Start_Time,
        s.End_Time,
        s.Max_Bookings,
        s.Booked_Count,
        GREATEST(0, s.Max_Bookings - s.Booked_Count) AS Remaining_Bookings,
        s.Max_Capacity_Tons,
        s.Booked_Capacity_Tons,
        GREATEST(0.00, s.Max_Capacity_Tons - s.Booked_Capacity_Tons) AS Remaining_Capacity_Tons,
        s.Slot_Status,
        CASE 
          WHEN s.Slot_Status = 'Closed' THEN 'Closed'
          WHEN s.Booked_Count >= s.Max_Bookings OR s.Booked_Capacity_Tons >= s.Max_Capacity_Tons THEN 'Full'
          ELSE 'Available'
        END AS Availability_Status
      FROM Slots s
      JOIN Mandis m ON s.Mandi_ID = m.Mandi_ID
      WHERE 1=1
    `;
    const params = [];

    if (mandiId) {
      sql += ' AND s.Mandi_ID = ?';
      params.push(mandiId);
    }

    if (date) {
      sql += ' AND s.Slot_Date = ?';
      params.push(date);
    }

    if (availableOnly) {
      sql += " AND s.Slot_Status != 'Closed' AND s.Booked_Count < s.Max_Bookings AND s.Booked_Capacity_Tons < s.Max_Capacity_Tons";
    }

    sql += ' ORDER BY s.Slot_Date ASC, s.Start_Time ASC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const [rows] = await db.query(sql, params);
    return rows;
  },

  async findById(slotId) {
    const sql = `
      SELECT 
        s.Slot_ID,
        s.Mandi_ID,
        m.Mandi_Name,
        m.District,
        s.Slot_Date,
        s.Start_Time,
        s.End_Time,
        s.Max_Bookings,
        s.Booked_Count,
        GREATEST(0, s.Max_Bookings - s.Booked_Count) AS Remaining_Bookings,
        s.Max_Capacity_Tons,
        s.Booked_Capacity_Tons,
        GREATEST(0.00, s.Max_Capacity_Tons - s.Booked_Capacity_Tons) AS Remaining_Capacity_Tons,
        s.Slot_Status,
        CASE 
          WHEN s.Slot_Status = 'Closed' THEN 'Closed'
          WHEN s.Booked_Count >= s.Max_Bookings OR s.Booked_Capacity_Tons >= s.Max_Capacity_Tons THEN 'Full'
          ELSE 'Available'
        END AS Availability_Status
      FROM Slots s
      JOIN Mandis m ON s.Mandi_ID = m.Mandi_ID
      WHERE s.Slot_ID = ?
    `;
    const [rows] = await db.query(sql, [slotId]);
    return rows[0] || null;
  },

  /**
   * Row-level locking query for atomic concurrency safety
   * Uses SELECT ... FOR UPDATE within a transaction
   */
  async findByIdForUpdate(slotId, connection) {
    const sql = `
      SELECT 
        Slot_ID,
        Mandi_ID,
        Slot_Date,
        Start_Time,
        End_Time,
        Max_Bookings,
        Booked_Count,
        Max_Capacity_Tons,
        Booked_Capacity_Tons,
        Slot_Status
      FROM Slots
      WHERE Slot_ID = ?
      FOR UPDATE
    `;
    const [rows] = await connection.query(sql, [slotId]);
    return rows[0] || null;
  },

  /**
   * Atomically increment both Booked_Count and Booked_Capacity_Tons within a transaction
   */
  async incrementSlotBooking(slotId, weightTons, connection) {
    const sql = `
      UPDATE Slots
      SET 
        Booked_Count = Booked_Count + 1,
        Booked_Capacity_Tons = Booked_Capacity_Tons + ?,
        Slot_Status = CASE 
          WHEN Slot_Status = 'Closed' THEN 'Closed'
          WHEN (Booked_Count + 1) >= Max_Bookings OR (Booked_Capacity_Tons + ?) >= Max_Capacity_Tons THEN 'Full'
          ELSE 'Available'
        END
      WHERE Slot_ID = ?
    `;
    const [result] = await connection.query(sql, [weightTons, weightTons, slotId]);
    return result.affectedRows > 0;
  },

  /**
   * Atomically decrement both Booked_Count and Booked_Capacity_Tons within a transaction
   */
  async decrementSlotBooking(slotId, weightTons, connection) {
    const sql = `
      UPDATE Slots
      SET 
        Booked_Count = GREATEST(0, Booked_Count - 1),
        Booked_Capacity_Tons = GREATEST(0.00, Booked_Capacity_Tons - ?),
        Slot_Status = CASE 
          WHEN Slot_Status = 'Closed' THEN 'Closed'
          WHEN GREATEST(0, Booked_Count - 1) >= Max_Bookings OR GREATEST(0.00, Booked_Capacity_Tons - ?) >= Max_Capacity_Tons THEN 'Full'
          ELSE 'Available'
        END
      WHERE Slot_ID = ?
    `;
    const [result] = await connection.query(sql, [weightTons, weightTons, slotId]);
    return result.affectedRows > 0;
  },

  /**
   * Backward compatibility wrappers
   */
  async incrementBookedCapacity(slotId, weightTons, connection) {
    return this.incrementSlotBooking(slotId, weightTons, connection);
  },

  async decrementBookedCapacity(slotId, weightTons, connection) {
    return this.decrementSlotBooking(slotId, weightTons, connection);
  },

  /**
   * Admin: Update slot limits (Max_Bookings, Max_Capacity_Tons, Slot_Status)
   * Enforces that limits cannot be reduced below currently booked values
   */
  async updateSlotLimits(slotId, { maxBookings, maxCapacityTons, status }, connection = db) {
    const [rows] = await connection.query(
      'SELECT Slot_ID, Booked_Count, Booked_Capacity_Tons, Max_Bookings, Max_Capacity_Tons, Slot_Status FROM Slots WHERE Slot_ID = ?',
      [slotId]
    );
    const slot = rows[0];
    if (!slot) return null;

    const updates = [];
    const params = [];

    if (maxBookings !== undefined && maxBookings !== null) {
      const newMaxBookings = parseInt(maxBookings, 10);
      if (isNaN(newMaxBookings) || newMaxBookings <= 0) {
        throw new Error('Maximum farmer limit must be a positive integer');
      }
      if (newMaxBookings < slot.Booked_Count) {
        const err = new Error(`Cannot reduce maximum farmers to ${newMaxBookings}. Slot already has ${slot.Booked_Count} active booking(s).`);
        err.code = 'CANNOT_REDUCE_BELOW_BOOKED_COUNT';
        err.status = 400;
        throw err;
      }
      updates.push('Max_Bookings = ?');
      params.push(newMaxBookings);
    }

    if (maxCapacityTons !== undefined && maxCapacityTons !== null) {
      const newMaxCap = parseFloat(maxCapacityTons);
      if (isNaN(newMaxCap) || newMaxCap <= 0) {
        throw new Error('Maximum capacity tons must be a positive number');
      }
      if (newMaxCap < parseFloat(slot.Booked_Capacity_Tons)) {
        const err = new Error(`Cannot reduce maximum capacity to ${newMaxCap}T. Slot already has ${parseFloat(slot.Booked_Capacity_Tons).toFixed(2)}T booked.`);
        err.code = 'CANNOT_REDUCE_BELOW_BOOKED_WEIGHT';
        err.status = 400;
        throw err;
      }
      updates.push('Max_Capacity_Tons = ?');
      params.push(newMaxCap);
    }

    if (status !== undefined && status !== null) {
      const validStatuses = ['Available', 'Full', 'Closed'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: Available, Full, Closed`);
      }
      updates.push('Slot_Status = ?');
      params.push(status);
    }

    if (updates.length === 0) return slot;

    // Recalculate status automatically if not explicitly set to Closed
    if (!status || status !== 'Closed') {
      updates.push(`
        Slot_Status = CASE 
          WHEN Slot_Status = 'Closed' AND ? = false THEN 'Closed'
          WHEN Booked_Count >= COALESCE(?, Max_Bookings) OR Booked_Capacity_Tons >= COALESCE(?, Max_Capacity_Tons) THEN 'Full'
          ELSE 'Available'
        END
      `);
      params.push(
        status === 'Available',
        maxBookings !== undefined ? parseInt(maxBookings, 10) : null,
        maxCapacityTons !== undefined ? parseFloat(maxCapacityTons) : null
      );
    }

    const sql = `UPDATE Slots SET ${updates.join(', ')} WHERE Slot_ID = ?`;
    params.push(slotId);

    await connection.query(sql, params);
    return this.findById(slotId);
  },

  /**
   * Inspect actual bookings linked to a slot
   */
  async findBookingsForSlot(slotId) {
    const sql = `
      SELECT 
        b.Booking_ID,
        b.Token_Number,
        b.Farmer_ID,
        f.Name AS Farmer_Name,
        f.Phone AS Farmer_Phone,
        b.Produce_ID,
        p.Produce_Name,
        p.Category,
        b.Estimated_Weight_Tons,
        b.Booking_Status,
        b.Created_At,
        b.Check_In_Time,
        b.Completion_Time
      FROM Bookings b
      JOIN Farmers f ON b.Farmer_ID = f.Farmer_ID
      JOIN Produce p ON b.Produce_ID = p.Produce_ID
      WHERE b.Slot_ID = ?
      ORDER BY b.Created_At DESC
    `;
    const [rows] = await db.query(sql, [slotId]);
    return rows;
  },

  /**
   * Safe reconciliation using stored procedure
   */
  async reconcileSlot(slotId = null) {
    await db.query('CALL Reconcile_Slot_Counters(?)', [slotId]);
    if (slotId) {
      return this.findById(slotId);
    }
    return true;
  },

  async getUtilizationSummary() {
    const sql = `
      SELECT 
        m.Mandi_ID,
        m.Mandi_Name,
        m.District,
        COUNT(s.Slot_ID) AS Total_Slots,
        COALESCE(SUM(s.Max_Bookings), 0) AS Total_Max_Bookings,
        COALESCE(SUM(s.Booked_Count), 0) AS Total_Booked_Count,
        COALESCE(SUM(s.Max_Capacity_Tons), 0) AS Total_Max_Capacity_Tons,
        COALESCE(SUM(s.Booked_Capacity_Tons), 0) AS Total_Booked_Capacity_Tons,
        COALESCE(SUM(GREATEST(0.00, s.Max_Capacity_Tons - s.Booked_Capacity_Tons)), 0) AS Total_Remaining_Capacity_Tons,
        ROUND((COALESCE(SUM(s.Booked_Capacity_Tons), 0) / NULLIF(SUM(s.Max_Capacity_Tons), 0)) * 100, 2) AS Utilization_Percentage,
        ROUND((COALESCE(SUM(s.Booked_Count), 0) / NULLIF(SUM(s.Max_Bookings), 0)) * 100, 2) AS Farmer_Capacity_Percentage
      FROM Mandis m
      LEFT JOIN Slots s ON m.Mandi_ID = s.Mandi_ID
      GROUP BY m.Mandi_ID, m.Mandi_Name, m.District
      ORDER BY Utilization_Percentage DESC
    `;
    const [rows] = await db.query(sql);
    return rows;
  }
};

module.exports = SlotRepository;
