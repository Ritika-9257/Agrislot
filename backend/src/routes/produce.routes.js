const express = require('express');
const ProduceController = require('../controllers/produce.controller');
const { authenticate, requireRole } = require('../middleware/authenticate');

const router = express.Router();

router.get('/', ProduceController.getAllProduce);
router.get('/:id', ProduceController.getProduceById);

// Protected Admin / Officer produce catalog management
router.post('/', authenticate, requireRole('Admin', 'Mandi_Officer'), ProduceController.createProduce);
router.patch('/:id', authenticate, requireRole('Admin', 'Mandi_Officer'), ProduceController.updateProduce);
router.delete('/:id', authenticate, requireRole('Admin', 'Mandi_Officer'), ProduceController.deleteProduce);

module.exports = router;
