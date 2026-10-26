const { z } = require('zod');

const createBookingSchema = z.preprocess((val) => {
  if (val && typeof val === 'object') {
    const parseNum = (v) => (v !== undefined && v !== null && v !== '' ? Number(v) : v);
    return {
      Farmer_ID: parseNum(val.Farmer_ID !== undefined ? val.Farmer_ID : val.farmerId),
      Slot_ID: parseNum(val.Slot_ID !== undefined ? val.Slot_ID : val.slotId),
      Produce_ID: parseNum(val.Produce_ID !== undefined ? val.Produce_ID : val.produceId),
      Estimated_Weight_Tons: parseNum(val.Estimated_Weight_Tons !== undefined ? val.Estimated_Weight_Tons : (val.estimatedWeightTons !== undefined ? val.estimatedWeightTons : val.weight))
    };
  }
  return val;
}, z.object({
  Farmer_ID: z.number().int().positive('Farmer ID must be a positive integer'),
  Slot_ID: z.number().int().positive('Slot ID must be a positive integer'),
  Produce_ID: z.number().int().positive('Produce ID must be a positive integer'),
  Estimated_Weight_Tons: z.number().positive('Estimated weight must be greater than 0 tons').max(500, 'Weight exceeds single slot transaction limit')
}));

const bookingIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Booking ID must be a positive integer').transform(val => parseInt(val, 10))
});

const bookingTokenParamSchema = z.object({
  token: z.string().trim().min(3).max(20, 'Token length is invalid')
});

const filterBookingsQuerySchema = z.object({
  status: z.enum(['Confirmed', 'Checked-In', 'Completed', 'Cancelled']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD').optional(),
  mandiId: z.string().regex(/^\d+$/).transform(val => parseInt(val, 10)).optional(),
  farmerId: z.string().regex(/^\d+$/).transform(val => parseInt(val, 10)).optional(),
  token: z.string().trim().optional(),
  page: z.string().regex(/^\d+$/).transform(val => parseInt(val, 10)).default('1'),
  limit: z.string().regex(/^\d+$/).transform(val => parseInt(val, 10)).default('20')
});

module.exports = {
  createBookingSchema,
  bookingIdParamSchema,
  bookingTokenParamSchema,
  filterBookingsQuerySchema
};
