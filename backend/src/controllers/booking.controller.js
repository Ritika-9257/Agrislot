const BookingService = require('../services/booking.service');
const { successResponse } = require('../utils/apiResponse');

const BookingController = {
  async createBooking(req, res, next) {
    try {
      const booking = await BookingService.createBooking(req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Booking created successfully',
        data: booking
      });
    } catch (err) {
      next(err);
    }
  },

  async getBookingById(req, res, next) {
    try {
      const bookingId = parseInt(req.params.id, 10);
      const booking = await BookingService.getBookingById(bookingId);
      return successResponse(res, {
        message: 'Booking fetched successfully',
        data: booking
      });
    } catch (err) {
      next(err);
    }
  },

  async getBookingByToken(req, res, next) {
    try {
      const { token } = req.params;
      const booking = await BookingService.getBookingByToken(token);
      return successResponse(res, {
        message: 'Booking gate-pass token verified successfully',
        data: booking
      });
    } catch (err) {
      next(err);
    }
  },

  async cancelBooking(req, res, next) {
    try {
      const bookingId = parseInt(req.params.id, 10);
      const result = await BookingService.cancelBooking(bookingId, req.user);
      return successResponse(res, {
        message: 'Booking cancelled successfully and capacity released',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async getAllBookings(req, res, next) {
    try {
      const { status, date, mandiId, farmerId, token, page, limit } = req.query;
      const bookings = await BookingService.getAllBookings({
        status,
        date,
        mandiId: mandiId ? parseInt(mandiId, 10) : undefined,
        farmerId: farmerId ? parseInt(farmerId, 10) : undefined,
        token,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20
      });
      return successResponse(res, {
        message: 'Bookings list fetched successfully',
        data: bookings
      });
    } catch (err) {
      next(err);
    }
  },

  async updateBookingStatus(req, res, next) {
    try {
      const bookingId = parseInt(req.params.id, 10);
      const { Booking_Status } = req.body;
      const changedBy = req.user?.username || req.user?.role || 'admin';
      const result = await BookingService.updateBookingStatus(bookingId, Booking_Status, changedBy);
      return successResponse(res, {
        message: 'Booking status updated successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async checkInByToken(req, res, next) {
    try {
      const { token, grossWeightKg, tareWeightKg, bay } = req.body;
      const result = await BookingService.checkInByToken({ token, grossWeightKg, tareWeightKg, bay });
      return successResponse(res, {
        message: 'Vehicle checked in and clearance authorized successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = BookingController;
