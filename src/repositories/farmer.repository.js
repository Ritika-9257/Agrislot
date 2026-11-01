const db = require('../config/database');

const FarmerRepository = {
  async create({ Name, Phone, Aadhar_No, UPI_ID, Village }, connection = null) {
    const executor = connection || db;
    const sql = `
      INSERT INTO Farmers (Name, Phone, Aadhar_No, UPI_ID, Village)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await executor.query(sql, [Name, Phone, Aadhar_No, UPI_ID || null, Village || null]);
    return result.insertId;
  },

  async findById(farmerId) {
    const sql = 'SELECT Farmer_ID, Name, Phone, Aadhar_No, UPI_ID, Village FROM Farmers WHERE Farmer_ID = ?';
    const [rows] = await db.query(sql, [farmerId]);
    return rows[0] || null;
  },

  async findByPhone(phone) {
    const sql = 'SELECT Farmer_ID, Name, Phone, Aadhar_No, UPI_ID, Village FROM Farmers WHERE Phone = ?';
    const [rows] = await db.query(sql, [phone]);
    return rows[0] || null;
  },

  async findByAadhaar(aadharNo) {
    const sql = 'SELECT Farmer_ID, Name, Phone, Aadhar_No, UPI_ID, Village FROM Farmers WHERE Aadhar_No = ?';
    const [rows] = await db.query(sql, [aadharNo]);
    return rows[0] || null;
  },

  async findAll({ page = 1, limit = 20, search } = {}) {
    let whereSql = '1=1';
    const params = [];

    if (search) {
      whereSql += ' AND (Name LIKE ? OR Village LIKE ? OR Phone LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
    const offset = (safePage - 1) * safeLimit;

    let total = 0;
    try {
      const countSql = `SELECT COUNT(*) AS total FROM Farmers WHERE ${whereSql}`;
      const [countRows] = await db.query(countSql, params);
      total = countRows[0]?.total || 0;
    } catch {
      total = 0;
    }

    const selectSql = `
      SELECT Farmer_ID, Name, Phone, Village 
      FROM Farmers 
      WHERE ${whereSql} 
      ORDER BY Farmer_ID ASC 
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(selectSql, [...params, safeLimit, offset]);

    rows.items = rows;
    rows.pagination = {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1
    };

    return rows;
  },

  async findBookingsByFarmerId(farmerId) {
    const sql = `
      SELECT 
        b.Booking_ID,
        b.Token_Number,
        b.Estimated_Weight_Tons,
        b.Booking_Status,
        b.Created_At,
        s.Slot_ID,
        s.Slot_Date,
        s.Start_Time,
        s.End_Time,
        m.Mandi_ID,
        m.Mandi_Name,
        m.District,
        p.Produce_ID,
        p.Produce_Name,
        p.Category
      FROM Bookings b
      JOIN Slots s ON b.Slot_ID = s.Slot_ID
      JOIN Mandis m ON s.Mandi_ID = m.Mandi_ID
      JOIN Produce p ON b.Produce_ID = p.Produce_ID
      WHERE b.Farmer_ID = ?
      ORDER BY b.Created_At DESC
    `;
    const [rows] = await db.query(sql, [farmerId]);
    return rows;
  }
};

module.exports = FarmerRepository;
