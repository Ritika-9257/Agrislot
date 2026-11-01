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
  }
};

module.exports = ProduceRepository;
