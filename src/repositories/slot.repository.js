const db = require('../config/database');

const SlotRepository = {
  async findAll({ mandiId, date, availableOnly = false, page = 1, limit = 50 } = {}) {
    let sql = `
      SELECT 
        s.Slot_ID,
        s.Mandi_ID,
        m.Mandi_Name,
        m.District,
        s.Slot_Date,
        s.Start_Time,
        s.End_Time,
        s.Max_Capacity_Tons,
        s.Booked_Capacity_Tons,
        (s.Max_Capacity_Tons - s.Booked_Capacity_Tons) AS Remaining_Capacity_Tons,
        CASE 
          WHEN s.Booked_Capacity_Tons >= s.Max_Capacity_Tons THEN 'Full'
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
      sql += ' AND s.Booked_Capacity_Tons < s.Max_Capacity_Tons';
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
        s.Max_Capacity_Tons,
        s.Booked_Capacity_Tons,
        (s.Max_Capacity_Tons - s.Booked_Capacity_Tons) AS Remaining_Capacity_Tons,
        CASE 
          WHEN s.Booked_Capacity_Tons >= s.Max_Capacity_Tons THEN 'Full'
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
        Max_Capacity_Tons,
        Booked_Capacity_Tons
      FROM Slots
      WHERE Slot_ID = ?
      FOR UPDATE
    `;
    const [rows] = await connection.query(sql, [slotId]);
    return rows[0] || null;
  },

  /**
   * Atomically increment booked capacity within a transaction
   */
  async incrementBookedCapacity(slotId, weightTons, connection) {
    const sql = `
      UPDATE Slots
      SET Booked_Capacity_Tons = Booked_Capacity_Tons + ?
      WHERE Slot_ID = ?
    `;
    const [result] = await connection.query(sql, [weightTons, slotId]);
    return result.affectedRows > 0;
  },

  /**
   * Atomically decrement booked capacity within a transaction
   * Uses GREATEST(0, Booked_Capacity_Tons - ?) to ensure non-negative value
   */
  async decrementBookedCapacity(slotId, weightTons, connection) {
    const sql = `
      UPDATE Slots
      SET Booked_Capacity_Tons = GREATEST(0, Booked_Capacity_Tons - ?)
      WHERE Slot_ID = ?
    `;
    const [result] = await connection.query(sql, [weightTons, slotId]);
    return result.affectedRows > 0;
  },

  async getUtilizationSummary() {
    const sql = `
      SELECT 
        m.Mandi_ID,
        m.Mandi_Name,
        m.District,
        COUNT(s.Slot_ID) AS Total_Slots,
        COALESCE(SUM(s.Max_Capacity_Tons), 0) AS Total_Max_Capacity_Tons,
        COALESCE(SUM(s.Booked_Capacity_Tons), 0) AS Total_Booked_Capacity_Tons,
        COALESCE(SUM(s.Max_Capacity_Tons - s.Booked_Capacity_Tons), 0) AS Total_Remaining_Capacity_Tons,
        ROUND((COALESCE(SUM(s.Booked_Capacity_Tons), 0) / NULLIF(SUM(s.Max_Capacity_Tons), 0)) * 100, 2) AS Utilization_Percentage
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
