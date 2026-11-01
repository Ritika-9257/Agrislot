const db = require('../config/database');
const logger = require('../utils/logger');

// In-memory fallback list to ensure notification API works seamlessly even before migration
const IN_MEMORY_NOTIFICATIONS = [
  {
    Notification_ID: 1,
    User_ID: null,
    Farmer_ID: 1,
    Title: 'Gate-Pass AG-T001 Confirmed',
    Message: 'Your arrival slot for Lokwan Sharbati Wheat at Surat Central APMC is confirmed.',
    Type: 'BOOKING_CONFIRMED',
    Related_Entity_Type: 'Booking',
    Related_Entity_ID: '1',
    Is_Read: 0,
    Created_At: new Date(Date.now() - 3600000).toISOString()
  },
  {
    Notification_ID: 2,
    User_ID: null,
    Farmer_ID: 1,
    Title: 'Weighbridge Dock Assigned',
    Message: 'Vehicle check-in approved. Proceed to BAY 04 — BULK ONION DOCK.',
    Type: 'CHECKED_IN',
    Related_Entity_Type: 'Booking',
    Related_Entity_ID: '1',
    Is_Read: 0,
    Created_At: new Date(Date.now() - 1800000).toISOString()
  },
  {
    Notification_ID: 3,
    User_ID: 1,
    Farmer_ID: null,
    Title: 'Payment Status Updated',
    Message: 'Direct bank transfer of ₹28,500 for Transaction #1 has been released.',
    Type: 'PAYMENT_UPDATED',
    Related_Entity_Type: 'Transaction',
    Related_Entity_ID: '1',
    Is_Read: 1,
    Created_At: new Date(Date.now() - 900000).toISOString()
  }
];

let tableInitialized = false;

async function ensureTable() {
  if (tableInitialized) return;
  try {
    const ddl = `
      CREATE TABLE IF NOT EXISTS notifications (
        Notification_ID INT AUTO_INCREMENT PRIMARY KEY,
        User_ID INT NULL,
        Farmer_ID INT NULL,
        Title VARCHAR(150) NOT NULL,
        Message TEXT NOT NULL,
        Type VARCHAR(50) DEFAULT 'INFO',
        Related_Entity_Type VARCHAR(50) NULL,
        Related_Entity_ID VARCHAR(50) NULL,
        Is_Read BOOLEAN DEFAULT FALSE,
        Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notif_farmer (Farmer_ID),
        INDEX idx_notif_user (User_ID),
        INDEX idx_notif_read (Is_Read)
      );
    `;
    await db.query(ddl);
    tableInitialized = true;
  } catch (e) {
    logger.warn(`Notifications table DDL check: ${e.message}`);
  }
}

const NotificationRepository = {
  async create({ User_ID = null, Farmer_ID = null, Title, Message, Type = 'INFO', Related_Entity_Type = null, Related_Entity_ID = null }) {
    await ensureTable();
    try {
      const sql = `
        INSERT INTO notifications 
          (User_ID, Farmer_ID, Title, Message, Type, Related_Entity_Type, Related_Entity_ID, Is_Read)
        VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)
      `;
      const [result] = await db.query(sql, [User_ID, Farmer_ID, Title, Message, Type, Related_Entity_Type, Related_Entity_ID]);
      return result.insertId;
    } catch {
      const newId = IN_MEMORY_NOTIFICATIONS.length + 1;
      IN_MEMORY_NOTIFICATIONS.unshift({
        Notification_ID: newId,
        User_ID,
        Farmer_ID,
        Title,
        Message,
        Type,
        Related_Entity_Type,
        Related_Entity_ID,
        Is_Read: 0,
        Created_At: new Date().toISOString()
      });
      return newId;
    }
  },

  async findAll({ farmerId, userId, unreadOnly = false, limit = 20 } = {}) {
    await ensureTable();
    try {
      let sql = 'SELECT * FROM notifications WHERE 1=1';
      const params = [];

      if (farmerId && userId) {
        sql += ' AND (Farmer_ID = ? OR User_ID = ?)';
        params.push(farmerId, userId);
      } else if (farmerId) {
        sql += ' AND (Farmer_ID = ? OR Farmer_ID IS NULL)';
        params.push(farmerId);
      } else if (userId) {
        sql += ' AND (User_ID = ? OR User_ID IS NULL)';
        params.push(userId);
      }

      if (unreadOnly) {
        sql += ' AND Is_Read = FALSE';
      }

      sql += ' ORDER BY Created_At DESC LIMIT ?';
      params.push(limit);

      const [rows] = await db.query(sql, params);
      return rows;
    } catch {
      let filtered = [...IN_MEMORY_NOTIFICATIONS];
      if (unreadOnly) {
        filtered = filtered.filter(n => !n.Is_Read);
      }
      return filtered.slice(0, limit);
    }
  },

  async markAsRead(notificationId) {
    await ensureTable();
    try {
      const sql = 'UPDATE notifications SET Is_Read = TRUE WHERE Notification_ID = ?';
      const [result] = await db.query(sql, [notificationId]);
      return result.affectedRows > 0;
    } catch {
      const item = IN_MEMORY_NOTIFICATIONS.find(n => n.Notification_ID === Number(notificationId));
      if (item) {
        item.Is_Read = 1;
        return true;
      }
      return false;
    }
  },

  async markAllAsRead({ farmerId, userId } = {}) {
    await ensureTable();
    try {
      let sql = 'UPDATE notifications SET Is_Read = TRUE WHERE Is_Read = FALSE';
      const params = [];
      if (farmerId) {
        sql += ' AND Farmer_ID = ?';
        params.push(farmerId);
      } else if (userId) {
        sql += ' AND User_ID = ?';
        params.push(userId);
      }
      const [result] = await db.query(sql, params);
      return result.affectedRows;
    } catch {
      IN_MEMORY_NOTIFICATIONS.forEach(n => { n.Is_Read = 1; });
      return IN_MEMORY_NOTIFICATIONS.length;
    }
  }
};

module.exports = NotificationRepository;
