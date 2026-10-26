const db = require('../config/database');
const logger = require('../utils/logger');
const { maskAadhaar, maskUPI } = require('../utils/maskData');

const AuditService = {
  /**
   * Safe audit logging helper: sanitizes PII and writes to application_audit_log
   */
  async logAudit({ tableName, operationType, recordId, oldData = null, newData = null, changedBy = 'system' }) {
    try {
      const sanitize = (data) => {
        if (!data || typeof data !== 'object') return data;
        const copy = { ...data };
        delete copy.password;
        delete copy.Password_Hash;
        delete copy.passwordHash;
        delete copy.token;
        if (copy.Aadhar_No) copy.Aadhar_No = maskAadhaar(copy.Aadhar_No);
        if (copy.UPI_ID) copy.UPI_ID = maskUPI(copy.UPI_ID);
        return copy;
      };

      const cleanOld = oldData ? JSON.stringify(sanitize(oldData)) : null;
      const cleanNew = newData ? JSON.stringify(sanitize(newData)) : null;

      const sql = `
        INSERT INTO application_audit_log 
          (Table_Name, Operation_Type, Record_ID, Old_Data, New_Data, Changed_By)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await db.query(sql, [
        tableName,
        operationType,
        String(recordId),
        cleanOld,
        cleanNew,
        String(changedBy)
      ]);
    } catch (err) {
      // Audit log failures must be logged but should never crash the primary operation
      logger.warn(`Audit log write failed: ${err.message}`);
    }
  },

  /**
   * Fetch audit logs with pagination and filters (restricted to Admin & Mandi Officers)
   */
  async getAuditLogs({ tableName, operationType, page = 1, limit = 50 } = {}) {
    let sql = 'SELECT Audit_ID, Table_Name, Operation_Type, Record_ID, Old_Data, New_Data, Changed_By, Changed_At FROM application_audit_log WHERE 1=1';
    const params = [];

    if (tableName) {
      sql += ' AND Table_Name = ?';
      params.push(tableName);
    }
    if (operationType) {
      sql += ' AND Operation_Type = ?';
      params.push(operationType);
    }

    try {
      const countSql = sql.replace('SELECT Audit_ID, Table_Name, Operation_Type, Record_ID, Old_Data, New_Data, Changed_By, Changed_At', 'SELECT COUNT(*) AS total');
      const [countRows] = await db.query(countSql, params);
      const total = countRows[0]?.total || 0;

      sql += ' ORDER BY Changed_At DESC LIMIT ? OFFSET ?';
      const offset = (page - 1) * limit;
      params.push(limit, offset);

      const [rows] = await db.query(sql, params);
      return {
        items: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (err) {
      logger.warn(`Audit log read fallback: ${err.message}`);
      return {
        items: [],
        pagination: { total: 0, page: 1, limit, totalPages: 0 }
      };
    }
  }
};

module.exports = AuditService;
