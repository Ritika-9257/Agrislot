const Lab10Service = require('../services/lab10.service');
const { successResponse } = require('../utils/apiResponse');

const Lab10Controller = {
  // 1. Stored Procedures CRUD
  async insertFarmerProcedure(req, res, next) {
    try {
      const result = await Lab10Service.insertFarmerProcedure(req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Procedure Insert_Farmer executed successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async updateFarmerProcedure(req, res, next) {
    try {
      const result = await Lab10Service.updateFarmerProcedure(req.body);
      return successResponse(res, {
        message: 'Procedure Update_Farmer executed successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteFarmerProcedure(req, res, next) {
    try {
      const farmerId = parseInt(req.params.id, 10);
      const result = await Lab10Service.deleteFarmerProcedure(farmerId);
      return successResponse(res, {
        message: 'Procedure Delete_Farmer executed successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  // 3. User Login Management
  async insertLoginProcedure(req, res, next) {
    try {
      const result = await Lab10Service.insertLoginProcedure(req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Procedure Insert_Login executed successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async checkLoginProcedure(req, res, next) {
    try {
      const { username } = req.query;
      const result = await Lab10Service.checkLoginProcedure(username);
      return successResponse(res, {
        message: 'Procedure Check_Login executed successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. Explicit Cursors
  async cursorDisplayAll(req, res, next) {
    try {
      const result = await Lab10Service.cursorDisplayAll();
      return successResponse(res, {
        message: 'Procedure Display_All_Farmers (Cursor without limit) executed successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async cursorDisplayFirstFive(req, res, next) {
    try {
      const result = await Lab10Service.cursorDisplayFirstFive();
      return successResponse(res, {
        message: 'Procedure Display_First_Five_Farmers (Cursor with limit 5) executed successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  // 5. Paginated Search
  async searchPaginated(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 5;
      const result = await Lab10Service.searchPaginated(page, pageSize);
      return successResponse(res, {
        message: 'Procedure Search_Farmers_Paginated executed successfully',
        data: result,
        meta: { page, pageSize }
      });
    } catch (err) {
      next(err);
    }
  },

  async searchFiltered(req, res, next) {
    try {
      const { village } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 5;
      const result = await Lab10Service.searchFiltered(village, page, pageSize);
      return successResponse(res, {
        message: 'Procedure Search_Farmers_Filtered executed successfully',
        data: result,
        meta: { village: village || 'All', page, pageSize }
      });
    } catch (err) {
      next(err);
    }
  },

  // 6. Column Sum Functions
  async getTotalBookingWeight(req, res, next) {
    try {
      const result = await Lab10Service.getTotalBookingWeight();
      return successResponse(res, {
        message: 'Function Total_Booking_Weight() executed successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async getTotalWeightByFarmer(req, res, next) {
    try {
      const result = await Lab10Service.getTotalWeightByFarmer();
      return successResponse(res, {
        message: 'Procedure Total_Weight_By_Farmer() executed successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  // 9. Audit Logs
  async getAuditLogs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const logs = await Lab10Service.getAuditLogs(limit);
      return successResponse(res, {
        message: 'Application audit logs fetched successfully',
        data: logs
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = Lab10Controller;
