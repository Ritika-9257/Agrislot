const TransactionRepository = require('../repositories/transaction.repository');
const BookingRepository = require('../repositories/booking.repository');
const AuditService = require('./audit.service');
const NotificationService = require('./notification.service');
const { AppError } = require('../middleware/errorHandler');

const TransactionService = {
  async getAllTransactions(filters) {
    return TransactionRepository.findAll(filters);
  },

  async getTransactionById(txnId) {
    const txn = await TransactionRepository.findById(txnId);
    if (!txn) {
      throw new AppError(`Transaction with ID ${txnId} not found`, 404, 'TRANSACTION_NOT_FOUND');
    }
    return txn;
  },

  async updatePaymentStatus(txnId, paymentStatus) {
    const validStatuses = ['Pending', 'Released', 'Failed'];
    if (!validStatuses.includes(paymentStatus)) {
      throw new AppError(`Invalid payment status: ${paymentStatus}. Must be one of: ${validStatuses.join(', ')}`, 400, 'INVALID_PAYMENT_STATUS');
    }

    const current = await this.getTransactionById(txnId);
    await TransactionRepository.updatePaymentStatus(txnId, paymentStatus);

    AuditService.logAudit({
      tableName: 'Transactions',
      operationType: 'PAYMENT_UPDATE',
      recordId: txnId,
      oldData: { Payment_Status: current.Payment_Status },
      newData: { Payment_Status: paymentStatus },
      changedBy: 'admin'
    });

    NotificationService.notify({
      title: `Payment ${paymentStatus} for Txn #${txnId}`,
      message: `Direct bank transfer of ₹${current.Total_Amount || 'N/A'} is now '${paymentStatus}'.`,
      type: 'PAYMENT_UPDATED',
      entityType: 'Transaction',
      entityId: txnId
    });

    return {
      txnId,
      previousPaymentStatus: current.Payment_Status,
      paymentStatus
    };
  },

  async createTransaction(data) {
    // 1. Check if booking exists
    const booking = await BookingRepository.findById(data.Booking_ID);
    if (!booking) {
      throw new AppError(`Booking with ID ${data.Booking_ID} not found`, 404, 'BOOKING_NOT_FOUND');
    }

    // 2. Validate booking status (must be Checked-In or Completed)
    if (booking.Booking_Status === 'Cancelled') {
      throw new AppError('Cannot create transaction for a cancelled booking', 400, 'CANNOT_TRANSACT_CANCELLED');
    }

    // 3. Create transaction (Total_Amount is calculated by MySQL stored generated column)
    const txnId = await TransactionRepository.create(data);
    return this.getTransactionById(txnId);
  },

  async getSummary() {
    return TransactionRepository.getSummary();
  },

  async getAllTraders() {
    return TransactionRepository.findAllTraders();
  },

  async createTrader({ Name, License_No, Phone }) {
    if (!Name || !License_No || !Phone) {
      throw new AppError('Name, License_No, and Phone are required for Trader', 400, 'VALIDATION_ERROR');
    }
    return TransactionRepository.createTrader({ Name, License_No, Phone });
  },

  async getAllWarehouses() {
    return TransactionRepository.findAllWarehouses();
  },

  async createWarehouse({ Mandi_ID, Warehouse_Type, Total_Capacity }) {
    if (!Mandi_ID || !Warehouse_Type || !Total_Capacity) {
      throw new AppError('Mandi_ID, Warehouse_Type, and Total_Capacity are required for Warehouse', 400, 'VALIDATION_ERROR');
    }
    const validTypes = ['Dry Storage', 'Cold Storage', 'Silo'];
    if (!validTypes.includes(Warehouse_Type)) {
      throw new AppError(`Invalid Warehouse_Type. Must be one of: ${validTypes.join(', ')}`, 400, 'INVALID_WAREHOUSE_TYPE');
    }
    return TransactionRepository.createWarehouse({ Mandi_ID, Warehouse_Type, Total_Capacity });
  }
};

module.exports = TransactionService;
