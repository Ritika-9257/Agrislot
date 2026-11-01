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
  },

  async createProduce({ Produce_Name, Category, Storage_Type }) {
    if (!Produce_Name || !Category || !Storage_Type) {
      throw new AppError('Produce_Name, Category, and Storage_Type are required', 400, 'VALIDATION_ERROR');
    }
    const validCategories = ['Grains', 'Pulses', 'Fruits', 'Vegetables', 'Oilseeds'];
    if (!validCategories.includes(Category)) {
      throw new AppError(`Invalid Category. Must be one of: ${validCategories.join(', ')}`, 400, 'INVALID_CATEGORY');
    }
    const validStorage = ['Dry', 'Cold', 'Ambient'];
    if (!validStorage.includes(Storage_Type)) {
      throw new AppError(`Invalid Storage_Type. Must be one of: ${validStorage.join(', ')}`, 400, 'INVALID_STORAGE_TYPE');
    }
    return ProduceRepository.create({ Produce_Name, Category, Storage_Type });
  },

  async updateProduce(produceId, updateData) {
    const existing = await ProduceRepository.findById(produceId);
    if (!existing) {
      throw new AppError(`Produce with ID ${produceId} not found`, 404, 'PRODUCE_NOT_FOUND');
    }
    return ProduceRepository.update(produceId, updateData);
  },

  async deleteProduce(produceId) {
    const existing = await ProduceRepository.findById(produceId);
    if (!existing) {
      throw new AppError(`Produce with ID ${produceId} not found`, 404, 'PRODUCE_NOT_FOUND');
    }
    try {
      const deleted = await ProduceRepository.delete(produceId);
      return deleted;
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new AppError('Cannot delete produce item because it has existing bookings associated with it', 400, 'PRODUCE_IN_USE');
      }
      throw err;
    }
  }
};

module.exports = ProduceService;
