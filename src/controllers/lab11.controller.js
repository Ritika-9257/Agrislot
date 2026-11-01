const Lab11Service = require('../services/lab11.service');
const { successResponse } = require('../utils/apiResponse');

const Lab11Controller = {
  // Query 1: Display all records from main table (with optional XML)
  async query1(req, res, next) {
    try {
      const { table = 'Bookings', format = 'json' } = req.query;
      const result = await Lab11Service.getQuery1DisplayAll(table, format);
      
      if (format === 'xml') {
        res.header('Content-Type', 'application/xml');
        return res.send(result.xml);
      }

      return successResponse(res, {
        message: `Query 1: Displayed all records from ${table}`,
        data: result.rows,
        meta: {
          executionTimeMs: result.executionTimeMs,
          sql: result.sql
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Query 2: Insert data maintaining integrity constraints
  async query2(req, res, next) {
    try {
      const result = await Lab11Service.runQuery2Insert(req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Query 2: Data inserted maintaining integrity constraints',
        data: result.rows,
        meta: {
          executionTimeMs: result.executionTimeMs,
          sql: result.sql
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Query 3: Aggregate function with dropdown (with optional XML)
  async query3(req, res, next) {
    try {
      const { func = 'COUNT', column = '*', table = 'Bookings', format = 'json' } = req.query;
      const result = await Lab11Service.runQuery3Aggregate(func, column, table, format);

      if (format === 'xml') {
        res.header('Content-Type', 'application/xml');
        return res.send(result.xml);
      }

      return successResponse(res, {
        message: `Query 3: Aggregate ${func}(${column}) on ${table}`,
        data: result.rows,
        meta: {
          executionTimeMs: result.executionTimeMs,
          sql: result.sql
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Query 4: Conditional query with operator dropdown (with optional XML)
  async query4(req, res, next) {
    try {
      const { column = 'Max_Capacity_Tons', operator = '>', value = '40', table = 'Slots', format = 'json' } = req.query;
      const result = await Lab11Service.runQuery4Conditional(column, operator, value, table, format);

      if (format === 'xml') {
        res.header('Content-Type', 'application/xml');
        return res.send(result.xml);
      }

      return successResponse(res, {
        message: `Query 4: Conditional query ${column} ${operator} ${value} on ${table}`,
        data: result.rows,
        meta: {
          executionTimeMs: result.executionTimeMs,
          sql: result.sql
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Query 5: Dynamic 2-table Join with dropdowns
  async query5(req, res, next) {
    try {
      const { table1 = 'Bookings', table2 = 'Farmers', joinType = 'INNER JOIN' } = req.query;
      const result = await Lab11Service.runQuery5Join(table1, table2, joinType);
      return successResponse(res, {
        message: `Query 5: ${joinType} between ${table1} and ${table2}`,
        data: result.rows,
        meta: {
          executionTimeMs: result.executionTimeMs,
          sql: result.sql
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Query 6: Subquery
  async query6(req, res, next) {
    try {
      const { district = 'Surat' } = req.query;
      const result = await Lab11Service.runQuery6Subquery(district);
      return successResponse(res, {
        message: `Query 6: Subquery finding farmers with bookings in ${district} Mandi`,
        data: result.rows,
        meta: {
          executionTimeMs: result.executionTimeMs,
          sql: result.sql
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Query 7: Correlated Subquery
  async query7(req, res, next) {
    try {
      const result = await Lab11Service.runQuery7Correlated();
      return successResponse(res, {
        message: 'Query 7: Correlated subquery for bookings heavier than slot average',
        data: result.rows,
        meta: {
          executionTimeMs: result.executionTimeMs,
          sql: result.sql
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Query 8: Update table data
  async query8(req, res, next) {
    try {
      const { warehouseId = 1, addOccupied = 5.0 } = req.body;
      const result = await Lab11Service.runQuery8Update(parseInt(warehouseId, 10), parseFloat(addOccupied));
      return successResponse(res, {
        message: 'Query 8: Updated table data successfully',
        data: result.rows,
        meta: {
          executionTimeMs: result.executionTimeMs,
          sql: result.sql
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Views
  async getFarmerBookingsView(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const result = await Lab11Service.getFarmerBookingsView(limit);
      return successResponse(res, {
        message: 'Farmer Bookings Detail View fetched successfully',
        data: result.rows,
        meta: {
          executionTimeMs: result.executionTimeMs
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getSuratMandiOperationsView(req, res, next) {
    try {
      const result = await Lab11Service.getSuratMandiOperationsView();
      return successResponse(res, {
        message: 'Surat Mandi Operations View fetched successfully',
        data: result.rows,
        meta: {
          executionTimeMs: result.executionTimeMs
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Dashboard Table Statistics
  async getDashboardStatistics(req, res, next) {
    try {
      const stats = await Lab11Service.getDashboardStatistics();
      return successResponse(res, {
        message: 'Live database table statistics fetched successfully',
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = Lab11Controller;
