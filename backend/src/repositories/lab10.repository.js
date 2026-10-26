const db = require('../config/database');

const Lab10Repository = {
  // 1. Procedures for Data Manipulation
  async insertFarmerProcedure({ Name, Phone, Aadhar_No, UPI_ID, Village }) {
    const sql = 'CALL Insert_Farmer(?, ?, ?, ?, ?)';
    const [rows] = await db.query(sql, [Name, Phone, Aadhar_No, UPI_ID || null, Village || null]);
    return rows[0] || rows;
  },

  async updateFarmerProcedure({ Farmer_ID, Name, Phone, Aadhar_No, UPI_ID, Village }) {
    const sql = 'CALL Update_Farmer(?, ?, ?, ?, ?, ?)';
    const [rows] = await db.query(sql, [Farmer_ID, Name, Phone, Aadhar_No, UPI_ID || null, Village || null]);
    return rows[0] || rows;
  },

  async deleteFarmerProcedure(farmerId) {
    const sql = 'CALL Delete_Farmer(?)';
    const [rows] = await db.query(sql, [farmerId]);
    return rows[0] || rows;
  },

  // 3. User Login Management
  async insertLoginProcedure({ Username, Password_Hash, User_Role }) {
    const sql = 'CALL Insert_Login(?, ?, ?)';
    const [rows] = await db.query(sql, [Username, Password_Hash, User_Role]);
    return rows[0] || rows;
  },

  async checkLoginProcedure(username) {
    const sql = 'CALL Check_Login(?)';
    const [rows] = await db.query(sql, [username]);
    return rows[0] || rows;
  },

  // 4. Cursor Procedures
  async cursorDisplayAllFarmers() {
    const sql = 'CALL Display_All_Farmers()';
    const [rows] = await db.query(sql);
    return rows[0] || [];
  },

  async cursorDisplayFirstFiveFarmers() {
    const sql = 'CALL Display_First_Five_Farmers()';
    const [rows] = await db.query(sql);
    return rows[0] || [];
  },

  // 5. Paginated Search
  async searchFarmersPaginated(page, pageSize) {
    const sql = 'CALL Search_Farmers_Paginated(?, ?)';
    const [rows] = await db.query(sql, [page, pageSize]);
    return rows[0] || [];
  },

  async searchFarmersFiltered(village, page, pageSize) {
    const sql = 'CALL Search_Farmers_Filtered(?, ?, ?)';
    const [rows] = await db.query(sql, [village || null, page, pageSize]);
    return rows[0] || [];
  },

  // 6. Column Sum Numeric Functions
  async getTotalBookingWeightFunction() {
    const sql = 'SELECT Total_Booking_Weight() AS Total_Weight_Tons';
    const [rows] = await db.query(sql);
    return rows[0];
  },

  async getTotalWeightByFarmerProcedure() {
    const sql = 'CALL Total_Weight_By_Farmer()';
    const [rows] = await db.query(sql);
    return rows[0] || [];
  },

  // 9. Audit Logs
  async getAuditLogs(limit = 50) {
    const sql = 'SELECT Audit_ID, Table_Name, Operation_Type, Record_ID, Old_Data, New_Data, Changed_By, Changed_At FROM application_audit_log ORDER BY Audit_ID DESC LIMIT ?';
    const [rows] = await db.query(sql, [limit]);
    return rows;
  }
};

module.exports = Lab10Repository;
