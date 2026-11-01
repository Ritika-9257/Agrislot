const { z } = require('zod');

const loginSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const normalizeBookingStatus = (val) => {
  if (typeof val !== 'string') return val;
  const upper = val.toUpperCase().replace(/_/g, '-');
  if (upper === 'CHECKED-IN') return 'Checked-In';
  if (upper === 'IN-PROCESS' || upper === 'IN PROCESS') return 'In Process';
  if (upper === 'CONFIRMED') return 'Confirmed';
  if (upper === 'COMPLETED') return 'Completed';
  if (upper === 'CANCELLED') return 'Cancelled';
  if (upper === 'NO-SHOW' || upper === 'NOSHOW') return 'No-Show';
  return val;
};

const updateBookingStatusSchema = z.object({
  Booking_Status: z.preprocess(
    normalizeBookingStatus,
    z.enum(['Confirmed', 'Checked-In', 'In Process', 'Completed', 'Cancelled', 'No-Show'], {
      errorMap: () => ({ message: "Booking status must be one of: Confirmed, Checked-In, In Process, Completed, Cancelled, No-Show" })
    })
  )
});

const updatePaymentStatusSchema = z.object({
  Payment_Status: z.enum(['Pending', 'Released', 'Failed'], {
    errorMap: () => ({ message: "Payment status must be one of: Pending, Released, Failed" })
  })
});

module.exports = {
  loginSchema,
  updateBookingStatusSchema,
  updatePaymentStatusSchema
};
