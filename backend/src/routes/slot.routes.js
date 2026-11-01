const express = require('express');
const SlotController = require('../controllers/slot.controller');
const { authenticate, requireRole } = require('../middleware/authenticate');

const router = express.Router();

router.get('/', SlotController.getAllSlots);
router.get('/utilization', SlotController.getUtilization);
router.get('/:id', SlotController.getSlotById);

// Protected Admin / Officer slot management
router.post('/', authenticate, requireRole('Admin', 'Mandi_Officer'), SlotController.createSlot);
router.patch('/:id', authenticate, requireRole('Admin', 'Mandi_Officer'), SlotController.updateSlot);
router.delete('/:id', authenticate, requireRole('Admin', 'Mandi_Officer'), SlotController.deleteSlot);

module.exports = router;
