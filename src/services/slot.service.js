const SlotRepository = require('../repositories/slot.repository');
const { AppError } = require('../middleware/errorHandler');

const SlotService = {
  async getAllSlots(filters) {
    return SlotRepository.findAll(filters);
  },

  async getSlotById(slotId) {
    const slot = await SlotRepository.findById(slotId);
    if (!slot) {
      throw new AppError(`Slot with ID ${slotId} not found`, 404, 'SLOT_NOT_FOUND');
    }
    return slot;
  },

  async getUtilization() {
    return SlotRepository.getUtilizationSummary();
  }
};

module.exports = SlotService;
