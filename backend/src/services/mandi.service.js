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
  },

  async createMandi({ Mandi_Name, Location, District, Total_Daily_Capacity_Tons }) {
    if (!Mandi_Name || !Location || !District) {
      throw new AppError('Mandi_Name, Location, and District are required fields', 400, 'VALIDATION_ERROR');
    }
    const capacity = parseFloat(Total_Daily_Capacity_Tons);
    if (isNaN(capacity) || capacity <= 0) {
      throw new AppError('Total_Daily_Capacity_Tons must be a positive number', 400, 'VALIDATION_ERROR');
    }

    const mandiId = await MandiRepository.create({
      Mandi_Name: Mandi_Name.trim(),
      Location: Location.trim(),
      District: District.trim(),
      Total_Daily_Capacity_Tons: capacity
    });

    return this.getMandiById(mandiId);
  },

  async updateMandi(mandiId, updates) {
    await this.getMandiById(mandiId);

    const payload = {};
    if (updates.Mandi_Name) payload.Mandi_Name = updates.Mandi_Name.trim();
    if (updates.Location) payload.Location = updates.Location.trim();
    if (updates.District) payload.District = updates.District.trim();
    if (updates.Total_Daily_Capacity_Tons !== undefined) {
      const cap = parseFloat(updates.Total_Daily_Capacity_Tons);
      if (isNaN(cap) || cap <= 0) {
        throw new AppError('Total_Daily_Capacity_Tons must be a positive number', 400, 'VALIDATION_ERROR');
      }
      payload.Total_Daily_Capacity_Tons = cap;
    }

    await MandiRepository.update(mandiId, payload);
    return this.getMandiById(mandiId);
  },

  async deleteMandi(mandiId) {
    await this.getMandiById(mandiId);
    await MandiRepository.delete(mandiId);
    return { success: true, message: `Mandi with ID ${mandiId} deleted successfully` };
  }
};

module.exports = MandiService;
