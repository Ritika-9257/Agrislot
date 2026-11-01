const FarmerService = require('../services/farmer.service');
const { successResponse } = require('../utils/apiResponse');

const FarmerController = {
  async registerFarmer(req, res, next) {
    try {
      const farmer = await FarmerService.registerFarmer(req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Farmer registered successfully',
        data: farmer
      });
    } catch (err) {
      next(err);
    }
  },

  async getFarmerById(req, res, next) {
    try {
      const farmerId = parseInt(req.params.id, 10);
      const isPrivileged = req.user && req.user.role === 'Admin';
      const farmer = await FarmerService.getFarmerById(farmerId, isPrivileged);
      return successResponse(res, {
        message: 'Farmer profile fetched successfully',
        data: farmer
      });
    } catch (err) {
      next(err);
    }
  },

  async getFarmerBookings(req, res, next) {
    try {
      const farmerId = parseInt(req.params.id, 10);
      const bookings = await FarmerService.getFarmerBookings(farmerId);
      return successResponse(res, {
        message: 'Farmer bookings fetched successfully',
        data: bookings
      });
    } catch (err) {
      next(err);
    }
  },

  async getMyProfile(req, res, next) {
    try {
      if (!req.user || !req.user.farmerId) {
        return successResponse(res, {
          message: 'Authenticated farmer profile',
          data: {
            Farmer_ID: null,
            Name: req.user?.name || req.user?.username || 'Demo Farmer',
            Phone: req.user?.username || 'N/A',
            Village: 'Unlinked Demo Profile',
            isDemo: true
          }
        });
      }
      const isPrivileged = req.user.role === 'Admin';
      const farmer = await FarmerService.getFarmerById(req.user.farmerId, isPrivileged);
      return successResponse(res, {
        message: 'Farmer profile fetched successfully',
        data: farmer
      });
    } catch (err) {
      next(err);
    }
  },

  async getMyBookings(req, res, next) {
    try {
      if (!req.user || !req.user.farmerId) {
        return successResponse(res, {
          message: 'Farmer bookings fetched successfully',
          data: []
        });
      }
      const bookings = await FarmerService.getFarmerBookings(req.user.farmerId);
      return successResponse(res, {
        message: 'Farmer bookings fetched successfully',
        data: bookings
      });
    } catch (err) {
      next(err);
    }
  },

  async getAllFarmers(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const farmers = await FarmerService.getAllFarmers({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        search
      });
      return successResponse(res, {
        message: 'Farmers list fetched successfully',
        data: farmers
      });
    } catch (err) {
      next(err);
    }
  },

  // Admin Stored Procedure Actions
  async createFarmerAdmin(req, res, next) {
    try {
      const result = await FarmerService.createFarmerAdmin(req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Farmer created successfully via Stored Procedure Insert_Farmer',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async updateFarmerAdmin(req, res, next) {
    try {
      const farmerId = parseInt(req.params.id, 10);
      const result = await FarmerService.updateFarmerAdmin(farmerId, req.body);
      return successResponse(res, {
        message: 'Farmer updated successfully via Stored Procedure Update_Farmer',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteFarmerAdmin(req, res, next) {
    try {
      const farmerId = parseInt(req.params.id, 10);
      const result = await FarmerService.deleteFarmerAdmin(farmerId);
      return successResponse(res, {
        message: 'Farmer deleted successfully via Stored Procedure Delete_Farmer',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = FarmerController;
