const express = require('express');
const TransactionController = require('../controllers/transaction.controller');
const validateRequest = require('../middleware/validateRequest');
const { createTransactionSchema, transactionIdParamSchema } = require('../validators/transaction.validator');
const { authenticate, requireRole } = require('../middleware/authenticate');

const router = express.Router();

router.get('/', TransactionController.getAllTransactions);
router.get('/summary', TransactionController.getSummary);
router.get('/traders', TransactionController.getAllTraders);
router.get('/warehouses', TransactionController.getAllWarehouses);
router.get('/:id', validateRequest({ params: transactionIdParamSchema }), TransactionController.getTransactionById);

// Recording transactions requires authentication
router.post(
  '/',
  authenticate,
  requireRole('Admin', 'Mandi_Officer'),
  validateRequest({ body: createTransactionSchema }),
  TransactionController.createTransaction
);

module.exports = router;
