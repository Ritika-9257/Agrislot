const Lab11Repository = require('../repositories/lab11.repository');
const { toXmlDocument } = require('../utils/xmlFormatter');

const Lab11Service = {
  // Query 1: Display all records (supports XML)
  async getQuery1DisplayAll(tableName, format = 'json') {
    const result = await Lab11Repository.query1DisplayAll(tableName);
    if (format === 'xml') {
      result.xml = toXmlDocument(result.rows, 'AgriSlotTable', tableName || 'Record');
    }
    return result;
  },

  // Query 2: Insert data maintaining constraints
  async runQuery2Insert(data) {
    return Lab11Repository.query2InsertFarmer(data);
  },

  // Query 3: Aggregate function with dropdown (supports XML)
  async runQuery3Aggregate(func, column, tableName, format = 'json') {
    const result = await Lab11Repository.query3Aggregate(func, column, tableName);
    if (format === 'xml') {
      result.xml = toXmlDocument(result.rows, 'AgriSlotAggregate', 'Result');
    }
    return result;
  },

  // Query 4: Conditional query with dropdown (supports XML)
  async runQuery4Conditional(column, operator, value, tableName, format = 'json') {
    const result = await Lab11Repository.query4Conditional(column, operator, value, tableName);
    if (format === 'xml') {
      result.xml = toXmlDocument(result.rows, 'AgriSlotConditional', 'Record');
    }
    return result;
  },

  // Query 5: Dynamic 2-table Join with dropdowns
  async runQuery5Join(table1, table2, joinType) {
    return Lab11Repository.query5Join(table1, table2, joinType);
  },

  // Query 6: Subquery
  async runQuery6Subquery(district) {
    return Lab11Repository.query6Subquery(district);
  },

  // Query 7: Correlated subquery
  async runQuery7Correlated() {
    return Lab11Repository.query7CorrelatedSubquery();
  },

  // Query 8: Update table data
  async runQuery8Update(warehouseId, addOccupied) {
    return Lab11Repository.query8UpdateWarehouse(warehouseId, addOccupied);
  },

  // Views
  async getFarmerBookingsView(limit) {
    return Lab11Repository.getFarmerBookingsView(limit);
  },

  async getSuratMandiOperationsView() {
    return Lab11Repository.getSuratMandiOperationsView();
  },

  // Dashboard table statistics
  async getDashboardStatistics() {
    return Lab11Repository.getTableStatistics();
  }
};

module.exports = Lab11Service;
