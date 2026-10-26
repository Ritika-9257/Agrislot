const db = require('../config/database');

const ALLOWED_TABLES = ['Mandis', 'Produce', 'Farmers', 'Slots', 'Bookings', 'Warehouses', 'Traders', 'Transactions'];
const ALLOWED_AGGREGATES = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
const ALLOWED_OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'LIKE'];
const ALLOWED_JOIN_TYPES = ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN'];

const Lab11Repository = {
  /**
   * Helper to execute a query and precisely measure execution time in milliseconds
   */
  async executeWithTiming(sql, params = []) {
    const start = process.hrtime.bigint();
    const [rows] = await db.query(sql, params);
    const end = process.hrtime.bigint();
    const executionTimeMs = Number(end - start) / 1e6; // Convert nanoseconds to milliseconds

    return {
      rows,
      executionTimeMs: parseFloat(executionTimeMs.toFixed(3)),
      sql
    };
  },

  // 1. Display all data from one of the main tables
  async query1DisplayAll(tableName = 'Bookings') {
    if (!ALLOWED_TABLES.includes(tableName)) {
      tableName = 'Bookings';
    }
    const sql = `SELECT * FROM ${tableName} LIMIT 100`;
    return this.executeWithTiming(sql);
  },

  // 2. Insert data into table maintaining constraints
  async query2InsertFarmer({ Name, Phone, Aadhar_No, UPI_ID, Village }) {
    const sql = `
      INSERT INTO Farmers (Name, Phone, Aadhar_No, UPI_ID, Village)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE Name = VALUES(Name)
    `;
    return this.executeWithTiming(sql, [Name, Phone, Aadhar_No, UPI_ID || null, Village || null]);
  },

  // 3. Display aggregate function result with dropdown
  async query3Aggregate(func = 'COUNT', column = '*', tableName = 'Bookings') {
    const cleanFunc = ALLOWED_AGGREGATES.includes(func.toUpperCase()) ? func.toUpperCase() : 'COUNT';
    const cleanTable = ALLOWED_TABLES.includes(tableName) ? tableName : 'Bookings';
    
    // Whitelist clean column name or asterisk
    const cleanColumn = column === '*' ? '*' : column.replace(/[^a-zA-Z0-9_]/g, '');

    const sql = `SELECT ${cleanFunc}(${cleanColumn}) AS Aggregate_Result, '${cleanFunc}' AS Function_Name, '${cleanColumn}' AS Column_Name, '${cleanTable}' AS Table_Name FROM ${cleanTable}`;
    return this.executeWithTiming(sql);
  },

  // 4. Display data using condition and operator dropdown
  async query4Conditional(column, operator, value, tableName = 'Slots') {
    const cleanTable = ALLOWED_TABLES.includes(tableName) ? tableName : 'Slots';
    const cleanCol = column.replace(/[^a-zA-Z0-9_]/g, '');
    const cleanOp = ALLOWED_OPERATORS.includes(operator) ? operator : '=';

    const sql = `SELECT * FROM ${cleanTable} WHERE ${cleanCol} ${cleanOp} ? LIMIT 100`;
    const paramVal = cleanOp === 'LIKE' ? `%${value}%` : value;
    return this.executeWithTiming(sql, [paramVal]);
  },

  // 5. Dynamic JOIN on two tables with dropdowns
  async query5Join(table1, table2, joinType = 'INNER JOIN') {
    const t1 = ALLOWED_TABLES.includes(table1) ? table1 : 'Bookings';
    const t2 = ALLOWED_TABLES.includes(table2) ? table2 : 'Farmers';
    const jt = ALLOWED_JOIN_TYPES.includes(joinType.toUpperCase()) ? joinType.toUpperCase() : 'INNER JOIN';

    // Determine the standard foreign key relationship between the tables
    let onClause = '';
    if ((t1 === 'Bookings' && t2 === 'Farmers') || (t1 === 'Farmers' && t2 === 'Bookings')) {
      onClause = 'Bookings.Farmer_ID = Farmers.Farmer_ID';
    } else if ((t1 === 'Bookings' && t2 === 'Slots') || (t1 === 'Slots' && t2 === 'Bookings')) {
      onClause = 'Bookings.Slot_ID = Slots.Slot_ID';
    } else if ((t1 === 'Bookings' && t2 === 'Produce') || (t1 === 'Produce' && t2 === 'Bookings')) {
      onClause = 'Bookings.Produce_ID = Produce.Produce_ID';
    } else if ((t1 === 'Slots' && t2 === 'Mandis') || (t1 === 'Mandis' && t2 === 'Slots')) {
      onClause = 'Slots.Mandi_ID = Mandis.Mandi_ID';
    } else if ((t1 === 'Transactions' && t2 === 'Bookings') || (t1 === 'Bookings' && t2 === 'Transactions')) {
      onClause = 'Transactions.Booking_ID = Bookings.Booking_ID';
    } else if ((t1 === 'Transactions' && t2 === 'Traders') || (t1 === 'Traders' && t2 === 'Transactions')) {
      onClause = 'Transactions.Trader_ID = Traders.Trader_ID';
    } else if ((t1 === 'Transactions' && t2 === 'Warehouses') || (t1 === 'Warehouses' && t2 === 'Transactions')) {
      onClause = 'Transactions.Warehouse_ID = Warehouses.Warehouse_ID';
    } else if ((t1 === 'Warehouses' && t2 === 'Mandis') || (t1 === 'Mandis' && t2 === 'Warehouses')) {
      onClause = 'Warehouses.Mandi_ID = Mandis.Mandi_ID';
    } else {
      // Default fallback
      onClause = `${t1}.${t1.slice(0, -1)}_ID = ${t2}.${t1.slice(0, -1)}_ID`;
    }

    const sql = `SELECT * FROM ${t1} ${jt} ${t2} ON ${onClause} LIMIT 100`;
    return this.executeWithTiming(sql);
  },

  // 6. Subquery from more than one table
  async query6Subquery(district = 'Surat') {
    const sql = `
      SELECT Farmer_ID, Name, Phone, Village
      FROM Farmers
      WHERE Farmer_ID IN (
          SELECT b.Farmer_ID
          FROM Bookings b
          WHERE b.Slot_ID IN (
              SELECT s.Slot_ID
              FROM Slots s
              JOIN Mandis m ON s.Mandi_ID = m.Mandi_ID
              WHERE m.District = ?
          )
      )
    `;
    return this.executeWithTiming(sql, [district]);
  },

  // 7. Correlated Subquery from more than one table
  async query7CorrelatedSubquery() {
    const sql = `
      SELECT b.Booking_ID, b.Farmer_ID, b.Slot_ID, b.Estimated_Weight_Tons, b.Booking_Status
      FROM Bookings b
      WHERE b.Estimated_Weight_Tons > (
          SELECT AVG(b2.Estimated_Weight_Tons)
          FROM Bookings b2
          WHERE b2.Slot_ID = b.Slot_ID
      )
      LIMIT 100
    `;
    return this.executeWithTiming(sql);
  },

  // 8. Update data in table
  async query8UpdateWarehouse(warehouseId, addOccupied) {
    const sql = `
      UPDATE Warehouses
      SET Occupied_Capacity = Occupied_Capacity + ?
      WHERE Warehouse_ID = ? AND (Occupied_Capacity + ?) <= Total_Capacity
    `;
    return this.executeWithTiming(sql, [addOccupied, warehouseId, addOccupied]);
  },

  // Views
  async getFarmerBookingsView(limit = 100) {
    const sql = 'SELECT * FROM Farmer_Bookings_Detail_View LIMIT ?';
    return this.executeWithTiming(sql, [limit]);
  },

  async getSuratMandiOperationsView() {
    const sql = 'SELECT * FROM Surat_Mandi_Operations_View';
    return this.executeWithTiming(sql);
  },

  // Dashboard statistics of all tables
  async getTableStatistics() {
    const sql = `
      SELECT 'Mandis' AS Table_Name, COUNT(*) AS Record_Count FROM Mandis
      UNION ALL
      SELECT 'Produce', COUNT(*) FROM Produce
      UNION ALL
      SELECT 'Farmers', COUNT(*) FROM Farmers
      UNION ALL
      SELECT 'Slots', COUNT(*) FROM Slots
      UNION ALL
      SELECT 'Bookings', COUNT(*) FROM Bookings
      UNION ALL
      SELECT 'Warehouses', COUNT(*) FROM Warehouses
      UNION ALL
      SELECT 'Traders', COUNT(*) FROM Traders
      UNION ALL
      SELECT 'Transactions', COUNT(*) FROM Transactions;
    `;
    const [rows] = await db.query(sql);
    return rows;
  }
};

module.exports = Lab11Repository;
