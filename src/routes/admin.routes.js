const express = require('express');
const AdminController = require('../controllers/admin.controller');
const BookingController = require('../controllers/booking.controller');
const FarmerController = require('../controllers/farmer.controller');
const SlotController = require('../controllers/slot.controller');
const TransactionController = require('../controllers/transaction.controller');

const { authenticate, requireRole, requireActiveRole } = require('../middleware/authenticate');
const validateRequest = require('../middleware/validateRequest');
const { bookingIdParamSchema, filterBookingsQuerySchema } = require('../validators/booking.validator');
const { updateBookingStatusSchema, updatePaymentStatusSchema } = require('../validators/admin.validator');
const { transactionIdParamSchema } = require('../validators/transaction.validator');

const router = express.Router();

// Enforce authentication & live database role check for all admin routes (guards against stale JWTs)
router.use(authenticate, requireActiveRole('Admin', 'Mandi_Officer'));

// Dashboard Overview (supports ?date=YYYY-MM-DD&mandiId=1)
router.get('/dashboard', AdminController.getDashboard);

// User & Role Management (Listing permitted for Admin/Officer; Role modification strictly Admin)
router.get('/users', AdminController.getAllUsers);
router.get('/users/:id', AdminController.getUserById);
router.patch('/users/:id/role', requireActiveRole('Admin'), AdminController.updateUserRole);

// Audit History (Protected, read-only audit records)
router.get('/audit-logs', AdminController.getAuditLogs);

// CSV Data Exports (Protected, formula-injection safe RFC 4180)
router.get('/export/bookings.csv', AdminController.exportBookingsCsv);
router.get('/export/transactions.csv', AdminController.exportTransactionsCsv);
router.get('/export/farmers.csv', AdminController.exportFarmersCsv);
router.get('/export/utilization.csv', AdminController.exportUtilizationCsv);

// Booking Management
router.get('/bookings', validateRequest({ query: filterBookingsQuerySchema }), BookingController.getAllBookings);
router.get('/bookings/:id', validateRequest({ params: bookingIdParamSchema }), BookingController.getBookingById);
router.patch(
  '/bookings/:id/status',
  validateRequest({ params: bookingIdParamSchema, body: updateBookingStatusSchema }),
  BookingController.updateBookingStatus
);

// Farmer Directory
router.get('/farmers', FarmerController.getAllFarmers);
router.get('/farmers/:id', FarmerController.getFarmerById);

// Slot & Mandi Utilization
router.get('/slots/utilization', SlotController.getUtilization);

// Transaction & Payment Management
router.get('/transactions', TransactionController.getAllTransactions);
router.get('/transactions/summary', TransactionController.getSummary);
router.get('/transactions/:id', validateRequest({ params: transactionIdParamSchema }), TransactionController.getTransactionById);
router.patch(
  '/transactions/:id/payment-status',
  validateRequest({ params: transactionIdParamSchema, body: updatePaymentStatusSchema }),
  TransactionController.updatePaymentStatus
);

// Reference data
router.get('/traders', TransactionController.getAllTraders);
router.get('/warehouses', TransactionController.getAllWarehouses);

// Database Maintenance (Exclusively restricted to Admin role with production guards)
router.post('/reset-database', requireActiveRole('Admin'), AdminController.resetDatabase);

module.exports = router;
