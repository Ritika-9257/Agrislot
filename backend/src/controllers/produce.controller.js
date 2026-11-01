const ProduceService = require('../services/produce.service');
const { successResponse } = require('../utils/apiResponse');

const ProduceController = {
  async getAllProduce(req, res, next) {
    try {
      const { category } = req.query;
      const produce = await ProduceService.getAllProduce({ category });
      return successResponse(res, {
        message: 'Produce list fetched successfully',
        data: produce
      });
    } catch (err) {
      next(err);
    }
  },

  async getProduceById(req, res, next) {
    try {
      const produceId = parseInt(req.params.id, 10);
      const produce = await ProduceService.getProduceById(produceId);
      return successResponse(res, {
        message: 'Produce details fetched successfully',
        data: produce
      });
    } catch (err) {
      next(err);
    }
  },

  async createProduce(req, res, next) {
    try {
      const produce = await ProduceService.createProduce(req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Produce item created successfully',
        data: produce
      });
    } catch (err) {
      next(err);
    }
  },

  async updateProduce(req, res, next) {
    try {
      const produceId = parseInt(req.params.id, 10);
      const produce = await ProduceService.updateProduce(produceId, req.body);
      return successResponse(res, {
        message: 'Produce item updated successfully',
        data: produce
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteProduce(req, res, next) {
    try {
      const produceId = parseInt(req.params.id, 10);
      await ProduceService.deleteProduce(produceId);
      return successResponse(res, {
        message: 'Produce item deleted successfully',
        data: null
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = ProduceController;
