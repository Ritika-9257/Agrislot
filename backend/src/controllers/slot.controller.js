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

  async getSlotBookings(req, res, next) {
    try {
      const slotId = parseInt(req.params.id, 10);
      const result = await SlotService.getSlotBookings(slotId);
      return successResponse(res, {
        message: 'Slot bookings fetched successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async updateSlotLimits(req, res, next) {
    try {
      const slotId = parseInt(req.params.id, 10);
      const { maxBookings, maxCapacityTons, status } = req.body;
      const updated = await SlotService.updateSlotLimits(
        slotId,
        { maxBookings, maxCapacityTons, status },
        req.user
      );
      return successResponse(res, {
        message: 'Slot limits updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  async reconcileSlot(req, res, next) {
    try {
      const slotId = req.params.id ? parseInt(req.params.id, 10) : null;
      const result = await SlotService.reconcileSlot(slotId);
      return successResponse(res, {
        message: 'Slot counters reconciled successfully from active bookings',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = SlotController;
