const TransactionService = require('../services/transaction.service');
const { successResponse } = require('../utils/apiResponse');

const TransactionController = {
  async getAllTransactions(req, res, next) {
    try {
      const { paymentStatus, page, limit } = req.query;
      const transactions = await TransactionService.getAllTransactions({
        paymentStatus,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20
      });
      return successResponse(res, {
        message: 'Transactions fetched successfully',
        data: transactions
      });
    } catch (err) {
      next(err);
    }
  },

  async getTransactionById(req, res, next) {
    try {
      const txnId = parseInt(req.params.id, 10);
      const transaction = await TransactionService.getTransactionById(txnId);
      return successResponse(res, {
        message: 'Transaction details fetched successfully',
        data: transaction
      });
    } catch (err) {
      next(err);
    }
  },

  async createTransaction(req, res, next) {
    try {
      const transaction = await TransactionService.createTransaction(req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Transaction recorded successfully with calculated total amount',
        data: transaction
      });
    } catch (err) {
      next(err);
    }
  },

  async updatePaymentStatus(req, res, next) {
    try {
      const txnId = parseInt(req.params.id, 10);
      const { Payment_Status } = req.body;
      const result = await TransactionService.updatePaymentStatus(txnId, Payment_Status);
      return successResponse(res, {
        message: 'Payment status updated successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async getSummary(req, res, next) {
    try {
      const summary = await TransactionService.getSummary();
      return successResponse(res, {
        message: 'Transaction totals and payment summaries fetched',
        data: summary
      });
    } catch (err) {
      next(err);
    }
  },

  async getAllTraders(req, res, next) {
    try {
      const traders = await TransactionService.getAllTraders();
      return successResponse(res, {
        message: 'Traders fetched successfully',
        data: traders
      });
    } catch (err) {
      next(err);
    }
  },

  async createTrader(req, res, next) {
    try {
      const trader = await TransactionService.createTrader(req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Trader created successfully',
        data: trader
      });
    } catch (err) {
      next(err);
    }
  },

  async getAllWarehouses(req, res, next) {
    try {
      const warehouses = await TransactionService.getAllWarehouses();
      return successResponse(res, {
        message: 'Warehouses fetched successfully',
        data: warehouses
      });
    } catch (err) {
      next(err);
    }
  },

  async createWarehouse(req, res, next) {
    try {
      const warehouse = await TransactionService.createWarehouse(req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Warehouse created successfully',
        data: warehouse
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = TransactionController;
