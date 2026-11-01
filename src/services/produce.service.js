const ProduceRepository = require('../repositories/produce.repository');
const { AppError } = require('../middleware/errorHandler');

const ProduceService = {
  async getAllProduce(filters) {
    return ProduceRepository.findAll(filters);
  },

  async getProduceById(produceId) {
    const produce = await ProduceRepository.findById(produceId);
    if (!produce) {
      throw new AppError(`Produce with ID ${produceId} not found`, 404, 'PRODUCE_NOT_FOUND');
    }
    return produce;
  }
};

module.exports = ProduceService;
