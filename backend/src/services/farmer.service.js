const FarmerRepository = require('../repositories/farmer.repository');
const { maskFarmerProfile } = require('../utils/maskData');
const { AppError } = require('../middleware/errorHandler');

const FarmerService = {
  async registerFarmer(data) {
    // Check duplicate phone
    const existingPhone = await FarmerRepository.findByPhone(data.Phone);
    if (existingPhone) {
      throw new AppError('A farmer with this phone number is already registered', 409, 'DUPLICATE_PHONE');
    }

    // Check duplicate Aadhaar
    const existingAadhaar = await FarmerRepository.findByAadhaar(data.Aadhar_No);
    if (existingAadhaar) {
      throw new AppError('A farmer with this Aadhaar number is already registered', 409, 'DUPLICATE_AADHAAR');
    }

    const farmerId = await FarmerRepository.create(data);
    const created = await FarmerRepository.findById(farmerId);
    return maskFarmerProfile(created);
  },

  async getFarmerById(farmerId, isPrivileged = false) {
    const farmer = await FarmerRepository.findById(farmerId);
    if (!farmer) {
      throw new AppError(`Farmer with ID ${farmerId} not found`, 404, 'FARMER_NOT_FOUND');
    }
    return isPrivileged ? farmer : maskFarmerProfile(farmer);
  },

  async getFarmerBookings(farmerId) {
    await this.getFarmerById(farmerId);
    return FarmerRepository.findBookingsByFarmerId(farmerId);
  },

  async getAllFarmers(filters) {
    return FarmerRepository.findAll(filters);
  }
};

module.exports = FarmerService;
