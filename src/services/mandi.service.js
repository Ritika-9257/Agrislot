const MandiRepository = require('../repositories/mandi.repository');
const { AppError } = require('../middleware/errorHandler');

const MandiService = {
  async getAllMandis(filters) {
    return MandiRepository.findAll(filters);
  },

  async getMandiById(mandiId) {
    const mandi = await MandiRepository.findById(mandiId);
    if (!mandi) {
      throw new AppError(`Mandi with ID ${mandiId} not found`, 404, 'MANDI_NOT_FOUND');
    }
    return mandi;
  },

  async getMandiSlots(mandiId, filters) {
    await this.getMandiById(mandiId);
    return MandiRepository.findSlotsByMandiId(mandiId, filters);
  }
};

module.exports = MandiService;
