const db = require('../config/database');

const USER_COLUMNS = 'User_ID, Username, Password_Hash, User_Role, Account_Status, Google_Sub, Email, Full_Name, Avatar_Url, Farmer_ID, Created_At, Last_Login';
const LEGACY_USER_COLUMNS = 'User_ID, Username, Password_Hash, User_Role, Account_Status, Created_At, Last_Login';

const UserRepository = {
  async findByUsername(username) {
    try {
      const sql = `SELECT ${USER_COLUMNS} FROM User_Login WHERE Username = ?`;
      const [rows] = await db.query(sql, [username]);
      return rows[0] || null;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const fallbackSql = `SELECT ${LEGACY_USER_COLUMNS} FROM User_Login WHERE Username = ?`;
        const [rows] = await db.query(fallbackSql, [username]);
        return rows[0] || null;
      }
      throw err;
    }
  },

  async findByUsernameOrIdentifier(identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).trim();
    try {
      const sql = `
        SELECT 
          u.User_ID, u.Username, u.Password_Hash, u.User_Role, u.Account_Status,
          u.Google_Sub, u.Email, u.Full_Name, u.Avatar_Url, u.Farmer_ID,
          u.Created_At, u.Last_Login,
          f.Phone AS Farmer_Phone
        FROM User_Login u
        LEFT JOIN Farmers f ON u.Farmer_ID = f.Farmer_ID
        WHERE u.Username = ? OR f.Phone = ? OR (u.Email IS NOT NULL AND u.Email = ?)
        LIMIT 1
      `;
      const [rows] = await db.query(sql, [cleanId, cleanId, cleanId.toLowerCase()]);
      return rows[0] || null;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        return this.findByUsername(cleanId);
      }
      throw err;
    }
  },

  async findByFarmerId(farmerId) {
    if (!farmerId) return null;
    try {
      const sql = `SELECT ${USER_COLUMNS} FROM User_Login WHERE Farmer_ID = ? LIMIT 1`;
      const [rows] = await db.query(sql, [farmerId]);
      return rows[0] || null;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        return null;
      }
      throw err;
    }
  },

  async findById(userId) {
    try {
      const sql = `SELECT ${USER_COLUMNS} FROM User_Login WHERE User_ID = ?`;
      const [rows] = await db.query(sql, [userId]);
      return rows[0] || null;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const fallbackSql = `SELECT ${LEGACY_USER_COLUMNS} FROM User_Login WHERE User_ID = ?`;
        const [rows] = await db.query(fallbackSql, [userId]);
        return rows[0] || null;
      }
      throw err;
    }
  },

  async findByGoogleSub(googleSub) {
    if (!googleSub) return null;
    try {
      const sql = `SELECT ${USER_COLUMNS} FROM User_Login WHERE Google_Sub = ?`;
      const [rows] = await db.query(sql, [googleSub]);
      return rows[0] || null;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        return null;
      }
      throw err;
    }
  },

  async findByEmail(email) {
    if (!email) return null;
    try {
      const sql = `SELECT ${USER_COLUMNS} FROM User_Login WHERE Email = ?`;
      const [rows] = await db.query(sql, [email.toLowerCase().trim()]);
      return rows[0] || null;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        return null;
      }
      throw err;
    }
  },

  async create({ username, passwordHash, role = 'Farmer', status = 'Active', fullName = null, email = null, farmerId = null }, connection = null) {
    const executor = connection || db;
    try {
      const sql = `
        INSERT INTO User_Login 
        (Username, Password_Hash, User_Role, Account_Status, Full_Name, Email, Farmer_ID)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await executor.query(sql, [
        username,
        passwordHash,
        role,
        status,
        fullName || null,
        email ? email.toLowerCase().trim() : null,
        farmerId || null
      ]);
      return result.insertId;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const fallbackSql = 'INSERT INTO User_Login (Username, Password_Hash, User_Role, Account_Status) VALUES (?, ?, ?, ?)';
        const [result] = await executor.query(fallbackSql, [username, passwordHash, role, status]);
        return result.insertId;
      }
      throw err;
    }
  },

  async createGoogleUser({
    username,
    email,
    googleSub,
    passwordHash,
    fullName = null,
    avatarUrl = null,
    role = 'Farmer',
    status = 'Active',
    farmerId = null
  }) {
    try {
      const sql = `
        INSERT INTO User_Login 
        (Username, Password_Hash, User_Role, Account_Status, Google_Sub, Email, Full_Name, Avatar_Url, Farmer_ID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await db.query(sql, [
        username,
        passwordHash,
        role,
        status,
        googleSub,
        email.toLowerCase().trim(),
        fullName,
        avatarUrl,
        farmerId
      ]);
      return result.insertId;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        // Fallback for non-migrated schema
        return this.create({ username, passwordHash, role, status });
      }
      throw err;
    }
  },

  async linkGoogleSub(userId, googleSub, avatarUrl = null, fullName = null) {
    try {
      const sql = `
        UPDATE User_Login 
        SET Google_Sub = ?,
            Avatar_Url = COALESCE(?, Avatar_Url),
            Full_Name = COALESCE(?, Full_Name),
            Last_Login = CURRENT_TIMESTAMP
        WHERE User_ID = ?
      `;
      await db.query(sql, [googleSub, avatarUrl, fullName, userId]);
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        return this.updateLastLogin(userId);
      }
      throw err;
    }
  },

  async updateProfileMetadata(userId, { avatarUrl = null, fullName = null } = {}) {
    try {
      const sql = `
        UPDATE User_Login 
        SET Avatar_Url = COALESCE(?, Avatar_Url),
            Full_Name = COALESCE(?, Full_Name)
        WHERE User_ID = ?
      `;
      await db.query(sql, [avatarUrl, fullName, userId]);
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') return;
      throw err;
    }
  },

  async updateLastLogin(userId) {
    const sql = 'UPDATE User_Login SET Last_Login = CURRENT_TIMESTAMP WHERE User_ID = ?';
    await db.query(sql, [userId]);
  },

  async updatePassword(userId, passwordHash) {
    const sql = 'UPDATE User_Login SET Password_Hash = ? WHERE User_ID = ?';
    await db.query(sql, [passwordHash, userId]);
  },

  async linkFarmer(userId, farmerId) {
    try {
      const sql = 'UPDATE User_Login SET Farmer_ID = ? WHERE User_ID = ?';
      await db.query(sql, [farmerId, userId]);
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') return;
      throw err;
    }
  },

  async findAll({ page = 1, limit = 20, search, role, status } = {}) {
    let whereSql = '1=1';
    const params = [];

    if (search) {
      whereSql += ' AND (Username LIKE ? OR Email LIKE ? OR Full_Name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (role) {
      whereSql += ' AND User_Role = ?';
      params.push(role);
    }

    if (status) {
      whereSql += ' AND Account_Status = ?';
      params.push(status);
    }

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
    const offset = (safePage - 1) * safeLimit;

    let total = 0;
    try {
      const countSql = `SELECT COUNT(*) AS total FROM User_Login WHERE ${whereSql}`;
      const [countRows] = await db.query(countSql, params);
      total = countRows[0]?.total || 0;
    } catch {
      total = 0;
    }

    try {
      const selectSql = `
        SELECT User_ID, Username, User_Role, Account_Status, Google_Sub, Email, Full_Name, Avatar_Url, Farmer_ID, Created_At, Last_Login
        FROM User_Login
        WHERE ${whereSql}
        ORDER BY User_ID ASC
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
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const fallbackSql = `
          SELECT User_ID, Username, User_Role, Account_Status, Created_At, Last_Login
          FROM User_Login
          WHERE ${whereSql}
          ORDER BY User_ID ASC
          LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query(fallbackSql, [...params, safeLimit, offset]);
        rows.items = rows;
        rows.pagination = {
          total,
          page: safePage,
          limit: safeLimit,
          totalPages: Math.ceil(total / safeLimit) || 1
        };
        return rows;
      }
      throw err;
    }
  },

  async countActiveAdmins() {
    try {
      const sql = "SELECT COUNT(*) AS total FROM User_Login WHERE User_Role = 'Admin' AND Account_Status = 'Active'";
      const [rows] = await db.query(sql);
      return rows[0]?.total || 0;
    } catch {
      return 1;
    }
  },

  async updateUserRole(userId, newRole) {
    const sql = 'UPDATE User_Login SET User_Role = ? WHERE User_ID = ?';
    await db.query(sql, [newRole, userId]);
    return this.findById(userId);
  },

  async updateAccountStatus(userId, newStatus) {
    const sql = 'UPDATE User_Login SET Account_Status = ? WHERE User_ID = ?';
    await db.query(sql, [newStatus, userId]);
    return this.findById(userId);
  }
};

module.exports = UserRepository;
