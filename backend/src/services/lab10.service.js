const Lab10Repository = require('../repositories/lab10.repository');
const { AppError } = require('../middleware/errorHandler');

const Lab10Service = {
  async insertFarmerProcedure(data) {
    return Lab10Repository.insertFarmerProcedure(data);
  },

  async updateFarmerProcedure(data) {
    return Lab10Repository.updateFarmerProcedure(data);
  },

  async deleteFarmerProcedure(farmerId) {
    return Lab10Repository.deleteFarmerProcedure(farmerId);
  },

  async insertLoginProcedure(data) {
    return Lab10Repository.insertLoginProcedure(data);
  },

  async checkLoginProcedure(username) {
    const result = await Lab10Repository.checkLoginProcedure(username);
    if (!result || result.length === 0) {
      throw new AppError('User not found or account is inactive', 404, 'LOGIN_NOT_FOUND');
    }
    return result[0];
  },

  async cursorDisplayAll() {
    return Lab10Repository.cursorDisplayAllFarmers();
  },

  async cursorDisplayFirstFive() {
    return Lab10Repository.cursorDisplayFirstFiveFarmers();
  },

  async searchPaginated(page = 1, pageSize = 5) {
    return Lab10Repository.searchFarmersPaginated(page, pageSize);
  },

  async searchFiltered(village, page = 1, pageSize = 5) {
    return Lab10Repository.searchFarmersFiltered(village, page, pageSize);
  },

  async getTotalBookingWeight() {
    return Lab10Repository.getTotalBookingWeightFunction();
  },

  async getTotalWeightByFarmer() {
    return Lab10Repository.getTotalWeightByFarmerProcedure();
  },

  async getAuditLogs(limit = 50) {
    return Lab10Repository.getAuditLogs(limit);
  }
};

module.exports = Lab10Service;
