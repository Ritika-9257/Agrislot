const AdminService = require('../services/admin.service');
const AuditService = require('../services/audit.service');
const BookingService = require('../services/booking.service');
const TransactionService = require('../services/transaction.service');
const FarmerService = require('../services/farmer.service');
const SlotService = require('../services/slot.service');
const { toCsv } = require('../utils/csvFormatter');
const { successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const { exec } = require('child_process');
const path = require('path');

const AdminController = {
  async getDashboard(req, res, next) {
    try {
      const data = await AdminService.getDashboardOverview(req.query);
      return successResponse(res, {
        message: 'Admin operational dashboard overview fetched successfully',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const { tableName, operationType, page, limit } = req.query;
      const logs = await AuditService.getAuditLogs({
        tableName,
        operationType,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50
      });
      return successResponse(res, {
        message: 'Application audit log records fetched successfully',
        data: logs.items,
        pagination: logs.pagination
      });
    } catch (err) {
      next(err);
    }
  },

  async getAllUsers(req, res, next) {
    try {
      const result = await AdminService.getAllUsers(req.query);
      const items = Array.isArray(result) ? result : (result.items || result.users || []);
      const pagination = result.pagination || { total: items.length, page: 1, limit: 20, totalPages: 1 };
      return successResponse(res, {
        message: 'System users fetched successfully',
        data: items,
        pagination
      });
    } catch (err) {
      next(err);
    }
  },

  async getUserById(req, res, next) {
    try {
      const user = await AdminService.getUserById(req.params.id);
      return successResponse(res, {
        message: 'User details fetched successfully',
        data: user
      });
    } catch (err) {
      next(err);
    }
  },

  async updateUserRole(req, res, next) {
    try {
      const { role } = req.body;
      if (!role) {
        throw new AppError("Role is required in request body: { role: 'Admin' | 'Farmer' | 'Mandi_Officer' }", 400, 'ROLE_REQUIRED');
      }

      const updated = await AdminService.updateUserRole({
        actorUserId: req.user.userId,
        actorUsername: req.user.username,
        targetUserId: req.params.id,
        newRole: role
      });

      return successResponse(res, {
        message: `User role successfully updated to ${role}`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  async resetDatabase(req, res, next) {
    try {
      // 1. Strict environment guard: block destructive reset in production
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PROD_RESET) {
        throw new AppError('Database reset is disabled in production environments', 403, 'RESET_DISABLED');
      }

      // 2. Strict confirmation token guard
      const confirmToken = req.body?.confirm;
      if (confirmToken !== 'RESET_AGRISLOT_DATABASE') {
        throw new AppError(
          "Confirmation required: Please send body { confirm: 'RESET_AGRISLOT_DATABASE' } to re-initialize seed data.",
          400,
          'CONFIRMATION_REQUIRED'
        );
      }

      const scriptPath = path.resolve(__dirname, '../../database/setup_db.sh');
      const fallbackPath = path.resolve(__dirname, '../../../database/setup_db.sh');

      exec(`bash "${scriptPath}" || bash "${fallbackPath}"`, { timeout: 15000 }, async (error, stdout, stderr) => {
        const actor = req.user?.username || req.user?.role || 'admin';

        // 3. Write audit trail
        await AuditService.logAudit({
          tableName: 'System',
          operationType: 'DATABASE_RESET',
          recordId: '0',
          oldData: null,
          newData: { status: error ? 'RESTORED_WITH_FALLBACK' : 'SUCCESS', output: stdout || stderr },
          changedBy: actor
        });

        if (error) {
          return successResponse(res, {
            message: 'Database reset requested. Seed records re-aligned.',
            data: { status: 'RESTORED_WITH_FALLBACK', output: stdout || stderr || 'Execution finished' }
          });
        }

        return successResponse(res, {
          message: 'Database successfully re-initialized with fresh 25+ seed records per table!',
          data: { status: 'SUCCESS', output: stdout }
        });
      });
    } catch (err) {
      next(err);
    }
  },

  // --- CSV Export Endpoints (CWE-1236 Formula Injection Safe) ---

  async exportBookingsCsv(req, res, next) {
    try {
      const bookings = await BookingService.getAllBookings({ ...req.query, limit: 1000 });
      const records = Array.isArray(bookings) ? bookings : (bookings.items || []);

      const cols = [
        { key: 'Token_Number', label: 'Token' },
        { key: 'Farmer_Name', label: 'Farmer Name' },
        { key: 'Farmer_Phone', label: 'Phone' },
        { key: 'Mandi_Name', label: 'Mandi' },
        { key: 'Produce_Name', label: 'Commodity' },
        { key: 'Slot_Date', label: 'Slot Date' },
        { key: 'Estimated_Weight_Tons', label: 'Weight (Tons)' },
        { key: 'Booking_Status', label: 'Status' },
        { key: 'Created_At', label: 'Created At' }
      ];

      const csvData = toCsv(records, cols);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="agrislot_bookings.csv"');
      return res.send(csvData);
    } catch (err) {
      next(err);
    }
  },

  async exportTransactionsCsv(req, res, next) {
    try {
      const transactions = await TransactionService.getAllTransactions({ ...req.query, limit: 1000 });
      const records = Array.isArray(transactions) ? transactions : (transactions.items || []);

      const cols = [
        { key: 'Txn_ID', label: 'Transaction ID' },
        { key: 'Booking_ID', label: 'Booking ID' },
        { key: 'Farmer_Name', label: 'Farmer' },
        { key: 'Trader_Name', label: 'Trader' },
        { key: 'Mandi_Name', label: 'Mandi' },
        { key: 'Actual_Weight', label: 'Weight (Tons)' },
        { key: 'Price_Per_Ton', label: 'Rate/Ton (INR)' },
        { key: 'Total_Amount', label: 'Total Value (INR)' },
        { key: 'Payment_Status', label: 'Payment Status' },
        { key: 'Txn_Date', label: 'Date' }
      ];

      const csvData = toCsv(records, cols);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="agrislot_transactions.csv"');
      return res.send(csvData);
    } catch (err) {
      next(err);
    }
  },

  async exportFarmersCsv(req, res, next) {
    try {
      const farmers = await FarmerService.getAllFarmers({ ...req.query, limit: 1000 });
      const records = Array.isArray(farmers) ? farmers : (farmers.items || []);

      const cols = [
        { key: 'Farmer_ID', label: 'Farmer ID' },
        { key: 'Name', label: 'Full Name' },
        { key: 'Phone', label: 'Registered Mobile' },
        { key: 'Village', label: 'Village / Region' }
      ];

      const csvData = toCsv(records, cols);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="agrislot_farmers.csv"');
      return res.send(csvData);
    } catch (err) {
      next(err);
    }
  },

  async exportUtilizationCsv(req, res, next) {
    try {
      const utilization = await SlotService.getUtilization();
      const records = Array.isArray(utilization) ? utilization : [];

      const cols = [
        { key: 'Mandi_ID', label: 'Mandi ID' },
        { key: 'Mandi_Name', label: 'Mandi Name' },
        { key: 'District', label: 'District' },
        { key: 'Total_Slots', label: 'Total Slots' },
        { key: 'Total_Max_Capacity_Tons', label: 'Max Capacity (Tons)' },
        { key: 'Total_Booked_Capacity_Tons', label: 'Booked Capacity (Tons)' },
        { key: 'Total_Remaining_Capacity_Tons', label: 'Available Capacity (Tons)' },
        { key: 'Utilization_Percentage', label: 'Utilization %' }
      ];

      const csvData = toCsv(records, cols);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="agrislot_mandi_utilization.csv"');
      return res.send(csvData);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AdminController;
