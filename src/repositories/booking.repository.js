const db = require('../config/database');

const BookingRepository = {
  async create({ Farmer_ID, Slot_ID, Produce_ID, Estimated_Weight_Tons, Token_Number }, connection) {
    const sql = `
      INSERT INTO Bookings (Farmer_ID, Slot_ID, Produce_ID, Estimated_Weight_Tons, Booking_Status, Token_Number)
      VALUES (?, ?, ?, ?, 'Confirmed', ?)
    `;
    const [result] = await connection.query(sql, [
      Farmer_ID,
      Slot_ID,
      Produce_ID,
      Estimated_Weight_Tons,
      Token_Number
    ]);
    return result.insertId;
  },

  async findById(bookingId) {
    const sql = `
      SELECT 
        b.Booking_ID,
        b.Farmer_ID,
        f.Name AS Farmer_Name,
        f.Phone AS Farmer_Phone,
        b.Slot_ID,
        s.Slot_Date,
        s.Start_Time,
        s.End_Time,
        m.Mandi_ID,
        m.Mandi_Name,
        m.District,
        b.Produce_ID,
        p.Produce_Name,
        p.Category,
        p.Storage_Type,
        b.Estimated_Weight_Tons,
        b.Booking_Status,
        b.Token_Number,
        b.Created_At,
        b.Check_In_Time,
        b.Completion_Time,
        b.Officer_ID,
        u.Full_Name AS Officer_Name
      FROM Bookings b
      JOIN Farmers f ON b.Farmer_ID = f.Farmer_ID
      JOIN Slots s ON b.Slot_ID = s.Slot_ID
      JOIN Mandis m ON s.Mandi_ID = m.Mandi_ID
      JOIN Produce p ON b.Produce_ID = p.Produce_ID
      LEFT JOIN User_Login u ON b.Officer_ID = u.User_ID
      WHERE b.Booking_ID = ?
    `;
    const [rows] = await db.query(sql, [bookingId]);
    return rows[0] || null;
  },

  async findByToken(token) {
    const sql = `
      SELECT 
        b.Booking_ID,
        b.Farmer_ID,
        f.Name AS Farmer_Name,
        f.Phone AS Farmer_Phone,
        b.Slot_ID,
        s.Slot_Date,
        s.Start_Time,
        s.End_Time,
        m.Mandi_ID,
        m.Mandi_Name,
        m.District,
        b.Produce_ID,
        p.Produce_Name,
        p.Category,
        p.Storage_Type,
        b.Estimated_Weight_Tons,
        b.Booking_Status,
        b.Token_Number,
        b.Created_At,
        b.Check_In_Time,
        b.Completion_Time,
        b.Officer_ID,
        u.Full_Name AS Officer_Name
      FROM Bookings b
      JOIN Farmers f ON b.Farmer_ID = f.Farmer_ID
      JOIN Slots s ON b.Slot_ID = s.Slot_ID
      JOIN Mandis m ON s.Mandi_ID = m.Mandi_ID
      JOIN Produce p ON b.Produce_ID = p.Produce_ID
      LEFT JOIN User_Login u ON b.Officer_ID = u.User_ID
      WHERE b.Token_Number = ?
    `;
    const [rows] = await db.query(sql, [token]);
    return rows[0] || null;
  },

  async findByIdForUpdate(bookingId, connection) {
    const sql = `
      SELECT 
        Booking_ID,
        Farmer_ID,
        Slot_ID,
        Produce_ID,
        Estimated_Weight_Tons,
        Booking_Status,
        Token_Number,
        Check_In_Time,
        Completion_Time,
        Officer_ID
      FROM Bookings
      WHERE Booking_ID = ?
      FOR UPDATE
    `;
    const [rows] = await connection.query(sql, [bookingId]);
    return rows[0] || null;
  },

  async updateStatus(bookingId, status, options = {}) {
    let executor = db;
    let officerId = null;

    if (options && options.execute) {
      // options is a connection
      executor = options;
    } else if (options && typeof options === 'object') {
      if (options.connection) executor = options.connection;
      if (options.officerId) officerId = options.officerId;
    }

    let sql = 'UPDATE Bookings SET Booking_Status = ?';
    const params = [status];

    if (status === 'Checked-In' || status === 'In Process') {
      sql += ', Check_In_Time = COALESCE(Check_In_Time, CURRENT_TIMESTAMP)';
      if (officerId) {
        sql += ', Officer_ID = ?';
        params.push(officerId);
      }
    } else if (status === 'Completed') {
      sql += ', Completion_Time = CURRENT_TIMESTAMP';
      if (officerId) {
        sql += ', Officer_ID = ?';
        params.push(officerId);
      }
    } else if (status === 'No-Show') {
      if (officerId) {
        sql += ', Officer_ID = ?';
        params.push(officerId);
      }
    }

    sql += ' WHERE Booking_ID = ?';
    params.push(bookingId);

    const [result] = await executor.query(sql, params);
    return result.affectedRows > 0;
  },

  async findAll({ status, date, startDate, endDate, mandiId, farmerId, token, search, cropId, category, sortBy = 'Created_At', sortOrder = 'DESC', page = 1, limit = 20 } = {}) {
    const whereClauses = ['1=1'];
    const params = [];

    if (status && status !== 'ALL') {
      if (status === 'Active' || status === 'In-Yard' || status === 'In-Process') {
        whereClauses.push("b.Booking_Status IN ('Checked-In', 'In Process')");
      } else {
        whereClauses.push('b.Booking_Status = ?');
        params.push(status);
      }
    }
    if (startDate && endDate) {
      whereClauses.push('s.Slot_Date BETWEEN ? AND ?');
      params.push(startDate, endDate);
    } else if (date) {
      whereClauses.push('s.Slot_Date = ?');
      params.push(date);
    }
    if (mandiId) {
      whereClauses.push('m.Mandi_ID = ?');
      params.push(mandiId);
    }
    if (farmerId) {
      whereClauses.push('b.Farmer_ID = ?');
      params.push(farmerId);
    }
    if (cropId) {
      whereClauses.push('b.Produce_ID = ?');
      params.push(cropId);
    }
    if (category) {
      whereClauses.push('p.Category = ?');
      params.push(category);
    }
    if (token) {
      whereClauses.push('b.Token_Number = ?');
      params.push(token);
    }
    if (search) {
      whereClauses.push('(f.Name LIKE ? OR b.Token_Number LIKE ? OR p.Produce_Name LIKE ? OR CAST(b.Farmer_ID AS CHAR) = ?)');
      const term = `%${search}%`;
      params.push(term, term, term, search);
    }

    const whereSql = whereClauses.join(' AND ');

    // Calculate total matching records for pagination
    const countSql = `
      SELECT COUNT(*) AS total
      FROM Bookings b
      JOIN Farmers f ON b.Farmer_ID = f.Farmer_ID
      JOIN Slots s ON b.Slot_ID = s.Slot_ID
      JOIN Mandis m ON s.Mandi_ID = m.Mandi_ID
      JOIN Produce p ON b.Produce_ID = p.Produce_ID
      LEFT JOIN User_Login u ON b.Officer_ID = u.User_ID
      WHERE ${whereSql}
    `;
    let total = 0;
    try {
      const [countRows] = await db.query(countSql, params);
      total = countRows[0]?.total || 0;
    } catch {
      total = 0;
    }

    // Allowlisted sort columns
    const ALLOWED_SORT_COLS = {
      'Created_At': 'b.Created_At',
      'Slot_Date': 's.Slot_Date',
      'Estimated_Weight_Tons': 'b.Estimated_Weight_Tons',
      'Booking_ID': 'b.Booking_ID',
      'Farmer_Name': 'f.Name',
      'Produce_Name': 'p.Produce_Name',
      'Booking_Status': 'b.Booking_Status',
      'Check_In_Time': 'b.Check_In_Time',
      'Completion_Time': 'b.Completion_Time'
    };
    const safeSortCol = ALLOWED_SORT_COLS[sortBy] || 'b.Created_At';
    const safeSortOrder = sortOrder && String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 200);
    const offset = (safePage - 1) * safeLimit;

    const selectSql = `
      SELECT 
        b.Booking_ID,
        b.Token_Number,
        b.Booking_Status,
        b.Estimated_Weight_Tons,
        b.Created_At,
        b.Check_In_Time,
        b.Completion_Time,
        b.Officer_ID,
        u.Full_Name AS Officer_Name,
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
        p.Produce_ID,
        p.Produce_Name,
        p.Category AS Produce_Category
      FROM Bookings b
      JOIN Farmers f ON b.Farmer_ID = f.Farmer_ID
      JOIN Slots s ON b.Slot_ID = s.Slot_ID
      JOIN Mandis m ON s.Mandi_ID = m.Mandi_ID
      JOIN Produce p ON b.Produce_ID = p.Produce_ID
      LEFT JOIN User_Login u ON b.Officer_ID = u.User_ID
      WHERE ${whereSql}
      ORDER BY ${safeSortCol} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, safeLimit, offset];
    const [rows] = await db.query(selectSql, queryParams);

    // Provide dual compatibility: rows behaves as an Array AND carries pagination metadata
    rows.items = rows;
    rows.pagination = {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1
    };

    return rows;
  }
};

module.exports = BookingRepository;
