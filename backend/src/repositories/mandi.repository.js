const db = require('../config/database');

const MandiRepository = {
  async findAll({ district, page = 1, limit = 50 } = {}) {
    let sql = 'SELECT Mandi_ID, Mandi_Name, Location, District, Total_Daily_Capacity_Tons FROM Mandis WHERE 1=1';
    const params = [];

    if (district) {
      sql += ' AND District = ?';
      params.push(district);
    }

    sql += ' ORDER BY Mandi_ID ASC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const [rows] = await db.query(sql, params);
    return rows;
  },

  async findById(mandiId) {
    const sql = 'SELECT Mandi_ID, Mandi_Name, Location, District, Total_Daily_Capacity_Tons FROM Mandis WHERE Mandi_ID = ?';
    const [rows] = await db.query(sql, [mandiId]);
    return rows[0] || null;
  },

  async findSlotsByMandiId(mandiId, { date, availableOnly = false } = {}) {
    let sql = `
      SELECT 
        s.Slot_ID,
        s.Mandi_ID,
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
      WHERE s.Mandi_ID = ?
    `;
    const params = [mandiId];

    if (date) {
      sql += ' AND s.Slot_Date = ?';
      params.push(date);
    }

    if (availableOnly) {
      sql += ' AND s.Booked_Capacity_Tons < s.Max_Capacity_Tons';
    }

    sql += ' ORDER BY s.Slot_Date ASC, s.Start_Time ASC';

    const [rows] = await db.query(sql, params);
    return rows;
  },

  async create({ Mandi_Name, Location, District, Total_Daily_Capacity_Tons }) {
    const sql = `
      INSERT INTO Mandis (Mandi_Name, Location, District, Total_Daily_Capacity_Tons)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      Mandi_Name,
      Location,
      District,
      Total_Daily_Capacity_Tons || 500.00
    ]);
    return result.insertId;
  },

  async update(mandiId, { Mandi_Name, Location, District, Total_Daily_Capacity_Tons }) {
    const updates = [];
    const params = [];

    if (Mandi_Name !== undefined) {
      updates.push('Mandi_Name = ?');
      params.push(Mandi_Name);
    }
    if (Location !== undefined) {
      updates.push('Location = ?');
      params.push(Location);
    }
    if (District !== undefined) {
      updates.push('District = ?');
      params.push(District);
    }
    if (Total_Daily_Capacity_Tons !== undefined) {
      updates.push('Total_Daily_Capacity_Tons = ?');
      params.push(Total_Daily_Capacity_Tons);
    }

    if (updates.length === 0) return true;

    params.push(mandiId);
    const sql = `UPDATE Mandis SET ${updates.join(', ')} WHERE Mandi_ID = ?`;
    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  },

  async delete(mandiId) {
    const sql = 'DELETE FROM Mandis WHERE Mandi_ID = ?';
    const [result] = await db.query(sql, [mandiId]);
    return result.affectedRows > 0;
  }
};

module.exports = MandiRepository;
