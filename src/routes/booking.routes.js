const express = require('express');
const BookingController = require('../controllers/booking.controller');
const validateRequest = require('../middleware/validateRequest');
const { authenticateOptional } = require('../middleware/authenticate');
const { 
  createBookingSchema, 
  bookingIdParamSchema, 
  bookingTokenParamSchema,
  filterBookingsQuerySchema 
} = require('../validators/booking.validator');

const router = express.Router();

router.get('/', validateRequest({ query: filterBookingsQuerySchema }), BookingController.getAllBookings);
router.post('/', validateRequest({ body: createBookingSchema }), BookingController.createBooking);
router.post('/check-in', BookingController.checkInByToken);
router.get('/token/:token', validateRequest({ params: bookingTokenParamSchema }), BookingController.getBookingByToken);
router.get('/:id', validateRequest({ params: bookingIdParamSchema }), authenticateOptional, BookingController.getBookingById);
router.patch('/:id/cancel', validateRequest({ params: bookingIdParamSchema }), authenticateOptional, BookingController.cancelBooking);

module.exports = router;
