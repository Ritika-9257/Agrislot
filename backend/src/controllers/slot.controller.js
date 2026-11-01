const SlotService = require('../services/slot.service');
const { successResponse } = require('../utils/apiResponse');

const SlotController = {
  async getAllSlots(req, res, next) {
    try {
      const { mandiId, date, availableOnly, page, limit } = req.query;
      const slots = await SlotService.getAllSlots({
        mandiId: mandiId ? parseInt(mandiId, 10) : undefined,
        date,
        availableOnly: availableOnly === 'true',
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50
      });
      return successResponse(res, {
        message: 'Slots fetched successfully',
        data: slots
      });
    } catch (err) {
      next(err);
    }
  },

  async getSlotById(req, res, next) {
    try {
      const slotId = parseInt(req.params.id, 10);
      const slot = await SlotService.getSlotById(slotId);
      return successResponse(res, {
        message: 'Slot details fetched successfully',
        data: slot
      });
    } catch (err) {
      next(err);
    }
  },

  async getUtilization(req, res, next) {
    try {
      const summary = await SlotService.getUtilization();
      return successResponse(res, {
        message: 'Mandi slot utilization summary fetched successfully',
        data: summary
      });
    } catch (err) {
      next(err);
    }
  },

  async createSlot(req, res, next) {
    try {
      const slot = await SlotService.createSlot(req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Slot created successfully',
        data: slot
      });
    } catch (err) {
      next(err);
    }
  },

  async updateSlot(req, res, next) {
    try {
      const slotId = parseInt(req.params.id, 10);
      const slot = await SlotService.updateSlot(slotId, req.body);
      return successResponse(res, {
        message: 'Slot updated successfully',
        data: slot
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteSlot(req, res, next) {
    try {
      const slotId = parseInt(req.params.id, 10);
      await SlotService.deleteSlot(slotId);
      return successResponse(res, {
        message: 'Slot deleted successfully',
        data: null
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = SlotController;
