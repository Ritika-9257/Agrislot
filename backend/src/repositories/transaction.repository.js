const db = require('../config/database');

const TransactionRepository = {
  async findAll({ paymentStatus, page = 1, limit = 20 } = {}) {
    let sql = `
      SELECT 
        t.Txn_ID,
        t.Booking_ID,
        b.Token_Number,
        f.Name AS Farmer_Name,
        t.Trader_ID,
        tr.Name AS Trader_Name,
        tr.License_No,
        t.Warehouse_ID,
        w.Warehouse_Type,
        m.Mandi_Name,
        t.Actual_Weight,
        t.Quality_Grade,
        t.Price_Per_Ton,
        t.Total_Amount,
        t.Payment_Status,
        t.Txn_Date
      FROM Transactions t
      JOIN Bookings b ON t.Booking_ID = b.Booking_ID
      JOIN Farmers f ON b.Farmer_ID = f.Farmer_ID
      JOIN Traders tr ON t.Trader_ID = tr.Trader_ID
      JOIN Warehouses w ON t.Warehouse_ID = w.Warehouse_ID
      JOIN Mandis m ON w.Mandi_ID = m.Mandi_ID
      WHERE 1=1
    `;
    const params = [];

    if (paymentStatus) {
      sql += ' AND t.Payment_Status = ?';
      params.push(paymentStatus);
    }

    sql += ' ORDER BY t.Txn_Date DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const [rows] = await db.query(sql, params);
    return rows;
  },

  async findById(txnId) {
    const sql = `
      SELECT 
        t.Txn_ID,
        t.Booking_ID,
        b.Token_Number,
        b.Estimated_Weight_Tons,
        f.Farmer_ID,
        f.Name AS Farmer_Name,
        f.Phone AS Farmer_Phone,
        t.Trader_ID,
        tr.Name AS Trader_Name,
        tr.License_No,
        tr.Phone AS Trader_Phone,
        t.Warehouse_ID,
        w.Warehouse_Type,
        m.Mandi_ID,
        m.Mandi_Name,
        m.District,
        t.Actual_Weight,
        t.Quality_Grade,
        t.Price_Per_Ton,
        t.Total_Amount,
        t.Payment_Status,
        t.Txn_Date
      FROM Transactions t
      JOIN Bookings b ON t.Booking_ID = b.Booking_ID
      JOIN Farmers f ON b.Farmer_ID = f.Farmer_ID
      JOIN Traders tr ON t.Trader_ID = tr.Trader_ID
      JOIN Warehouses w ON t.Warehouse_ID = w.Warehouse_ID
      JOIN Mandis m ON w.Mandi_ID = m.Mandi_ID
      WHERE t.Txn_ID = ?
    `;
    const [rows] = await db.query(sql, [txnId]);
    return rows[0] || null;
  },

  async updatePaymentStatus(txnId, paymentStatus) {
    const sql = 'UPDATE Transactions SET Payment_Status = ? WHERE Txn_ID = ?';
    const [result] = await db.query(sql, [paymentStatus, txnId]);
    return result.affectedRows > 0;
  },

  async create({ Booking_ID, Trader_ID, Warehouse_ID, Actual_Weight, Quality_Grade, Price_Per_Ton, Payment_Status }) {
    // Note: Total_Amount is GENERATED ALWAYS AS (Actual_Weight * Price_Per_Ton) STORED
    const sql = `
      INSERT INTO Transactions (Booking_ID, Trader_ID, Warehouse_ID, Actual_Weight, Quality_Grade, Price_Per_Ton, Payment_Status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      Booking_ID,
      Trader_ID,
      Warehouse_ID,
      Actual_Weight,
      Quality_Grade,
      Price_Per_Ton,
      Payment_Status || 'Pending'
    ]);
    return result.insertId;
  },

  async getSummary() {
    const sql = `
      SELECT 
        COUNT(Txn_ID) AS Total_Transactions,
        COALESCE(SUM(Actual_Weight), 0) AS Total_Actual_Weight_Tons,
        COALESCE(SUM(Total_Amount), 0) AS Total_Turnover_Amount,
        COUNT(CASE WHEN Payment_Status = 'Released' THEN 1 END) AS Released_Count,
        COUNT(CASE WHEN Payment_Status = 'Pending' THEN 1 END) AS Pending_Count,
        COUNT(CASE WHEN Payment_Status = 'Failed' THEN 1 END) AS Failed_Count,
        COALESCE(SUM(CASE WHEN Payment_Status = 'Released' THEN Total_Amount ELSE 0 END), 0) AS Released_Amount,
        COALESCE(SUM(CASE WHEN Payment_Status = 'Pending' THEN Total_Amount ELSE 0 END), 0) AS Pending_Amount
      FROM Transactions
    `;
    const [rows] = await db.query(sql);
    return rows[0];
  },

  async findAllTraders() {
    const sql = 'SELECT Trader_ID, Name, License_No, Phone FROM Traders ORDER BY Name ASC';
    const [rows] = await db.query(sql);
    return rows;
  },

  async findAllWarehouses() {
    const sql = `
      SELECT 
        w.Warehouse_ID,
        w.Mandi_ID,
        m.Mandi_Name,
        w.Warehouse_Type,
        w.Total_Capacity,
        w.Occupied_Capacity,
        (w.Total_Capacity - w.Occupied_Capacity) AS Available_Capacity
      FROM Warehouses w
      JOIN Mandis m ON w.Mandi_ID = m.Mandi_ID
      ORDER BY w.Warehouse_ID ASC
    `;
    const [rows] = await db.query(sql);
    return rows;
  }
};

module.exports = TransactionRepository;
