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
  }
};

module.exports = ProduceController;
