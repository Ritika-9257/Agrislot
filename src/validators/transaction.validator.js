const { z } = require('zod');

const createTransactionSchema = z.object({
  Booking_ID: z.number().int().positive('Booking ID must be a positive integer'),
  Trader_ID: z.number().int().positive('Trader ID must be a positive integer'),
  Warehouse_ID: z.number().int().positive('Warehouse ID must be a positive integer'),
  Actual_Weight: z.number().positive('Actual weight must be greater than 0 tons'),
  Quality_Grade: z.enum(['Grade A', 'Grade B', 'Grade C'], {
    errorMap: () => ({ message: "Quality grade must be 'Grade A', 'Grade B', or 'Grade C'" })
  }),
  Price_Per_Ton: z.number().nonnegative('Price per ton cannot be negative'),
  Payment_Status: z.enum(['Pending', 'Released', 'Failed']).default('Pending')
});

const transactionIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Transaction ID must be a positive integer').transform(val => parseInt(val, 10))
});

module.exports = {
  createTransactionSchema,
  transactionIdParamSchema
};
