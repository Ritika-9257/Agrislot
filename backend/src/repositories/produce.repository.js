const db = require('../config/database');

const ProduceRepository = {
  async findAll({ category } = {}) {
    let sql = 'SELECT Produce_ID, Produce_Name, Category, Storage_Type FROM Produce WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND Category = ?';
      params.push(category);
    }

    sql += ' ORDER BY Produce_Name ASC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  async findById(produceId) {
    const sql = 'SELECT Produce_ID, Produce_Name, Category, Storage_Type FROM Produce WHERE Produce_ID = ?';
    const [rows] = await db.query(sql, [produceId]);
    return rows[0] || null;
  },

  async create({ Produce_Name, Category, Storage_Type }) {
    const sql = 'INSERT INTO Produce (Produce_Name, Category, Storage_Type) VALUES (?, ?, ?)';
    const [result] = await db.query(sql, [Produce_Name, Category, Storage_Type]);
    return this.findById(result.insertId);
  },

  async update(produceId, updateData) {
    const fields = [];
    const values = [];

    if (updateData.Produce_Name !== undefined) {
      fields.push('Produce_Name = ?');
      values.push(updateData.Produce_Name);
    }
    if (updateData.Category !== undefined) {
      fields.push('Category = ?');
      values.push(updateData.Category);
    }
    if (updateData.Storage_Type !== undefined) {
      fields.push('Storage_Type = ?');
      values.push(updateData.Storage_Type);
    }

    if (fields.length === 0) return this.findById(produceId);

    values.push(produceId);
    const sql = `UPDATE Produce SET ${fields.join(', ')} WHERE Produce_ID = ?`;
    await db.query(sql, values);
    return this.findById(produceId);
  },

  async delete(produceId) {
    const sql = 'DELETE FROM Produce WHERE Produce_ID = ?';
    const [result] = await db.query(sql, [produceId]);
    return result.affectedRows > 0;
  }
};

module.exports = ProduceRepository;
