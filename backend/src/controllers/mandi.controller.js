const MandiService = require('../services/mandi.service');
const { successResponse } = require('../utils/apiResponse');

const MandiController = {
  async getAllMandis(req, res, next) {
    try {
      const { district, page, limit } = req.query;
      const mandis = await MandiService.getAllMandis({
        district,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50
      });
      return successResponse(res, {
        message: 'Mandis fetched successfully',
        data: mandis
      });
    } catch (err) {
      next(err);
    }
  },

  async getMandiById(req, res, next) {
    try {
      const mandiId = parseInt(req.params.id, 10);
      const mandi = await MandiService.getMandiById(mandiId);
      return successResponse(res, {
        message: 'Mandi details fetched successfully',
        data: mandi
      });
    } catch (err) {
      next(err);
    }
  },

  async getMandiSlots(req, res, next) {
    try {
      const mandiId = parseInt(req.params.id, 10);
      const { date, availableOnly } = req.query;
      const slots = await MandiService.getMandiSlots(mandiId, {
        date,
        availableOnly: availableOnly === 'true'
      });
      return successResponse(res, {
        message: 'Mandi slots fetched successfully',
        data: slots
      });
    } catch (err) {
      next(err);
    }
  },

  async createMandi(req, res, next) {
    try {
      const mandi = await MandiService.createMandi(req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Mandi created successfully',
        data: mandi
      });
    } catch (err) {
      next(err);
    }
  },

  async updateMandi(req, res, next) {
    try {
      const mandiId = parseInt(req.params.id, 10);
      const mandi = await MandiService.updateMandi(mandiId, req.body);
      return successResponse(res, {
        message: 'Mandi updated successfully',
        data: mandi
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteMandi(req, res, next) {
    try {
      const mandiId = parseInt(req.params.id, 10);
      const result = await MandiService.deleteMandi(mandiId);
      return successResponse(res, {
        message: 'Mandi deleted successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = MandiController;
