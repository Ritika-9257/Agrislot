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
  },

  async createSlot(slotData) {
    if (!slotData.Mandi_ID || !slotData.Slot_Date || !slotData.Start_Time || !slotData.End_Time) {
      throw new AppError('Mandi_ID, Slot_Date, Start_Time, and End_Time are required', 400, 'VALIDATION_ERROR');
    }
    return SlotRepository.create(slotData);
  },

  async updateSlot(slotId, updateData) {
    const existing = await SlotRepository.findById(slotId);
    if (!existing) {
      throw new AppError(`Slot with ID ${slotId} not found`, 404, 'SLOT_NOT_FOUND');
    }
    return SlotRepository.update(slotId, updateData);
  },

  async deleteSlot(slotId) {
    const existing = await SlotRepository.findById(slotId);
    if (!existing) {
      throw new AppError(`Slot with ID ${slotId} not found`, 404, 'SLOT_NOT_FOUND');
    }
    try {
      const deleted = await SlotRepository.delete(slotId);
      return deleted;
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new AppError('Cannot delete slot because it has existing bookings associated with it', 400, 'SLOT_HAS_BOOKINGS');
      }
      throw err;
    }
  }
};

module.exports = SlotService;
